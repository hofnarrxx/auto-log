package com.hofnarrxx.autolog.exception;

public class GoogleAlreadyLinkedException  extends RuntimeException{
    public GoogleAlreadyLinkedException() {
        super("This Google account is already linked");
    }
}
