package com.github.laplusijns;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import java.time.Duration;
import java.util.Collection;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.jspecify.annotations.NonNull;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;
import reactor.util.concurrent.Queues;

@Service
public class ImageCache {

    private final Sinks.Many<ImageCacheEvent> sink =
            Sinks.many().multicast().onBackpressureBuffer(Queues.SMALL_BUFFER_SIZE, false);
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final Cache<String, FileObject> fileCache;

    public ImageCache(final JocbProperties jocbProperties) {
        this.fileCache = Caffeine.newBuilder()
                .expireAfterWrite(
                        jocbProperties.getImageTimeout().getValue(),
                        jocbProperties.getImageTimeout().getUnit())
                .maximumSize(jocbProperties.getImageTimeout().getMaxSize())
                .removalListener((key, value, cause) -> {
                    if (value != null && cause.wasEvicted()) {
                        executor.submit(() -> sink.tryEmitNext(ImageCacheEvent.delete(key.toString())));
                    }
                })
                .build();
    }

    public Collection<@NonNull FileObject> all() {
        return fileCache.asMap().values();
    }

    public void put(final FileObject fileObject) {
        fileCache.put(fileObject.uuid(), fileObject);
        executor.submit(() -> sink.tryEmitNext(ImageCacheEvent.add(fileObject)));
    }

    public void delete(final String uuid) {
        fileCache.invalidate(uuid);
        executor.submit(() -> sink.tryEmitNext(ImageCacheEvent.delete(uuid)));
    }

    public byte[] blob(final String uuid) {
        final FileObject fileObject = fileCache.getIfPresent(uuid);
        return fileObject == null ? new byte[] {} : fileObject.bytes();
    }

    public FileObject file(final String uuid) {
        return fileCache.getIfPresent(uuid);
    }

    public byte[] thumbnail(final String uuid) {
        final FileObject fileObject = fileCache.getIfPresent(uuid);
        if (fileObject != null && fileObject.thumbnail() != null) {
            return fileObject.thumbnail().bytes();
        }
        return new byte[] {};
    }

    public Collection<String> keys() {
        return fileCache.asMap().keySet();
    }

    public Flux<List<ImageCacheEvent>> sub() {
        return sink.asFlux().buffer(Duration.ofSeconds(1l));
    }

    public void deleteAllFiles() {
        fileCache.invalidateAll();
        executor.submit(() -> sink.tryEmitNext(ImageCacheEvent.deleteAll()));
    }
}
