package com.hofnarrxx.autolog.config;

import java.util.Map;

import org.springframework.boot.context.properties.ConfigurationProperties;

import com.hofnarrxx.autolog.model.AppLanguage;

@ConfigurationProperties(prefix = "demo")
public record DemoProperties(boolean enabled, Map<String, String> emails) {
    public String emailFor(AppLanguage language) {
        return emails.getOrDefault(language.code(), emails.get(AppLanguage.DEFAULT.code()));
    }
}
