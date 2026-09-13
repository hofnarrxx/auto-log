package com.hofnarrxx.autolog.repository;

import com.hofnarrxx.autolog.model.AuthProvider;
import com.hofnarrxx.autolog.model.AuthProviderType;
import com.hofnarrxx.autolog.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AuthProviderRepository extends JpaRepository<AuthProvider, UUID> {
    Optional<AuthProvider> findByProviderTypeAndProviderId(
            AuthProviderType providerType,
            String providerId
    );

    boolean existsByUserAndProviderType(User user, AuthProviderType providerType);
}
