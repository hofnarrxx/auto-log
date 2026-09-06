package com.hofnarrxx.autolog.controller;

import com.hofnarrxx.autolog.dto.AuthRequest;
import com.hofnarrxx.autolog.dto.AuthResponse;
import com.hofnarrxx.autolog.dto.AuthTokens;
import com.hofnarrxx.autolog.dto.ForgotPasswordRequest;
import com.hofnarrxx.autolog.dto.ResetPasswordRequest;
import com.hofnarrxx.autolog.exception.InvalidPasswordResetTokenException;
import com.hofnarrxx.autolog.service.AuthService;
import com.hofnarrxx.autolog.service.PasswordResetService;
import com.hofnarrxx.autolog.service.RefreshTokenService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final String ACCESS_TOKEN_COOKIE = "access_token";
    private static final String REFRESH_TOKEN_COOKIE = "refresh_token";

    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;
    private final PasswordResetService passwordResetService;

    @Value("${jwt.expiration}")
    private long accessTokenExpirationMs;

    @Value("${jwt.refresh-expiration}")
    private long refreshTokenExpirationMs;

    public AuthController(AuthService authService,
            RefreshTokenService refreshTokenService, PasswordResetService passwordResetService) {
        this.authService = authService;
        this.refreshTokenService = refreshTokenService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/register")
    public ResponseEntity<Void> register(@RequestBody AuthRequest request, HttpServletResponse response) {
        AuthTokens tokens = authService.register(request);
        setAuthCookies(response, tokens);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/login")
    public ResponseEntity<Void> login(@RequestBody AuthRequest request, HttpServletResponse response) {
        AuthTokens tokens = authService.login(request);
        setAuthCookies(response, tokens);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/refresh")
    public ResponseEntity<Void> refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = getCookieValue(request, REFRESH_TOKEN_COOKIE);

        if (refreshToken == null) {
            return ResponseEntity.status(401).build();
        }

        return authService.refresh(refreshToken)
                .map(tokens -> {
                    setAuthCookies(response, tokens);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElseGet(() -> {
                    clearAuthCookies(response);
                    return ResponseEntity.status(401).build();
                });
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        String email = authentication.getName();
        return ResponseEntity.ok(new AuthResponse(email));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = getCookieValue(request, REFRESH_TOKEN_COOKIE);
        refreshTokenService.revoke(refreshToken);
        clearAuthCookies(response);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        Locale locale = Locale
                .forLanguageTag(request.lang() != null && !request.lang().isBlank() ? request.lang() : "en");
        passwordResetService.requestReset(request.email(), locale);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/reset-password/validate")
    public ResponseEntity<Void> validateRequest(@RequestParam String token){
        if(!passwordResetService.validateToken(token)){
            throw new InvalidPasswordResetTokenException();
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@RequestBody ResetPasswordRequest request){
        passwordResetService.resetPassword(request.token(), request.password());
        return ResponseEntity.noContent().build();
    }

    private void setAuthCookies(HttpServletResponse response, AuthTokens tokens) {
        response.addHeader(HttpHeaders.SET_COOKIE,
                buildCookie(ACCESS_TOKEN_COOKIE, tokens.accessToken(), accessTokenExpirationMs).toString());
        response.addHeader(HttpHeaders.SET_COOKIE,
                buildCookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken(), refreshTokenExpirationMs).toString());
    }

    private void clearAuthCookies(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE,
                buildCookie(ACCESS_TOKEN_COOKIE, "", 0).toString());
        response.addHeader(HttpHeaders.SET_COOKIE,
                buildCookie(REFRESH_TOKEN_COOKIE, "", 0).toString());
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

    private String getCookieValue(HttpServletRequest request, String cookieName) {
        Cookie[] cookies = request.getCookies();

        if (cookies == null) {
            return null;
        }

        for (Cookie cookie : cookies) {
            if (cookieName.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }

        return null;
    }
}