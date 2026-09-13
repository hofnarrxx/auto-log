package com.hofnarrxx.autolog.dto;

import java.time.Instant;
import java.util.UUID;

public record MaintenanceAttachmentResponse(
        UUID id,
        String fileName,
        String contentType,
        Long sizeBytes,
        String url,
        Instant createdAt
) {
}
