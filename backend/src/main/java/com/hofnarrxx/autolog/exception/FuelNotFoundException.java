package com.hofnarrxx.autolog.exception;

public class FuelNotFoundException extends RuntimeException {
    public FuelNotFoundException() {
        super("Fuel entry not found");
    }
}

