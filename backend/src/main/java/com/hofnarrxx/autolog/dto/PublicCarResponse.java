package com.hofnarrxx.autolog.dto;

import java.util.List;

public record PublicCarResponse(
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

