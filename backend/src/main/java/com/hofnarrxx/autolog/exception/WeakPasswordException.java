package com.hofnarrxx.autolog.exception;

public class WeakPasswordException extends RuntimeException {
    public WeakPasswordException() {
        super("Password must be at least 8 characters long and include one uppercase letter and one special character");
    }
}
