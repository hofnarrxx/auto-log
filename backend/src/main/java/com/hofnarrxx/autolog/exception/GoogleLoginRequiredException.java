package com.hofnarrxx.autolog.exception;

import org.springframework.security.core.AuthenticationException;

public class GoogleLoginRequiredException extends AuthenticationException {
    public GoogleLoginRequiredException() {
        super("Use Google login for this account");
    }
}
