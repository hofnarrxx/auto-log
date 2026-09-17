package com.hofnarrxx.autolog.service;

import com.hofnarrxx.autolog.exception.VehicleNotFoundException;
import com.hofnarrxx.autolog.model.ShareLink;
import com.hofnarrxx.autolog.model.User;
import com.hofnarrxx.autolog.model.Vehicle;
import com.hofnarrxx.autolog.repository.ShareLinkRepository;
import com.hofnarrxx.autolog.repository.VehicleRepository;
import com.hofnarrxx.autolog.utils.SecureTokenGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

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
    public ShareLink create(UUID carId, Instant expiresAt, Boolean includeAttachments) {
        User user = authService.getCurrentUser();

        Vehicle vehicle = vehicleRepository.findByIdAndUserIdAndDeletedAtIsNull(carId, user.getId())
                .orElseThrow(VehicleNotFoundException::new);

        int activeLinks = shareLinkRepository.countByVehicleIdAndCreatedByIdAndRevokedFalseAndExpiresAtAfter(
            carId,
            user.getId(),
            Instant.now()
        );
        if (activeLinks >= 1) {
            throw new IllegalArgumentException("Active share link limit reached");
        }

        validateExpiry(expiresAt);

        ShareLink shareLink = new ShareLink();
        shareLink.setToken(generateUniqueToken());
        shareLink.setVehicle(vehicle);
        shareLink.setCreatedBy(user);
        shareLink.setExpiresAt(expiresAt);
        shareLink.setRevoked(false);
        shareLink.setIncludeAttachments(includeAttachments == null || includeAttachments);

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
    public List<ShareLink> getForCar(UUID carId) {
        UUID userId = authService.getCurrentUser().getId();

        vehicleRepository.findByIdAndUserIdAndDeletedAtIsNull(carId, userId)
                .orElseThrow(VehicleNotFoundException::new);

        return shareLinkRepository.findByVehicleIdAndCreatedByIdOrderByCreatedAtDesc(carId, userId);
    }

    @Transactional
    public void revoke(UUID shareLinkId) {
        UUID userId = authService.getCurrentUser().getId();

        shareLinkRepository.findByIdAndCreatedById(shareLinkId, userId)
                .ifPresent(link -> {
                    link.setRevoked(true);
                    shareLinkRepository.save(link);
                });
    }

    @Transactional
    public void revokeAllForCar(UUID carId) {
        UUID userId = authService.getCurrentUser().getId();
        shareLinkRepository.findByVehicleIdAndCreatedByIdAndRevokedFalse(carId, userId).forEach(link -> {
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

