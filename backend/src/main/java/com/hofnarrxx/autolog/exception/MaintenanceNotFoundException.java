package com.hofnarrxx.autolog.exception;

public class MaintenanceNotFoundException extends RuntimeException {
    public MaintenanceNotFoundException() {
        super("Maintenance record not found");
    }
}

