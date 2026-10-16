package com.hofnarrxx.autolog.ratelimit;

import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;

@Component 
public class ClientIpResolver {
    public String resolveIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            String[] parts = xff.split(",");
            String candidate = parts[parts.length - 1].trim();
            if (!candidate.isEmpty() && candidate.length() <= 45) { // max IPv6 text length
                return candidate;
            }
        }
        return request.getRemoteAddr();
    }
}
