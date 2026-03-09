package com.hofnarrxx.autolog.service;

import com.hofnarrxx.autolog.dto.AuthRequest;
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

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final AuthProviderRepository providerRepository;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;
    private final AuthenticationManager authManager;

    public AuthService(UserRepository userRepository, AuthProviderRepository providerRepository, PasswordEncoder encoder,
                       JwtService jwtService, AuthenticationManager authManager){
        this.userRepository = userRepository;
        this.providerRepository = providerRepository;
        this.encoder = encoder;
        this.jwtService = jwtService;
        this.authManager = authManager;
    }

    @Transactional
    public String register(AuthRequest request) {

        if (userRepository.findByEmail(request.email()).isPresent())
            throw new EmailAlreadyExistsException();

        User user = new User();
        user.setEmail(request.email());
        user.setPassword(encoder.encode(request.password()));
        userRepository.save(user);

        AuthProvider provider = new AuthProvider();
        provider.setProviderType(AuthProviderType.LOCAL);
        provider.setUser(user);
        providerRepository.save(provider);

        return jwtService.generateToken(user.getEmail());
    }

    public String login(AuthRequest request) {

        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.email(),
                        request.password()
                )
        );

        return jwtService.generateToken(request.email());
    }

    public User getCurrentUser() {
        String email = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        return userRepository.findByEmail(email)
                .orElseThrow();
    }
}
