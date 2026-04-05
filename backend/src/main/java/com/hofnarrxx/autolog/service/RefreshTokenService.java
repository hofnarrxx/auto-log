package com.hofnarrxx.autolog.service;

import com.hofnarrxx.autolog.model.RefreshToken;
import com.hofnarrxx.autolog.model.User;
import com.hofnarrxx.autolog.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpirationMs;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @Transactional
    public String createForUser(User user) {
        refreshTokenRepository.deleteByUser(user);

        RefreshToken token = new RefreshToken();
        token.setToken(UUID.randomUUID().toString());
        token.setUser(user);
        token.setExpiresAt(Instant.now().plusMillis(refreshExpirationMs));
        token.setRevoked(false);

        return refreshTokenRepository.save(token).getToken();
    }

    @Transactional
    public Optional<User> rotate(String rawToken) {
        Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByTokenAndRevokedFalse(rawToken);

        if (tokenOpt.isEmpty()) {
            return Optional.empty();
        }

        RefreshToken token = tokenOpt.get();

        if (token.getExpiresAt().isBefore(Instant.now())) {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
            return Optional.empty();
        }

        token.setRevoked(true);
        refreshTokenRepository.save(token);
        return Optional.of(token.getUser());
    }

    @Transactional
    public void revoke(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return;
        }

        refreshTokenRepository.findByTokenAndRevokedFalse(rawToken)
                .ifPresent(token -> {
                    token.setRevoked(true);
                    refreshTokenRepository.save(token);
                });
    }
}

