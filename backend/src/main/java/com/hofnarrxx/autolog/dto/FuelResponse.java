package com.hofnarrxx.autolog.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record FuelResponse(
        Long id,
        Long vehicleId,
        LocalDate date,
        Integer mileage,
        BigDecimal cost,
        BigDecimal amount,
        String gasStation,
        Instant createdAt,
        Instant updatedAt
) {
}
