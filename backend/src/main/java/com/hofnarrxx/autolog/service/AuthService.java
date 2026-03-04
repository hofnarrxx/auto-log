package com.hofnarrxx.autolog.service;

import com.hofnarrxx.autolog.dto.AuthRequest;
import com.hofnarrxx.autolog.model.User;
import com.hofnarrxx.autolog.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;
    private final AuthenticationManager authManager;

    public AuthService(UserRepository userRepository, PasswordEncoder encoder,
                       JwtService jwtService, AuthenticationManager authManager){
        this.userRepository = userRepository;
        this.encoder = encoder;
        this.jwtService = jwtService;
        this.authManager = authManager;
    }

    public String register(AuthRequest request) {

        if (userRepository.findByEmail(request.email()).isPresent())
            throw new RuntimeException("Email already exists");

        User user = new User();
        user.setEmail(request.email());
        user.setPassword(encoder.encode(request.password()));

        userRepository.save(user);

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
