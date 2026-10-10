package com.hofnarrxx.autolog.dto;

import java.util.Locale;

public record RegisterRequest(String email, String password, String lang) {
    public RegisterRequest{
        email = email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
