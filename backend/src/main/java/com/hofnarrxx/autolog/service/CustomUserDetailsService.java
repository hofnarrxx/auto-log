package com.hofnarrxx.autolog.service;

import com.hofnarrxx.autolog.model.AuthProviderType;
import com.hofnarrxx.autolog.model.User;
import com.hofnarrxx.autolog.repository.AuthProviderRepository;
import com.hofnarrxx.autolog.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final AuthProviderRepository providerRepository;

    public CustomUserDetailsService(UserRepository userRepository,
                                    AuthProviderRepository providerRepository){
        this.userRepository = userRepository;
        this.providerRepository = providerRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email)
            throws UsernameNotFoundException {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found"));

        boolean hasLocalLogin =
                providerRepository.existsByUserAndProviderType(
                        user,
                        AuthProviderType.LOCAL
                );

        if (!hasLocalLogin) {
            throw new RuntimeException("Use Google login for this account");
        }

        return org.springframework.security.core.userdetails.User
                .builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .roles("USER")
                .build();
    }
}