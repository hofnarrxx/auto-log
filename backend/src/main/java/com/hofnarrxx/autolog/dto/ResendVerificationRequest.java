package com.hofnarrxx.autolog.dto;

import java.util.Locale;

public record ResendVerificationRequest(String email, String lang) {
    public ResendVerificationRequest {
        email = email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
