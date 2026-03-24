package com.hofnarrxx.autolog.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record MaintenanceResponse(
        Long id,
        Long vehicleId,
        LocalDate serviceDate,
        Integer mileage,
        String category,
        String description,
        BigDecimal cost,
        Instant createdAt,
        Instant updatedAt
) {
}

