package com.hofnarrxx.autolog.repository;

import com.hofnarrxx.autolog.model.AuthProvider;
import com.hofnarrxx.autolog.model.AuthProviderType;
import com.hofnarrxx.autolog.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AuthProviderRepository extends JpaRepository<AuthProvider, Long> {
    Optional<AuthProvider> findByProviderTypeAndProviderId(
            AuthProviderType providerType,
            String providerId
    );

    boolean existsByUserAndProviderType(User user, AuthProviderType providerType);
}
