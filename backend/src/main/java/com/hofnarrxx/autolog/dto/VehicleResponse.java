package com.hofnarrxx.autolog.dto;

public record VehicleResponse(
        Long id,
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
