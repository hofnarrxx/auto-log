package com.hofnarrxx.autolog.utils;

import java.time.LocalDate;
import java.time.ZoneOffset;

public class RequestValidation {
    public static String normalizeToNull(String value) {
        if(value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public static void requireNotFuture(LocalDate date, String field) {
        if(date != null && date.isAfter(LocalDate.now(ZoneOffset.UTC).plusDays(1))) {
            throw new IllegalArgumentException(field + " must not be in the future");
        }
    }
}
