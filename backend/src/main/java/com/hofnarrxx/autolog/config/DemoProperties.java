package com.hofnarrxx.autolog.config;

import java.util.Locale;
import java.util.Map;

import org.springframework.boot.context.properties.ConfigurationProperties;

import com.hofnarrxx.autolog.utils.RequestValidation;

@ConfigurationProperties(prefix = "demo")
public record DemoProperties(boolean enabled, String defaultLanguage, Map<String, String> emails) {
    public String emailFor(String language) {
        language = RequestValidation.normalizeToNull(language);
        language = language == null ? defaultLanguage : language.toLowerCase(Locale.ROOT);
        return emails.getOrDefault(language, emails.get(defaultLanguage));
    }
}
