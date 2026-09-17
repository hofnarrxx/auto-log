package com.hofnarrxx.autolog.repository;

import com.hofnarrxx.autolog.model.ShareLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShareLinkRepository extends JpaRepository<ShareLink, UUID> {
    boolean existsByToken(String token);

    Optional<ShareLink> findByTokenAndRevokedFalse(String token);

    Optional<ShareLink> findByTokenAndRevokedFalseAndExpiresAtAfter(String token, Instant now);

    Optional<ShareLink> findByIdAndCreatedBy(UUID id, UUID createdBy);

    List<ShareLink> findByCarIdAndCreatedByOrderByCreatedAtDesc(UUID carId, UUID createdBy);

    List<ShareLink> findByCarIdAndCreatedByAndRevokedFalse(UUID carId, UUID createdBy);

    int countByCarIdAndCreatedByAndRevokedFalseAndExpiresAtAfter(UUID carId, UUID createdBy, Instant now);
}

