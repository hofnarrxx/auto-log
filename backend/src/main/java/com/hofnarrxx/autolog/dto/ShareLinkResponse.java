package com.hofnarrxx.autolog.dto;

import java.time.Instant;

public record ShareLinkResponse(
        Long id,
        String token,
        Long carId,
        Long createdBy,
        Instant createdAt,
        Instant expiresAt,
        boolean revoked
) {
}

