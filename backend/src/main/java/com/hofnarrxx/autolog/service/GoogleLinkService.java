package com.hofnarrxx.autolog.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hofnarrxx.autolog.exception.GoogleAlreadyLinkedException;
import com.hofnarrxx.autolog.exception.InvalidCredentialsException;
import com.hofnarrxx.autolog.exception.InvalidGoogleLinkTokenException;
import com.hofnarrxx.autolog.exception.TooManyRequestsException;
import com.hofnarrxx.autolog.model.AuthProvider;
import com.hofnarrxx.autolog.model.AuthProviderType;
import com.hofnarrxx.autolog.model.GoogleLinkToken;
import com.hofnarrxx.autolog.model.User;
import com.hofnarrxx.autolog.ratelimit.RateLimitPolicy;
import com.hofnarrxx.autolog.ratelimit.RateLimiterRegistry;
import com.hofnarrxx.autolog.repository.AuthProviderRepository;
import com.hofnarrxx.autolog.repository.GoogleLinkTokenRepository;
import com.hofnarrxx.autolog.utils.SecureTokenGenerator;
import com.hofnarrxx.autolog.utils.TokenHasher;

import io.github.bucket4j.ConsumptionProbe;

@Service
public class GoogleLinkService {

    private static final Duration TTL = Duration.ofMinutes(10);
    private final GoogleLinkTokenRepository tokenRepository;
    private final AuthProviderRepository providerRepository;
    private final RateLimiterRegistry rateLimiterRegistry;
    private final PasswordEncoder passwordEncoder;
    private final SecureTokenGenerator secureTokenGenerator;
    private final TokenHasher tokenHasher;

    public GoogleLinkService(GoogleLinkTokenRepository tokenRepository,
            AuthProviderRepository providerRepository,
            RateLimiterRegistry rateLimiterRegistry,
            PasswordEncoder passwordEncoder,
            SecureTokenGenerator secureTokenGenerator,
            TokenHasher tokenHasher) {
        this.tokenRepository = tokenRepository;
        this.providerRepository = providerRepository;
        this.rateLimiterRegistry = rateLimiterRegistry;
        this.passwordEncoder = passwordEncoder;
        this.secureTokenGenerator = secureTokenGenerator;
        this.tokenHasher = tokenHasher;
    }

    @Transactional
    public String begin(User user, String googleSub) {
        tokenRepository.deleteByUser(user);
        String rawToken = secureTokenGenerator.generateToken();
        GoogleLinkToken token = new GoogleLinkToken();
        token.setTokenHash(tokenHasher.sha256Hex(rawToken));
        token.setUser(user);
        token.setProviderId(googleSub);
        token.setExpiresAt(Instant.now().plus(TTL));
        tokenRepository.save(token);
        return rawToken;
    }

    @Transactional(readOnly = true)
    public Optional<String> findPendingEmail(String rawToken) {
        Optional<GoogleLinkToken> token = findValid(rawToken);
        if (token.isEmpty())
            return Optional.empty();
        return Optional.of(token.get().getUser().getEmail());
    }

    @Transactional(noRollbackFor = {
            InvalidGoogleLinkTokenException.class,
            GoogleAlreadyLinkedException.class
    })
    public User confirm(String rawToken, String password) {
        Optional<GoogleLinkToken> tokenOpt = findValid(rawToken);
        if (tokenOpt.isEmpty())
            throw new InvalidGoogleLinkTokenException();
        GoogleLinkToken token = tokenOpt.get();
        User user = token.getUser();

        if (user.isDemo() || !providerRepository.existsByUserAndProviderType(user, AuthProviderType.LOCAL)) {
            consume(token);
            throw new InvalidGoogleLinkTokenException();
        }

        if (providerRepository.findByProviderTypeAndProviderId(AuthProviderType.GOOGLE, token.getProviderId())
                .isPresent()) {
            consume(token);
            throw new GoogleAlreadyLinkedException();
        }

        if (password == null || !passwordEncoder.matches(password, user.getPassword())) {
            ConsumptionProbe probe = rateLimiterRegistry.tryConsume(RateLimitPolicy.LOGIN_FAILURES, user.getEmail());
            if (!probe.isConsumed()) {
                double retryAfterSeconds = Math.ceil(probe.getNanosToWaitForRefill() / 1_000_000_000.0);
                throw new TooManyRequestsException((long) retryAfterSeconds);
            }
            throw new InvalidCredentialsException();
        }

        rateLimiterRegistry.reset(RateLimitPolicy.LOGIN_FAILURES, user.getEmail());
        AuthProvider provider = new AuthProvider();
        provider.setProviderId(token.getProviderId());
        provider.setProviderType(AuthProviderType.GOOGLE);
        provider.setUser(user);
        providerRepository.save(provider);
        consume(token);
        return user;
    }

    @Transactional
    public void cancel(String rawToken) {
        Optional<GoogleLinkToken> tokenOpt = findValid(rawToken);
        if (tokenOpt.isPresent()) {
            tokenRepository.delete(tokenOpt.get());
        }
    }

    private Optional<GoogleLinkToken> findValid(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return Optional.empty();
        }
        return tokenRepository.findByTokenHash(tokenHasher.sha256Hex(rawToken))
                .filter(token -> token.getExpiresAt().isAfter(Instant.now()));
    }

    @Transactional
    private void consume(GoogleLinkToken token) {
        tokenRepository.delete(token);
    }
}
