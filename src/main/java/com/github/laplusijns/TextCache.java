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
public class TextCache {

    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final Sinks.Many<TextCacheEvent> sink =
            Sinks.many().multicast().onBackpressureBuffer(Queues.SMALL_BUFFER_SIZE, false);

    private final Cache<String, TextObject> fileCache;

    public TextCache(final JocbProperties jocbProperties) {
        this.fileCache = Caffeine.newBuilder()
                .expireAfterWrite(
                        jocbProperties.getTextTimeout().getValue(),
                        jocbProperties.getTextTimeout().getUnit())
                .maximumSize(jocbProperties.getTextTimeout().getMaxSize())
                .removalListener((key, value, cause) -> {
                    if (value != null && cause.wasEvicted()) {
                        executor.submit(() -> sink.tryEmitNext(TextCacheEvent.delete(key.toString())));
                    }
                })
                .build();
    }

    public void put(final TextObject textObject) {
        fileCache.put(textObject.text(), textObject);
        executor.submit(() -> sink.tryEmitNext(TextCacheEvent.add(textObject)));
    }

    public void delete(final String text) {
        fileCache.invalidate(text);
        executor.submit(() -> sink.tryEmitNext(TextCacheEvent.delete(text)));
    }

    public Collection<@NonNull TextObject> keys() {
        return fileCache.asMap().values();
    }

    public Flux<List<TextCacheEvent>> sub() {
        return sink.asFlux().buffer(Duration.ofSeconds(1l));
    }

    public void deleteAllTexts() {
        fileCache.invalidateAll();
        executor.submit(() -> sink.tryEmitNext(TextCacheEvent.deleteAll()));
    }
}
