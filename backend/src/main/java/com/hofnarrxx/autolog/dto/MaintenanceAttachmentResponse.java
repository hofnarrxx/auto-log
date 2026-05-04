package com.hofnarrxx.autolog.dto;

import java.time.Instant;

public record MaintenanceAttachmentResponse(
        Long id,
        String fileName,
        String contentType,
        Long sizeBytes,
        String url,
        Instant createdAt
) {
}
