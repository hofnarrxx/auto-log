package com.hofnarrxx.autolog.exception;

public class VehicleNotFoundException extends RuntimeException {
    public VehicleNotFoundException() {
        super("Vehicle not found");
    }
}
