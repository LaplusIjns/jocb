package com.github.laplusijns;

import org.jspecify.annotations.NonNull;

public record TextCacheEvent(String type, @NonNull String text) {
    public static TextCacheEvent add(final String text) {
        return new TextCacheEvent("ADD", text);
    }

    public static TextCacheEvent delete(final String text) {
        return new TextCacheEvent("DELETE", text);
    }

    public static TextCacheEvent deleteAll() {
        return new TextCacheEvent("DELETE_ALL", "");
    }
}
