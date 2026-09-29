package com.hofnarrxx.autolog.exception;

public class InvalidGoogleLinkTokenException extends RuntimeException{
    public InvalidGoogleLinkTokenException() {
        super("Invalid or expired Google link token");
    }
}
