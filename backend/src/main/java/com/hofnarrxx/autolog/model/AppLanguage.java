package com.hofnarrxx.autolog.model;

import java.util.Locale;

import com.hofnarrxx.autolog.utils.RequestValidation;

public enum AppLanguage {
    EN, PL, UK;

    public static final AppLanguage DEFAULT = EN;

    public static AppLanguage from(String raw) {
        String value = RequestValidation.normalizeToNull(raw);
        if (value == null) return DEFAULT;
        return switch (value.toLowerCase(Locale.ROOT)) {
            case "pl" -> PL;
            case "uk" -> UK;
            case "en" -> EN;
            default -> EN;
        };
    }

    public String code() {
        return name().toLowerCase(Locale.ROOT);
    }
}
