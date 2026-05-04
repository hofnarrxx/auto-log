package com.hofnarrxx.autolog.dto;

public record MaintenanceUploadUrlRequest(
        String fileName,
        String contentType,
        Long sizeBytes
) {
}
