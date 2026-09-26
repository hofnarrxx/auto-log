package com.hofnarrxx.autolog.model;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

public enum MaintenanceCategory {
    INSPECTION_AND_DIAGNOSTICS("Inspection & diagnostics"),
    OIL_AND_FILTERS("Oil & filters"),
    REPAIR("Repair"),
    PART_REPLACEMENT("Part Replacement"),
    FLUIDS("Fluids"),
    TIRES_AND_WHEELS("Tires & Wheels"),
    COSMETIC("Cosmetic");

    private final String displayName;

    MaintenanceCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static Optional<MaintenanceCategory> fromDisplayName(String value) {
        if (value == null) {
            return Optional.empty();
        }

        String normalized = value.trim();
        return Arrays.stream(values())
                .filter(category -> category.displayName.equalsIgnoreCase(normalized))
                .findFirst();
    }

    public static List<String> allowedValues() {
        return Arrays.stream(values())
                .map(MaintenanceCategory::getDisplayName)
                .toList();
    }
}

