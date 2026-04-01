package com.hofnarrxx.autolog.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MaintenanceRequest(
        LocalDate serviceDate,
        String title,
        Integer mileage,
        String category,
        String description,
        BigDecimal cost,
        String currency
) {
}
