package com.github.laplusijns;

import org.jspecify.annotations.NonNull;

public record ImageCacheEvent(
        String type, // ADD / DELETE
        @NonNull String uuid,
        String filename,
        Integer width,
        Integer height,
        String contentType) {
    public static ImageCacheEvent add(final FileObject f) {
        return new ImageCacheEvent("ADD", f.uuid(), f.originalFilename(), f.width(), f.height(), f.contentType());
    }

    public static ImageCacheEvent delete(final String uuid) {
        return new ImageCacheEvent("DELETE", uuid, null, null, null, null);
    }

    public static ImageCacheEvent deleteAll() {
        return new ImageCacheEvent("DELETE_ALL", "", null, null, null, null);
    }
}
