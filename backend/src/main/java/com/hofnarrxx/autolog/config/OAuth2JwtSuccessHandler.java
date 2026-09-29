package com.hofnarrxx.autolog.config;

import java.io.IOException;
import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.hofnarrxx.autolog.model.User;
import com.hofnarrxx.autolog.service.GoogleSignInService;
import com.hofnarrxx.autolog.service.JwtService;
import com.hofnarrxx.autolog.service.RefreshTokenService;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class OAuth2JwtSuccessHandler implements AuthenticationSuccessHandler {

    private final GoogleSignInService googleSignInService;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final AppProperties appProperties;

    @Value("${jwt.expiration}")
    private long accessTokenExpirationMs;

    @Value("${jwt.refresh-expiration}")
    private long refreshTokenExpirationMs;

    public OAuth2JwtSuccessHandler(GoogleSignInService googleSignInService,
            JwtService jwtService,
            RefreshTokenService refreshTokenService, AppProperties appProperties) {
        this.googleSignInService = googleSignInService;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.appProperties = appProperties;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        String email = oauth2User.getAttribute("email");
        String googleSub = oauth2User.getAttribute("sub");
        Boolean emailVerified = oauth2User.getAttribute("email_verified");

        GoogleSignInService.Result result = googleSignInService.complete(email, googleSub, emailVerified);

        switch (result) {
            case GoogleSignInService.Result.Session session -> {
                issueSession(response, session.user());
                response.sendRedirect(appProperties.frontendUrl() + "/garage");
            }
            case GoogleSignInService.Result.LinkRequired link -> {
                response.addHeader(HttpHeaders.SET_COOKIE,
                        buildCookie("google_link", link.rawToken(), Duration.ofMinutes(10).toMillis()).toString());
                response.sendRedirect(appProperties.frontendUrl() + "/link-google");
            }
            case GoogleSignInService.Result.Rejected rejected ->
                response.sendRedirect(appProperties.frontendUrl() + "/login?error=google_link_rejected");
        }
    }

    private void issueSession(HttpServletResponse response, User user) {
        String accessToken = jwtService.generateAccessToken(user.getEmail());
        String refreshToken = refreshTokenService.createForUser(user);

        response.addHeader(HttpHeaders.SET_COOKIE,
                buildCookie("access_token", accessToken, accessTokenExpirationMs).toString());
        response.addHeader(HttpHeaders.SET_COOKIE,
                buildCookie("refresh_token", refreshToken, refreshTokenExpirationMs).toString());
    }

    private ResponseCookie buildCookie(String name, String value, long maxAgeMs) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(Math.max(maxAgeMs, 0) / 1000)
                .sameSite("Lax")
                .build();
    }
}
