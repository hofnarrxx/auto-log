package com.hofnarrxx.autolog.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {
        @ExceptionHandler(EmailAlreadyExistsException.class)
        public ResponseEntity<?> handleEmailExists(EmailAlreadyExistsException ex) {

                return ResponseEntity
                                .status(HttpStatus.CONFLICT)
                                .body(Map.of(
                                                "error", "EMAIL_EXISTS",
                                                "message", ex.getMessage()));
        }

        @ExceptionHandler(GoogleLoginRequiredException.class)
        public ResponseEntity<?> handleGoogleLoginRequired(GoogleLoginRequiredException ex) {
                return ResponseEntity
                                .status(HttpStatus.CONFLICT)
                                .body(Map.of(
                                                "error", "GOOGLE_LOGIN_REQUIRED",
                                                "message", ex.getMessage()));
        }

        @ExceptionHandler(TooManyRequestsException.class)
        public ResponseEntity<?> handleTooManyRequests(TooManyRequestsException ex) {
                return ResponseEntity
                                .status(HttpStatus.TOO_MANY_REQUESTS)
                                .header("Retry-After", String.valueOf(ex.getRetryAfterSeconds()))
                                .body(Map.of(
                                                "error", "RATE_LIMIT_EXCEEDED",
                                                "message", ex.getMessage()));
        }

        @ExceptionHandler(WeakPasswordException.class)
        public ResponseEntity<?> handleWeakPassword(WeakPasswordException ex) {
                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(Map.of(
                                                "error", "WEAK_PASSWORD",
                                                "message", ex.getMessage()));
        }

        @ExceptionHandler(InvalidPasswordResetTokenException.class)
        public ResponseEntity<?> handleInvalidPasswordResetToken(InvalidPasswordResetTokenException ex) {
                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(Map.of(
                                                "error", "INVALID_PASSWORD_RESET_TOKEN",
                                                "message", ex.getMessage()));
        }

        @ExceptionHandler(VehicleNotFoundException.class)
        public ResponseEntity<?> handleVehicleNotFound(VehicleNotFoundException ex) {
                return ResponseEntity
                                .status(HttpStatus.NOT_FOUND)
                                .body(Map.of(
                                                "error", "VEHICLE_NOT_FOUND",
                                                "message", ex.getMessage()));
        }

        @ExceptionHandler(MaintenanceNotFoundException.class)
        public ResponseEntity<?> handleMaintenanceNotFound(MaintenanceNotFoundException ex) {
                return ResponseEntity
                                .status(HttpStatus.NOT_FOUND)
                                .body(Map.of(
                                                "error", "MAINTENANCE_NOT_FOUND",
                                                "message", ex.getMessage()));
        }

        @ExceptionHandler(InvalidMaintenanceCategoryException.class)
        public ResponseEntity<?> handleInvalidMaintenanceCategory(InvalidMaintenanceCategoryException ex) {
                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(Map.of(
                                                "error", "INVALID_MAINTENANCE_CATEGORY",
                                                "message", ex.getMessage()));
        }

        @ExceptionHandler(InvalidCurrencyException.class)
        public ResponseEntity<?> handleInvalidCurrency(InvalidCurrencyException ex) {
                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(Map.of(
                                                "error", "INVALID_CURRENCY",
                                                "message", ex.getMessage()));
        }

        @ExceptionHandler(InvalidFuelTypeException.class)
        public ResponseEntity<?> handleInvalidFuelType(InvalidFuelTypeException ex) {
                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(Map.of(
                                                "error", "INVALID_FUEL_TYPE",
                                                "message", ex.getMessage()));
        }

        @ExceptionHandler(FuelNotFoundException.class)
        public ResponseEntity<?> handleFuelNotFound(FuelNotFoundException ex) {
                return ResponseEntity
                                .status(HttpStatus.NOT_FOUND)
                                .body(Map.of(
                                                "error", "FUEL_NOT_FOUND",
                                                "message", ex.getMessage()));
        }

        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<?> handleIllegalArgument(IllegalArgumentException ex) {
                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(Map.of(
                                                "error", "INVALID_REQUEST",
                                                "message", ex.getMessage()));
        }

        @ExceptionHandler(ShareLinkNotFoundException.class)
        public ResponseEntity<?> handleShareLinkNotFound(ShareLinkNotFoundException ex) {
                return ResponseEntity
                                .status(HttpStatus.NOT_FOUND)
                                .body(Map.of(
                                                "error", "SHARE_LINK_NOT_FOUND",
                                                "message", ex.getMessage()));
        }

        @ExceptionHandler(DemoUserNotFoundException.class)
        public ResponseEntity<?> handleDemoUserNotFound(DemoUserNotFoundException ex) {
                return ResponseEntity
                                .status(HttpStatus.NOT_FOUND)
                                .body(Map.of(
                                                "error", "DEMO_USER_NOT_FOUND",
                                                "message", ex.getMessage()));
        }

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<?> handleValidation(MethodArgumentNotValidException ex) {
                Map<String, String> fields = ex.getBindingResult().getFieldErrors().stream()
                                .collect(Collectors.toMap(
                                                FieldError::getField,
                                                FieldError::getCode,
                                                (first, second) -> first));

                String message = ex.getBindingResult().getFieldErrors().stream()
                                .findFirst()
                                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                                .orElse("Validation failed");

                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(Map.of("error", "VALIDATION_FAILED", "message", message, "fields", fields));
        }

        @ExceptionHandler(FieldValidationException.class)
        public ResponseEntity<?> handleFieldValidation(FieldValidationException ex) {
                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(Map.of(
                                                "error", "VALIDATION_FAILED",
                                                "message", ex.getMessage(),
                                                "fields", Map.of(ex.getField(), ex.getCode())));
        }

        @ExceptionHandler(DataIntegrityViolationException.class)
        public ResponseEntity<?> handleDataIntegrity(DataIntegrityViolationException ex) {
                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(Map.of(
                                                "error", "DATA_INTEGRITY_VIOLATION",
                                                "message", "The request violates a data constraint"));
        }
}
