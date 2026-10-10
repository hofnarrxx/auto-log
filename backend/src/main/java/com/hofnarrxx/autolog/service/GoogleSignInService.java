package com.hofnarrxx.autolog.service;

import java.util.Locale;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hofnarrxx.autolog.model.AuthProvider;
import com.hofnarrxx.autolog.model.AuthProviderType;
import com.hofnarrxx.autolog.model.User;
import com.hofnarrxx.autolog.repository.AuthProviderRepository;
import com.hofnarrxx.autolog.repository.EmailVerificationRepository;
import com.hofnarrxx.autolog.repository.UserRepository;

@Service
public class GoogleSignInService {
    public sealed interface Result {
        record Session(User user) implements Result {
        }

        record LinkRequired(String rawToken) implements Result {
        }

        record Rejected() implements Result {
        }
    }

    private final AuthProviderRepository providerRepository;
    private final UserRepository userRepository;
    private final EmailVerificationRepository emailVerificationRepository;
    private final GoogleLinkService googleLinkService;

    public GoogleSignInService(AuthProviderRepository providerRepository, UserRepository userRepository,
            EmailVerificationRepository emailVerificationRepository, GoogleLinkService googleLinkService) {
        this.providerRepository = providerRepository;
        this.userRepository = userRepository;
        this.emailVerificationRepository = emailVerificationRepository;
        this.googleLinkService = googleLinkService;
    }

    @Transactional
    public Result complete(String email, String googleSub, Boolean emailVerified) {
        if (email == null || email.isBlank() || googleSub == null || googleSub.isBlank()
                || !Boolean.TRUE.equals(emailVerified))
            return new Result.Rejected();

        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        Optional<AuthProvider> providerOpt = providerRepository.findByProviderTypeAndProviderId(AuthProviderType.GOOGLE,
                googleSub);
        if (providerOpt.isPresent())
            return new Result.Session(providerOpt.get().getUser());

        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);
        if (userOpt.isEmpty()) {
            User user = new User(normalizedEmail);
            user.setEmailVerified(true);
            userRepository.save(user);
            attachGoogle(user, googleSub);
            return new Result.Session(user);
        }

        User user = userOpt.get();
        if (user.isDemo())
            return new Result.Rejected();

        if (providerRepository.existsByUserAndProviderType(user, AuthProviderType.LOCAL)) {
            if (user.isEmailVerified()) {
                return new Result.LinkRequired(googleLinkService.begin(user, googleSub));
            } else {
                user.setEmailVerified(true);
                user.setPassword(null);
                providerRepository.deleteByUserAndProviderType(user, AuthProviderType.LOCAL);
                emailVerificationRepository.deleteByUser(user);
                attachGoogle(user, googleSub);
                return new Result.Session(user);
            }
        }

        return new Result.Rejected();
    }

    private void attachGoogle(User user, String googleSub) {
        AuthProvider provider = new AuthProvider();
        provider.setProviderType(AuthProviderType.GOOGLE);
        provider.setProviderId(googleSub);
        provider.setUser(user);
        providerRepository.save(provider);
    }
}
