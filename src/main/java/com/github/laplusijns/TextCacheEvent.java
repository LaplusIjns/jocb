package com.github.laplusijns;

import org.jspecify.annotations.NonNull;

public record TextCacheEvent(EventType type, @NonNull String text) {
    public static TextCacheEvent add(final String text) {
        return new TextCacheEvent(EventType.ADD, text);
    }

    public static TextCacheEvent delete(final String text) {
        return new TextCacheEvent(EventType.DELETE, text);
    }

    public static TextCacheEvent deleteAll() {
        return new TextCacheEvent(EventType.DELETE_ALL, "");
    }
}
