package com.hofnarrxx.autolog.exception;

public class FieldValidationException extends RuntimeException {
    private final String field;
    private final String code;

    public FieldValidationException(String field, String code, String message) {
        super(message);
        this.field = field;
        this.code = code;
    }

    public String getField() {
        return field;
    }

    public String getCode() {
        return code;
    }
}
