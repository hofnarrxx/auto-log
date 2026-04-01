package com.hofnarrxx.autolog.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<?> handleEmailExists(EmailAlreadyExistsException ex) {

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(Map.of(
                        "error", "EMAIL_EXISTS",
                        "message", ex.getMessage()
                ));
    }

    @ExceptionHandler(VehicleNotFoundException.class)
    public ResponseEntity<?> handleVehicleNotFound(VehicleNotFoundException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(Map.of(
                        "error", "VEHICLE_NOT_FOUND",
                        "message", ex.getMessage()
                ));
    }

    @ExceptionHandler(MaintenanceNotFoundException.class)
    public ResponseEntity<?> handleMaintenanceNotFound(MaintenanceNotFoundException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(Map.of(
                        "error", "MAINTENANCE_NOT_FOUND",
                        "message", ex.getMessage()
                ));
    }

    @ExceptionHandler(InvalidMaintenanceCategoryException.class)
    public ResponseEntity<?> handleInvalidMaintenanceCategory(InvalidMaintenanceCategoryException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of(
                        "error", "INVALID_MAINTENANCE_CATEGORY",
                        "message", ex.getMessage()
                ));
    }

    @ExceptionHandler(InvalidCurrencyException.class)
    public ResponseEntity<?> handleInvalidCurrency(InvalidCurrencyException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of(
                        "error", "INVALID_CURRENCY",
                        "message", ex.getMessage()
                ));
    }

    @ExceptionHandler(FuelNotFoundException.class)
    public ResponseEntity<?> handleFuelNotFound(FuelNotFoundException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(Map.of(
                        "error", "FUEL_NOT_FOUND",
                        "message", ex.getMessage()
                ));
    }
}
