package com.hofnarrxx.autolog.config;

import com.hofnarrxx.autolog.model.User;
import com.hofnarrxx.autolog.repository.UserRepository;
import com.hofnarrxx.autolog.service.JwtService;
import com.hofnarrxx.autolog.service.RefreshTokenService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OAuth2JwtSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    @Value("${jwt.expiration}")
    private long accessTokenExpirationMs;

    @Value("${jwt.refresh-expiration}")
    private long refreshTokenExpirationMs;

    public OAuth2JwtSuccessHandler(UserRepository userRepository,
                                   JwtService jwtService,
                                   RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                       HttpServletResponse response,
                                       Authentication authentication) throws IOException, ServletException {

        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        String email = oauth2User.getAttribute("email");

        if (email == null || email.isBlank()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("Email not available from OAuth2 provider");
            return;
        }

        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    User newUser = new User(email);
                    return userRepository.save(newUser);
                });

        String accessToken = jwtService.generateAccessToken(user.getEmail());
        String refreshToken = refreshTokenService.createForUser(user);

        response.addHeader(HttpHeaders.SET_COOKIE,
                buildCookie("access_token", accessToken, accessTokenExpirationMs).toString());
        response.addHeader(HttpHeaders.SET_COOKIE,
                buildCookie("refresh_token", refreshToken, refreshTokenExpirationMs).toString());

        response.sendRedirect("http://localhost:4200/dashboard");
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
