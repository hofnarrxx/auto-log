package com.hofnarrxx.autolog.ratelimit;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import tools.jackson.databind.ObjectMapper;

@Component
public class RateLimitFilter extends OncePerRequestFilter {
    private final RateLimiterRegistry rateLimiterRegistry;
    private final ClientIpResolver clientIpResolver;
    private final ObjectMapper objectMapper;

    public RateLimitFilter(RateLimiterRegistry rateLimiterRegistry, ClientIpResolver clientIpResolver,
            ObjectMapper objectMapper) {
        this.rateLimiterRegistry = rateLimiterRegistry;
        this.clientIpResolver = clientIpResolver;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        RateLimitPolicy policy = resolvePolicy(request);
        if (policy == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String ip = clientIpResolver.resolveIp(request);
        ConsumptionProbe probe = rateLimiterRegistry.tryConsume(policy, ip);
        if (probe.isConsumed()) {
            filterChain.doFilter(request, response);
            return;
        }

        double retryAfter = Math.ceil(probe.getNanosToWaitForRefill() / 1_000_000_000.0);

        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.addHeader("Retry-After", Long.toString((long) retryAfter));
        response.setContentType("application/json");
        response.getWriter()
                .write(objectMapper
                        .writeValueAsString(Map.of("error", "RATE_LIMIT_EXCEEDED", "message", "Try again later")));
    }

    private RateLimitPolicy resolvePolicy(HttpServletRequest request) {
        String method = request.getMethod();
        String uri = request.getRequestURI();
        if (HttpMethod.POST.matches(method)) {
            if (uri.equals("/api/auth/register"))
                return RateLimitPolicy.AUTH_REGISTER;
            if (uri.equals("/api/auth/login"))
                return RateLimitPolicy.AUTH_LOGIN;
            if (uri.equals("/api/auth/forgot-password"))
                return RateLimitPolicy.AUTH_FORGOT_PASSWORD;
            if (uri.equals("/api/auth/reset-password"))
                return RateLimitPolicy.AUTH_RESET_PASSWORD;
            if (uri.equals("/api/auth/refresh"))
                return RateLimitPolicy.AUTH_REFRESH;
        }
        if (HttpMethod.GET.matches(method)) {
            if (uri.equals("/api/auth/me"))
                return RateLimitPolicy.AUTH_ME;
            if (uri.equals("/api/auth/reset-password/validate"))
                return RateLimitPolicy.AUTH_RESET_PASSWORD;
        }
        if (HttpMethod.GET.matches(method) && uri.startsWith("/share/")) {
            String prefix = "/share/";
            uri = uri.substring(prefix.length());
            if (!uri.contains("/"))
                return RateLimitPolicy.SHARE_SUMMARY;
            else
                return RateLimitPolicy.SHARE_PUBLIC;
        }
        return null;
    }
}
