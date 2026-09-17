package com.hofnarrxx.autolog.exception;

import java.util.List;

public class InvalidFuelTypeException extends RuntimeException {
    public InvalidFuelTypeException(String attemptedValue, List<String> allowedValues) {
        super("Invalid fuel type: '" + attemptedValue + "'. Allowed values: " + String.join(", ", allowedValues));
    }
}
