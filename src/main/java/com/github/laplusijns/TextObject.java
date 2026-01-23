package com.github.laplusijns;

import org.jspecify.annotations.NonNull;

public record TextObject(Long expired, @NonNull String text) {}
