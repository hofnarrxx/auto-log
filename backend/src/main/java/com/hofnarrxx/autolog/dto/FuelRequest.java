package com.hofnarrxx.autolog.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record FuelRequest(
        @NotNull
        LocalDate date,
        @NotNull @PositiveOrZero @Max(10_000_000)
        Integer mileage,
        @NotNull @PositiveOrZero @Digits(integer = 10, fraction = 2) 
        BigDecimal cost,
        @NotNull @Positive @Digits(integer = 9, fraction = 3) 
        BigDecimal amount,
        @Size(max = 50)
        String gasStation,
        @NotBlank 
        String currency
) {
}
