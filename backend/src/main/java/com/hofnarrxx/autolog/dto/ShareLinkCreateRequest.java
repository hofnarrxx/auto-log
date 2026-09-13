package com.hofnarrxx.autolog.dto;

import java.time.Instant;
import java.util.UUID;

public record ShareLinkCreateRequest(
        UUID carId,
        Instant expiresAt,
        Boolean includeAttachments
) {
}

