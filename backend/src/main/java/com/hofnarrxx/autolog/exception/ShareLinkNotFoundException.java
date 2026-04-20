package com.hofnarrxx.autolog.exception;

public class ShareLinkNotFoundException extends RuntimeException {
    public ShareLinkNotFoundException() {
        super("Share link not found or expired");
    }
}

