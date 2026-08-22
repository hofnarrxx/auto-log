package com.hofnarrxx.autolog.dto;

public record PublicVehicleAccessResponse(
        Long carId,
        String brand,
        String model,
        String fuelType,
        Double mileage,
        Integer year,
        FuelSummaryResponse fuelSummary,
        MaintenanceSummaryResponse maintenanceSummary
) {
}

