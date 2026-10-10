package com.hofnarrxx.autolog.exception;

public class WrongPasswordException extends RuntimeException {
    public WrongPasswordException() {
        super("Wrong password");
    }
}
