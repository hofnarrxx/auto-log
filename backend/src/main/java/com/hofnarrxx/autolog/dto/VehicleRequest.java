package com.hofnarrxx.autolog.dto;

public record VehicleRequest(
        String brand,
        String model,
        String fuelType,
        Double mileage,
        Integer year,
        String licensePlate,
        String imageKey
) {
}
