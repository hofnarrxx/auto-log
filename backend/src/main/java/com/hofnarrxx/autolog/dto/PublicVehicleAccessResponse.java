package com.hofnarrxx.autolog.dto;

import java.util.UUID;

public record PublicVehicleAccessResponse(
        UUID carId,
        String brand,
        String model,
        String fuelType,
        Double mileage,
        Integer year,
        FuelSummaryResponse fuelSummary,
        MaintenanceSummaryResponse maintenanceSummary
) {
}

