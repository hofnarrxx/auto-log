package com.hofnarrxx.autolog.dto;

import java.util.Locale;

public record AuthRequest(String email, String password) {
    public AuthRequest {
        email = email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
