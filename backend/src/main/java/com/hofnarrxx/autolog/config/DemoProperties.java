package com.hofnarrxx.autolog.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "demo")
public record DemoProperties(boolean enabled, String email) {

}
