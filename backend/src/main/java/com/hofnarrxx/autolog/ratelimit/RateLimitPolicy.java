package com.hofnarrxx.autolog.ratelimit;

import java.time.Duration;

public enum RateLimitPolicy {
    AUTH_LOGIN(10, Duration.ofMinutes(1)),
    AUTH_REGISTER(5, Duration.ofHours(1)),
    AUTH_FORGOT_PASSWORD(5, Duration.ofMinutes(15)),
    AUTH_RESET_PASSWORD(10, Duration.ofMinutes(15)),
    AUTH_REFRESH(30, Duration.ofMinutes(1)),
    AUTH_ME(60, Duration.ofMinutes(1)),
    SHARE_PUBLIC(60, Duration.ofMinutes(1)),
    SHARE_SUMMARY(20, Duration.ofMinutes(1)),
    LOGIN_FAILURES(5, Duration.ofMinutes(15));
    private final long capacity;
    private final Duration window;
    RateLimitPolicy(long capacity, Duration window) {
        this.capacity = capacity;
        this.window = window;
    }
    public long getCapacity() {
        return capacity;
    }
    public Duration getWindow() {
        return window;
    }
}