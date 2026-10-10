package com.hofnarrxx.autolog.service;

import java.time.Instant;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hofnarrxx.autolog.config.AppProperties;
import com.hofnarrxx.autolog.exception.InvalidEmailVerificationTokenException;
import com.hofnarrxx.autolog.model.AppLanguage;
import com.hofnarrxx.autolog.model.AuthProviderType;
import com.hofnarrxx.autolog.model.EmailVerificationToken;
import com.hofnarrxx.autolog.model.User;
import com.hofnarrxx.autolog.ratelimit.RateLimitPolicy;
import com.hofnarrxx.autolog.ratelimit.RateLimiterRegistry;
import com.hofnarrxx.autolog.repository.AuthProviderRepository;
import com.hofnarrxx.autolog.repository.EmailVerificationRepository;
import com.hofnarrxx.autolog.repository.UserRepository;
import com.hofnarrxx.autolog.utils.SecureTokenGenerator;
import com.hofnarrxx.autolog.utils.TokenHasher;

import io.github.bucket4j.ConsumptionProbe;

@Service 
public class EmailVerificationService {
    private final UserRepository userRepository;
    private final AuthProviderRepository authProviderRepository;
    private final EmailVerificationRepository emailVerificationRepository;
    private final EmailVerificationMailer emailVerificationMailer;
    private final SecureTokenGenerator secureTokenGenerator;
    private final RateLimiterRegistry rateLimiterRegistry;
    private final AppProperties appProperties;
    private final TokenHasher tokenHasher;

    public EmailVerificationService(UserRepository userRepository, AuthProviderRepository authProviderRepository,
            EmailVerificationRepository emailVerificationRepository, EmailVerificationMailer emailVerificationMailer,
            SecureTokenGenerator secureTokenGenerator, AppProperties appProperties, TokenHasher tokenHasher,
            RateLimiterRegistry rateLimiterRegistry) {
        this.userRepository = userRepository;
        this.authProviderRepository = authProviderRepository;
        this.emailVerificationRepository = emailVerificationRepository;
        this.emailVerificationMailer = emailVerificationMailer;
        this.secureTokenGenerator = secureTokenGenerator;
        this.appProperties = appProperties;
        this.tokenHasher = tokenHasher;
        this.rateLimiterRegistry = rateLimiterRegistry;
    }

    public void sendVerification(User user, AppLanguage language) {
        emailVerificationRepository.deleteByUser(user);

        String rawToken = secureTokenGenerator.generateToken();
        EmailVerificationToken token = new EmailVerificationToken();
        token.setTokenHash(tokenHasher.sha256Hex(rawToken));
        token.setUser(user);
        token.setExpiresAt(Instant.now().plusMillis(appProperties.emailVerification().tokenExpiration()));

        emailVerificationRepository.save(token);
        emailVerificationMailer.sendVerifyEmail(user.getEmail(), rawToken, language);
    }

    @Transactional
    public void resend(String email, AppLanguage language) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty())
            return;
        User user = userOpt.get();
        if (user.isDemo())
            return;
        if (!authProviderRepository.existsByUserAndProviderType(user, AuthProviderType.LOCAL))
            return;
        if (user.isEmailVerified())
            return;
        ConsumptionProbe probe = rateLimiterRegistry.tryConsume(RateLimitPolicy.AUTH_RESEND_VERIFICATION, email);
        if (!probe.isConsumed())
            return;
        sendVerification(user, language);
    }

    @Transactional
    public User verify(String rawToken) {
        Optional<EmailVerificationToken> tokenOpt = findToken(rawToken);
        if (tokenOpt.isEmpty())
            throw new InvalidEmailVerificationTokenException();
        EmailVerificationToken token = tokenOpt.get();
        if (token.getExpiresAt().isBefore(Instant.now()))
            throw new InvalidEmailVerificationTokenException();

        User user = token.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);
        emailVerificationRepository.deleteByUser(user);

        return user;
    }

    private Optional<EmailVerificationToken> findToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return Optional.empty();
        }
        return emailVerificationRepository.findByTokenHash(tokenHasher.sha256Hex(rawToken))
                .filter(t -> t.getExpiresAt().isAfter(Instant.now()));
    }
}
