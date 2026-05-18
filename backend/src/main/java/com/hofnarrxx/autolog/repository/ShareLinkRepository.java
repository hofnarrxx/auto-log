package com.hofnarrxx.autolog.repository;

import com.hofnarrxx.autolog.model.ShareLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShareLinkRepository extends JpaRepository<ShareLink, Long> {
    boolean existsByToken(String token);

    Optional<ShareLink> findByTokenAndRevokedFalse(String token);

    Optional<ShareLink> findByTokenAndRevokedFalseAndExpiresAtAfter(String token, Instant now);

    Optional<ShareLink> findByIdAndCreatedBy(Long id, Long createdBy);

    List<ShareLink> findByCarIdAndCreatedByOrderByCreatedAtDesc(Long carId, Long createdBy);

    int countByCarIdAndCreatedByAndRevokedFalseAndExpiresAtAfter(Long carId, Long createdBy, Instant now);
}

