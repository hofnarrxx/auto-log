package com.hofnarrxx.autolog.dto;

import java.time.Instant;

public record ShareLinkCreateRequest(
        Long carId,
        Instant expiresAt,
        Boolean includeAttachments
) {
}

