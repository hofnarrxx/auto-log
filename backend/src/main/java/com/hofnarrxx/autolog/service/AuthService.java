package com.hofnarrxx.autolog.service;

import com.hofnarrxx.autolog.dto.AuthRequest;
import com.hofnarrxx.autolog.dto.AuthTokens;
import com.hofnarrxx.autolog.exception.EmailAlreadyExistsException;
import com.hofnarrxx.autolog.model.AuthProvider;
import com.hofnarrxx.autolog.model.AuthProviderType;
import com.hofnarrxx.autolog.model.User;
import com.hofnarrxx.autolog.repository.AuthProviderRepository;
import com.hofnarrxx.autolog.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final AuthProviderRepository providerRepository;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;
    private final AuthenticationManager authManager;
    private final RefreshTokenService refreshTokenService;

    public AuthService(UserRepository userRepository,
                       AuthProviderRepository providerRepository,
                       PasswordEncoder encoder,
                       JwtService jwtService,
                       AuthenticationManager authManager,
                       RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.providerRepository = providerRepository;
        this.encoder = encoder;
        this.jwtService = jwtService;
        this.authManager = authManager;
        this.refreshTokenService = refreshTokenService;
    }

    @Transactional
    public AuthTokens register(AuthRequest request) {

        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new EmailAlreadyExistsException();
        }

        User user = new User();
        user.setEmail(request.email());
        user.setPassword(encoder.encode(request.password()));
        userRepository.save(user);

        AuthProvider provider = new AuthProvider();
        provider.setProviderType(AuthProviderType.LOCAL);
        provider.setUser(user);
        providerRepository.save(provider);

        return issueTokens(user);
    }

    @Transactional
    public AuthTokens login(AuthRequest request) {

        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.email(),
                        request.password()
                )
        );

        User user = userRepository.findByEmail(request.email())
                .orElseThrow();

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

    public User getCurrentUser() {
        String email = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        return userRepository.findByEmail(email)
                .orElseThrow();
    }

    private AuthTokens issueTokens(User user) {
        String accessToken = jwtService.generateAccessToken(user.getEmail());
        String refreshToken = refreshTokenService.createForUser(user);
        return new AuthTokens(accessToken, refreshToken);
    }
}
