package com.hofnarrxx.autolog.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hofnarrxx.autolog.model.GoogleLinkToken;
import com.hofnarrxx.autolog.model.User;

@Repository 
public interface GoogleLinkTokenRepository extends JpaRepository<GoogleLinkToken, UUID>{
    Optional<GoogleLinkToken> findByTokenHash(String tokenHash);
    void deleteByUser(User user);
}
