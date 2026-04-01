package com.hofnarrxx.autolog.exception;

import java.util.List;

public class InvalidCurrencyException extends RuntimeException {
    public InvalidCurrencyException(String attemptedValue, List<String> allowedValues) {
        super("Invalid currency: '" + attemptedValue + "'. Allowed values: " + String.join(", ", allowedValues));
    }
}

