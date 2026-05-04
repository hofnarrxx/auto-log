package com.hofnarrxx.autolog.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "r2")
public record R2Properties(
        String endpoint,
        String accessKey,
        String secretKey,
        String bucket,
        String region
) {
}
