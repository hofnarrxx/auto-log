package com.hofnarrxx.autolog.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record MaintenanceResponse(
        UUID id,
        UUID vehicleId,
        LocalDate serviceDate,
        String title,
        Integer mileage,
        String category,
        String description,
        BigDecimal cost,
        String currency,
        List<MaintenanceAttachmentResponse> attachments,
        Instant createdAt,
        Instant updatedAt
) {
}
