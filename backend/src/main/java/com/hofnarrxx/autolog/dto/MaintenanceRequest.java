package com.hofnarrxx.autolog.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record MaintenanceRequest(
        @NotNull
        LocalDate serviceDate,
        @NotBlank @Size(max = 50)
        String title,
        @NotNull @PositiveOrZero @Max(10_000_000)
        Integer mileage,
        @NotBlank
        String category,
        @Size(max = 200)
        String description,
        @NotNull @PositiveOrZero @Digits(integer = 10, fraction = 2) 
        BigDecimal cost,
        @NotBlank 
        String currency
) {
}
