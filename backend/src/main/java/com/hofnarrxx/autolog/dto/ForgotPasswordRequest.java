package com.hofnarrxx.autolog.dto;

import java.util.Locale;

public record ForgotPasswordRequest(String email, String lang) {
    public ForgotPasswordRequest {
        email = email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
