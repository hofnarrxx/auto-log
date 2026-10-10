package com.hofnarrxx.autolog.exception;

public class DemoReadOnlyException extends RuntimeException {
    public DemoReadOnlyException() {
        super("Demo account does not allow this action");
    }

}
