package com.hofnarrxx.autolog.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record FuelRequest(
        LocalDate date,
        Integer mileage,
        BigDecimal cost,
        BigDecimal amount,
        String gasStation
) {
}

