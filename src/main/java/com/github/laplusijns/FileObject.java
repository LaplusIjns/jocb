package com.github.laplusijns;

import com.fasterxml.jackson.annotation.JsonIgnore;

public record FileObject(
        Long expired,
        String originalFilename,
        @JsonIgnore byte[] bytes,
        String uuid,
        Integer width,
        Integer height,
        String contentType,
        Thumbnail thumbnail) {

    static record Thumbnail(
            Integer width, Integer height, @JsonIgnore byte[] bytes) {}
}
