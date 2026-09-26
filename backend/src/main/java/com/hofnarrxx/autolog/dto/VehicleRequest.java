package com.hofnarrxx.autolog.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record VehicleRequest(
        @Size(min = 1, max = 60)
        String make,
        @Size(min = 1, max = 60)
        String model,
        String fuelType,
        @Min(0) @Max(10_000_000)
        Integer mileage,
        @Min(1886)
        Integer year,
        @Size(max = 20)
        String licensePlate,
        String imageKey
) {
}
