package com.hofnarrxx.autolog.exception;

public class DemoUserNotFoundException extends RuntimeException{
    public DemoUserNotFoundException() {
        super("Demo user not found");
    }
}
