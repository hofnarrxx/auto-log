package com.hofnarrxx.autolog.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hofnarrxx.autolog.config.AppProperties;
import com.hofnarrxx.autolog.exception.InvalidPasswordResetTokenException;
import com.hofnarrxx.autolog.model.AuthProviderType;
import com.hofnarrxx.autolog.model.PasswordResetToken;
import com.hofnarrxx.autolog.model.User;
import com.hofnarrxx.autolog.ratelimit.RateLimitPolicy;
import com.hofnarrxx.autolog.ratelimit.RateLimiterRegistry;
import com.hofnarrxx.autolog.repository.AuthProviderRepository;
import com.hofnarrxx.autolog.repository.PasswordResetTokenRepository;
import com.hofnarrxx.autolog.repository.RefreshTokenRepository;
import com.hofnarrxx.autolog.repository.UserRepository;
import com.hofnarrxx.autolog.utils.PasswordPolicy;
import com.hofnarrxx.autolog.utils.SecureTokenGenerator;

import io.github.bucket4j.ConsumptionProbe;

@Service
public class PasswordResetService {

    private final UserRepository userRepository;
    private final AuthProviderRepository authProviderRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordResetMailer passwordResetMailer;
    private final SecureTokenGenerator secureTokenGenerator;
    private final PasswordPolicy passwordPolicy;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties appProperties;
    private final RateLimiterRegistry rateLimiterRegistry;

    public PasswordResetService(UserRepository userRepository, AuthProviderRepository authProviderRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordResetTokenRepository passwordResetTokenRepository, PasswordResetMailer passwordResetMailer,
            SecureTokenGenerator secureTokenGenerator, PasswordPolicy passwordPolicy,
            PasswordEncoder passwordEncoder, AppProperties appProperties,
            RateLimiterRegistry rateLimiterRegistry) {
        this.userRepository = userRepository;
        this.authProviderRepository = authProviderRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordResetMailer = passwordResetMailer;
        this.secureTokenGenerator = secureTokenGenerator;
        this.passwordPolicy = passwordPolicy;
        this.passwordEncoder = passwordEncoder;
        this.appProperties = appProperties;
        this.rateLimiterRegistry = rateLimiterRegistry;
    }

    @Transactional
    public void requestReset(String email, Locale locale) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty())
            return;
        User user = userOpt.get();
        if (!authProviderRepository.existsByUserAndProviderType(user, AuthProviderType.LOCAL))
            return;
        ConsumptionProbe probe = rateLimiterRegistry.tryConsume(RateLimitPolicy.AUTH_FORGOT_PASSWORD, email);
        if(!probe.isConsumed()) return;

        passwordResetTokenRepository.deleteByUser(user);

        String rawToken = secureTokenGenerator.generateToken();
        PasswordResetToken token = new PasswordResetToken();
        token.setTokenHash(hash(rawToken));
        token.setUser(user);
        token.setExpiresAt(Instant.now().plusMillis(appProperties.passwordReset().tokenExpiration()));

        passwordResetTokenRepository.save(token);
        passwordResetMailer.sendResetEmail(user.getEmail(), rawToken, locale);
    }

    public boolean validateToken(String rawToken) {
        return findToken(rawToken).isPresent();
    }

    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        PasswordResetToken token = findToken(rawToken).orElseThrow(InvalidPasswordResetTokenException::new);

        passwordPolicy.validate(newPassword);

        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        passwordResetTokenRepository.deleteByUser(user);
        refreshTokenRepository.deleteByUser(user);
    }

    private Optional<PasswordResetToken> findToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return Optional.empty();
        }
        return passwordResetTokenRepository.findByTokenHash(hash(rawToken))
                .filter(t -> t.getExpiresAt().isAfter(Instant.now()));
    }

    private String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
