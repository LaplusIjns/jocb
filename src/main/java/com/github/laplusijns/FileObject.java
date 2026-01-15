package com.github.laplusijns;

import com.fasterxml.jackson.annotation.JsonIgnore;

public record FileObject(
        String originalFilename,
        @JsonIgnore byte[] bytes,
        String uuid,
        Integer width,
        Integer height,
        String contentType) {}
