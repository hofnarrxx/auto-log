package com.hofnarrxx.autolog.ratelimit;

import java.time.Duration;

import org.springframework.stereotype.Component;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;

@Component
public class RateLimiterRegistry {
    private final Cache<String, Bucket> registry = Caffeine.newBuilder().expireAfterAccess(Duration.ofHours(2)).build();

    public ConsumptionProbe tryConsume(RateLimitPolicy policy, String id) {
        String key = generateKey(policy, id);
        Bucket bucket = registry.get(key,
                k -> Bucket.builder().addLimit(Bandwidth.builder().capacity(policy.getCapacity())
                        .refillGreedy(policy.getCapacity(), policy.getWindow()).build()).build());
        return bucket.tryConsumeAndReturnRemaining(1);
    }

    public void reset(RateLimitPolicy policy, String id){
        String key = generateKey(policy, id);
        registry.invalidate(key);
    }

    private String generateKey(RateLimitPolicy policy, String key) {
        return policy.name() + ":" + key;
    }
}
