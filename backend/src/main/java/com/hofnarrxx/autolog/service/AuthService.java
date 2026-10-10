package com.hofnarrxx.autolog.service;

import java.util.Optional;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hofnarrxx.autolog.config.DemoProperties;
import com.hofnarrxx.autolog.dto.AuthRequest;
import com.hofnarrxx.autolog.dto.AuthTokens;
import com.hofnarrxx.autolog.dto.RegisterRequest;
import com.hofnarrxx.autolog.exception.DemoReadOnlyException;
import com.hofnarrxx.autolog.exception.DemoUserNotFoundException;
import com.hofnarrxx.autolog.exception.EmailAlreadyExistsException;
import com.hofnarrxx.autolog.exception.EmailNotVerifiedException;
import com.hofnarrxx.autolog.exception.TooManyRequestsException;
import com.hofnarrxx.autolog.exception.WrongPasswordException;
import com.hofnarrxx.autolog.model.AppLanguage;
import com.hofnarrxx.autolog.model.AuthProvider;
import com.hofnarrxx.autolog.model.AuthProviderType;
import com.hofnarrxx.autolog.model.User;
import com.hofnarrxx.autolog.ratelimit.RateLimitPolicy;
import com.hofnarrxx.autolog.ratelimit.RateLimiterRegistry;
import com.hofnarrxx.autolog.repository.AuthProviderRepository;
import com.hofnarrxx.autolog.repository.UserRepository;
import com.hofnarrxx.autolog.utils.PasswordPolicy;

import io.github.bucket4j.ConsumptionProbe;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final AuthProviderRepository providerRepository;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;
    private final AuthenticationManager authManager;
    private final RefreshTokenService refreshTokenService;
    private final EmailVerificationService emailVerificationService;
    private final GoogleLinkService googleLinkService;
    private final PasswordPolicy passwordPolicy;
    private final RateLimiterRegistry rateLimiterRegistry;
    private final DemoProperties demoProperties;

    public AuthService(UserRepository userRepository,
            AuthProviderRepository providerRepository,
            PasswordEncoder encoder,
            JwtService jwtService,
            AuthenticationManager authManager,
            RefreshTokenService refreshTokenService,
            EmailVerificationService emailVerificationService,
            GoogleLinkService googleLinkService,
            PasswordPolicy passwordPolicy,
            RateLimiterRegistry rateLimiterRegistry,
            DemoProperties demoProperties) {
        this.userRepository = userRepository;
        this.providerRepository = providerRepository;
        this.encoder = encoder;
        this.jwtService = jwtService;
        this.authManager = authManager;
        this.refreshTokenService = refreshTokenService;
        this.emailVerificationService = emailVerificationService;
        this.googleLinkService = googleLinkService;
        this.passwordPolicy = passwordPolicy;
        this.rateLimiterRegistry = rateLimiterRegistry;
        this.demoProperties = demoProperties;
    }

    @Transactional
    public void register(RegisterRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.email());
        if (userOpt.isPresent() && userOpt.get().isEmailVerified())
            throw new EmailAlreadyExistsException();

        passwordPolicy.validate(request.password());

        AppLanguage language = AppLanguage.from(request.lang());

        if (userOpt.isPresent() && !userOpt.get().isEmailVerified()) {
            User user = userOpt.get();
            user.setPassword(encoder.encode(request.password()));
            emailVerificationService.sendVerification(user, language);
            return;
        }

        User user = new User();
        user.setEmail(request.email());
        user.setEmailVerified(false);
        user.setPassword(encoder.encode(request.password()));
        userRepository.save(user);

        AuthProvider provider = new AuthProvider();
        provider.setProviderType(AuthProviderType.LOCAL);
        provider.setUser(user);
        providerRepository.save(provider);

        emailVerificationService.sendVerification(user, language);
    }

    @Transactional
    public AuthTokens login(AuthRequest request) {
        try {
            authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.email(),
                            request.password()));
            rateLimiterRegistry.reset(RateLimitPolicy.LOGIN_FAILURES, request.email());
        } catch (AuthenticationException e) {
            ConsumptionProbe probe = rateLimiterRegistry.tryConsume(RateLimitPolicy.LOGIN_FAILURES, request.email());
            if (!probe.isConsumed()) {
                double retryAfterSeconds = Math.ceil(probe.getNanosToWaitForRefill() / 1_000_000_000.0);
                throw new TooManyRequestsException((long) retryAfterSeconds);
            } else
                throw e;
        }
        User user = userRepository.findByEmail(request.email())
                .orElseThrow();

        if(!user.isEmailVerified()) throw new EmailNotVerifiedException();

        return issueTokens(user);
    }

    @Transactional
    public AuthTokens startDemo(AppLanguage language) {
        User user = userRepository.findByEmail(demoProperties.emailFor(language))
                .orElseThrow(() -> new DemoUserNotFoundException());
        if (!user.isDemo())
            throw new DemoUserNotFoundException();
        return issueTokens(user);
    }

    @Transactional
    public Optional<AuthTokens> refresh(String refreshToken) {
        Optional<User> user = refreshTokenService.rotate(refreshToken);

        if (user.isEmpty()) {
            return Optional.empty();
        }

        return Optional.of(issueTokens(user.get()));
    }

    @Transactional
    public void changePassword(String currentPassword, String newPassword) {
        User user = getCurrentUser();

        if (user.isDemo())
            throw new DemoReadOnlyException();

        if (!providerRepository.existsByUserAndProviderType(user, AuthProviderType.LOCAL))
            throw new IllegalArgumentException("Local login is required");

        if (currentPassword == null || user.getPassword() == null
                || !encoder.matches(currentPassword, user.getPassword())) {
            ConsumptionProbe probe = rateLimiterRegistry.tryConsume(RateLimitPolicy.LOGIN_FAILURES, user.getEmail());
            if (!probe.isConsumed()) {
                double retryAfterSeconds = Math.ceil(probe.getNanosToWaitForRefill() / 1_000_000_000.0);
                throw new TooManyRequestsException((long) retryAfterSeconds);
            }
            throw new WrongPasswordException();
        }

        rateLimiterRegistry.reset(RateLimitPolicy.LOGIN_FAILURES, user.getEmail());
        passwordPolicy.validate(newPassword);
        user.setPassword(encoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional
    public void setPassword(String newPassword) {
        User user = getCurrentUser();

        if (user.isDemo())
            throw new DemoReadOnlyException();

        if (providerRepository.existsByUserAndProviderType(user, AuthProviderType.LOCAL))
            throw new IllegalArgumentException("Local login already exists");

        passwordPolicy.validate(newPassword);
        user.setPassword(encoder.encode(newPassword));
        userRepository.save(user);

        AuthProvider provider = new AuthProvider();
        provider.setProviderType(AuthProviderType.LOCAL);
        provider.setUser(user);
        providerRepository.save(provider);
    }

    public User getCurrentUser() {
        String email = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        return userRepository.findByEmail(email)
                .orElseThrow();
    }

    public AuthTokens linkGoogle(String rawToken, String password) {
        User user = googleLinkService.confirm(rawToken, password);
        return issueTokens(user);
    }

    @Transactional
    public AuthTokens verifyEmail(String rawToken) {
        User user = emailVerificationService.verify(rawToken);
        return issueTokens(user);
    }

    private AuthTokens issueTokens(User user) {
        String accessToken = jwtService.generateAccessToken(user.getEmail());
        String refreshToken = refreshTokenService.createForUser(user);
        return new AuthTokens(accessToken, refreshToken);
    }
}
