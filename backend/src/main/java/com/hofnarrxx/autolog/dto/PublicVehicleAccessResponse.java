package com.hofnarrxx.autolog.dto;

import java.util.List;

public record PublicVehicleAccessResponse(
        Long carId,
        String brand,
        String model,
        String fuelType,
        Double mileage,
        Integer year,
        List<FuelResponse> fuelEntries,
        List<MaintenanceResponse> maintenanceEntries
) {
}

