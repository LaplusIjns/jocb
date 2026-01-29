package com.github.laplusijns.ocr;

import org.jspecify.annotations.NonNull;

public record OcrResponse(Result result, @NonNull String response) {

    public static OcrResponse success(final String response) {
        return new OcrResponse(Result.SUCCESS, response);
    }

    public static OcrResponse error(final String response) {
        return new OcrResponse(Result.ERROR, response);
    }

    enum Result {
        SUCCESS,
        ERROR
    }
}
