package com.hofnarrxx.autolog.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hofnarrxx.autolog.model.EmailVerificationToken;
import com.hofnarrxx.autolog.model.User;

public interface EmailVerificationRepository extends JpaRepository<EmailVerificationToken, UUID> {
    Optional<EmailVerificationToken> findByTokenHash(String tokenHash);
    void deleteByUser(User user);
}
