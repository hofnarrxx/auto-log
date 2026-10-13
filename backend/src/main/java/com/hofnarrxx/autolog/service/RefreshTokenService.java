package com.hofnarrxx.autolog.service;

import com.hofnarrxx.autolog.model.RefreshToken;
import com.hofnarrxx.autolog.model.User;
import com.hofnarrxx.autolog.repository.RefreshTokenRepository;
import com.hofnarrxx.autolog.utils.SecureTokenGenerator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final SecureTokenGenerator secureTokenGenerator;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpirationMs;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository,
            SecureTokenGenerator secureTokenGenerator) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.secureTokenGenerator = secureTokenGenerator;
    }

    @Transactional
    public String createForUser(User user) {
        refreshTokenRepository.deleteInactiveByUser(user, Instant.now());
        RefreshToken token = new RefreshToken();
        token.setToken(secureTokenGenerator.generateToken());
        token.setUser(user);
        token.setExpiresAt(Instant.now().plusMillis(refreshExpirationMs));
        token.setRevoked(false);

        return refreshTokenRepository.save(token).getToken();
    }

    @Transactional
    public Optional<User> rotate(String rawToken) {
        Optional<User> userOpt = refreshTokenRepository.findUserByToken(rawToken);
        if (userOpt.isEmpty())
            return Optional.empty();
        if (refreshTokenRepository.revokeIfActive(rawToken, Instant.now()) == 0)
            return Optional.empty();
        return userOpt;
    }

    @Transactional
    public void revoke(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return;
        }

        refreshTokenRepository.revokeIfActive(rawToken, Instant.now());
    }
}
