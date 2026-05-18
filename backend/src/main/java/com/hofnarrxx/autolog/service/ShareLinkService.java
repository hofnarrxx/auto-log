package com.hofnarrxx.autolog.service;

import com.hofnarrxx.autolog.exception.VehicleNotFoundException;
import com.hofnarrxx.autolog.model.ShareLink;
import com.hofnarrxx.autolog.repository.ShareLinkRepository;
import com.hofnarrxx.autolog.repository.VehicleRepository;
import com.hofnarrxx.autolog.utils.SecureTokenGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class ShareLinkService {

    private static final int TOKEN_RETRY_LIMIT = 5;

    private final ShareLinkRepository shareLinkRepository;
    private final VehicleRepository vehicleRepository;
    private final AuthService authService;
    private final SecureTokenGenerator secureTokenGenerator;

    public ShareLinkService(ShareLinkRepository shareLinkRepository,
                            VehicleRepository vehicleRepository,
                            AuthService authService,
                            SecureTokenGenerator secureTokenGenerator) {
        this.shareLinkRepository = shareLinkRepository;
        this.vehicleRepository = vehicleRepository;
        this.authService = authService;
        this.secureTokenGenerator = secureTokenGenerator;
    }

    @Transactional
    public ShareLink create(Long carId, Instant expiresAt) {
        Long userId = authService.getCurrentUser().getId();

        vehicleRepository.findByIdAndUserId(carId, userId)
                .orElseThrow(VehicleNotFoundException::new);

        int activeLinks = shareLinkRepository.countByCarIdAndCreatedByAndRevokedFalseAndExpiresAtAfter(
            carId,
            userId,
            Instant.now()
        );
        if (activeLinks >= 1) {
            throw new IllegalArgumentException("Active share link limit reached");
        }

        validateExpiry(expiresAt);

        ShareLink shareLink = new ShareLink();
        shareLink.setToken(generateUniqueToken());
        shareLink.setCarId(carId);
        shareLink.setCreatedBy(userId);
        shareLink.setExpiresAt(expiresAt);
        shareLink.setRevoked(false);

        return shareLinkRepository.save(shareLink);
    }

    @Transactional(readOnly = true)
    public Optional<ShareLink> resolveActive(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }

        return shareLinkRepository.findByTokenAndRevokedFalseAndExpiresAtAfter(token, Instant.now());
    }

    @Transactional(readOnly = true)
    public List<ShareLink> getForCar(Long carId) {
        Long userId = authService.getCurrentUser().getId();

        vehicleRepository.findByIdAndUserId(carId, userId)
                .orElseThrow(VehicleNotFoundException::new);

        return shareLinkRepository.findByCarIdAndCreatedByOrderByCreatedAtDesc(carId, userId);
    }

    @Transactional
    public void revoke(Long shareLinkId) {
        Long userId = authService.getCurrentUser().getId();

        shareLinkRepository.findByIdAndCreatedBy(shareLinkId, userId)
                .ifPresent(link -> {
                    link.setRevoked(true);
                    shareLinkRepository.save(link);
                });
    }

    private String generateUniqueToken() {
        for (int i = 0; i < TOKEN_RETRY_LIMIT; i++) {
            String candidate = secureTokenGenerator.generateToken();
            if (!shareLinkRepository.existsByToken(candidate)) {
                return candidate;
            }
        }

        throw new IllegalStateException("Could not generate unique share token");
    }

    private void validateExpiry(Instant expiresAt) {
        if (expiresAt == null || !expiresAt.isAfter(Instant.now())) {
            throw new IllegalArgumentException("expiresAt must be in the future");
        }
    }
}

