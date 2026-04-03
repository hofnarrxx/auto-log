package com.hofnarrxx.autolog.model;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

public enum Currency {
    EURO("EUR"),
    US_DOLLAR("USD"),
    ZLOTY("PLN");

    private final String displayName;

    Currency(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static Optional<Currency> fromDisplayName(String value) {
        if (value == null) {
            return Optional.empty();
        }

        String normalized = value.trim();
        return Arrays.stream(values())
                .filter(currency -> currency.displayName.equalsIgnoreCase(normalized))
                .findFirst();
    }

    public static List<String> allowedValues() {
        return Arrays.stream(values())
                .map(Currency::getDisplayName)
                .toList();
    }
}

