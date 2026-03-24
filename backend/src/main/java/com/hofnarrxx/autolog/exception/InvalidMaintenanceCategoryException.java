package com.hofnarrxx.autolog.exception;

import java.util.List;

public class InvalidMaintenanceCategoryException extends RuntimeException {
    public InvalidMaintenanceCategoryException(String category, List<String> allowedValues) {
        super("Invalid maintenance category: '" + category + "'. Allowed values: " + String.join(", ", allowedValues));
    }
}

