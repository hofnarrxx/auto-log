package com.hofnarrxx.autolog.exception;

public class EmailAlreadyExistsException extends RuntimeException{
    public EmailAlreadyExistsException() {
        super("Email already exists");
    }
}
