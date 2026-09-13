package com.hofnarrxx.autolog.dto;

import java.time.Instant;
import java.util.UUID;

public record ShareLinkResponse(
        UUID id,
        String token,
        UUID carId,
        UUID createdBy,
        Instant createdAt,
        Instant expiresAt,
        boolean revoked,
        boolean includeAttachments
) {
}

