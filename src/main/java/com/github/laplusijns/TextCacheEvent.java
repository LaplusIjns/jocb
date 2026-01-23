package com.github.laplusijns;

import org.jspecify.annotations.NonNull;

public record TextCacheEvent(
        Long expired, EventType type, @NonNull String text) {
    public static TextCacheEvent add(final TextObject textObject) {
        return new TextCacheEvent(textObject.expired(), EventType.ADD, textObject.text());
    }

    public static TextCacheEvent delete(final String text) {
        return new TextCacheEvent(null, EventType.DELETE, text);
    }

    public static TextCacheEvent deleteAll() {
        return new TextCacheEvent(null, EventType.DELETE_ALL, "");
    }
}
