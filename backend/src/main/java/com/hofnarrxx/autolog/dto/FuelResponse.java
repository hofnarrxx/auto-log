package com.hofnarrxx.autolog.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record FuelResponse(
        UUID id,
        UUID vehicleId,
        LocalDate date,
        Integer mileage,
        BigDecimal cost,
        BigDecimal amount,
        String gasStation,
        String currency,
        Instant createdAt,
        Instant updatedAt
) {
}
