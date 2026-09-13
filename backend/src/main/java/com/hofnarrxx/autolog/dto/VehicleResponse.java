package com.hofnarrxx.autolog.dto;

import java.util.UUID;

public record VehicleResponse(
        UUID id,
        String brand,
        String model,
        String fuelType,
        Double mileage,
        Integer year,
        String licensePlate,
        String imageKey,
        String imageUrl
) {
}
