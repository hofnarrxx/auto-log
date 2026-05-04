package com.hofnarrxx.autolog.dto;

public record MaintenanceAttachmentRequest(
        String objectKey,
        String fileName,
        String contentType,
        Long sizeBytes
) {
}
