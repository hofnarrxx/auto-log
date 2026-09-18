package com.hofnarrxx.autolog.model;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

public enum FuelType {
    PETROL("Petrol"),
    DIESEL("Diesel"),
    ELECTRIC("Electric"),
    HYBRID("Hybrid"),
    LPG("LPG");

    private final String displayName;

    FuelType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static Optional<FuelType> fromDisplayName(String value) {
        if (value == null) {
            return Optional.empty();
        }

        String normalized = value.trim();
        return Arrays.stream(values())
                .filter(fuelType -> fuelType.displayName.equalsIgnoreCase(normalized))
                .findFirst();
    }

    public static List<String> allowedValues() {
        return Arrays.stream(values())
                .map(FuelType::getDisplayName)
                .toList();
    }
}
