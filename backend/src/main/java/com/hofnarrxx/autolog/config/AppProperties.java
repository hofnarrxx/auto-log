package com.hofnarrxx.autolog.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        String frontendUrl,
        Mail mail,
        PasswordReset passwordReset
) {
    public record Mail(String from) {}
    public record PasswordReset(long tokenExpiration) {}
}