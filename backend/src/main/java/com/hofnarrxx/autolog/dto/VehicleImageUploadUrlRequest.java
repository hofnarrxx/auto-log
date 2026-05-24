package com.hofnarrxx.autolog.dto;

public record VehicleImageUploadUrlRequest(
        String fileName,
        String contentType,
        Long sizeBytes
) {
}
