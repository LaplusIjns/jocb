package com.github.laplusijns;

import org.jspecify.annotations.NonNull;

public record ImageCacheEvent(
        EventType type, // ADD / DELETE
        @NonNull String uuid,
        String originalFilename,
        Integer width,
        Integer height,
        String contentType) {
    public static ImageCacheEvent add(final FileObject f) {
        return new ImageCacheEvent(
                EventType.ADD, f.uuid(), f.originalFilename(), f.width(), f.height(), f.contentType());
    }

    public static ImageCacheEvent delete(final String uuid) {
        return new ImageCacheEvent(EventType.DELETE, uuid, null, null, null, null);
    }

    public static ImageCacheEvent deleteAll() {
        return new ImageCacheEvent(EventType.DELETE_ALL, "", null, null, null, null);
    }
}
