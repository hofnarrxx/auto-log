package com.hofnarrxx.autolog.service;

import com.hofnarrxx.autolog.config.R2Properties;
import com.hofnarrxx.autolog.dto.VehicleRequest;
import com.hofnarrxx.autolog.dto.VehicleResponse;
import com.hofnarrxx.autolog.exception.VehicleNotFoundException;
import com.hofnarrxx.autolog.model.Vehicle;
import com.hofnarrxx.autolog.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.time.Duration;
import java.util.List;

@Service
public class VehicleService {
    private static final Duration PRESIGNED_URL_TTL = Duration.ofMinutes(60);

    private final VehicleRepository repository;
    private final AuthService authService;
    private final S3Presigner presigner;
    private final R2Properties properties;

    public VehicleService(VehicleRepository repository,
                          AuthService authService,
                          S3Presigner presigner,
                          R2Properties properties) {
        this.authService = authService;
        this.repository = repository;
        this.presigner = presigner;
        this.properties = properties;
    }

    public List<VehicleResponse> getAll() {
        return repository.findByUserId(authService.getCurrentUser().getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public VehicleResponse create(VehicleRequest request) {
        Vehicle vehicle = new Vehicle();
        vehicle.setUser(authService.getCurrentUser());
        applyRequest(vehicle, request, true);

        Vehicle saved = repository.save(vehicle);

        if (hasText(request.imageKey())) {
            validateImageKey(saved.getId(), request.imageKey());
            saved.setImage(request.imageKey());
            saved = repository.save(saved);
        }

        return toResponse(saved);
    }

    public VehicleResponse update(Long id, VehicleRequest request) {
        Vehicle existing = repository.findByIdAndUserId(id, authService.getCurrentUser().getId())
                .orElseThrow(VehicleNotFoundException::new);
        applyRequest(existing, request, false);

        if (request.imageKey() != null) {
            if (request.imageKey().isBlank()) {
                existing.setImage(null);
            } else {
                validateImageKey(existing.getId(), request.imageKey());
                existing.setImage(request.imageKey());
            }
        }

        return toResponse(repository.save(existing));
    }

    public void delete(Long id){
        repository.deleteById(id);
    }

    private void applyRequest(Vehicle vehicle, VehicleRequest request, boolean allowNulls) {
        if (allowNulls || request.brand() != null) {
            vehicle.setBrand(request.brand());
        }
        if (allowNulls || request.model() != null) {
            vehicle.setModel(request.model());
        }
        if (allowNulls || request.fuelType() != null) {
            vehicle.setFuelType(request.fuelType());
        }
        if (allowNulls || request.mileage() != null) {
            vehicle.setMileage(request.mileage());
        }
        if (allowNulls || request.year() != null) {
            vehicle.setYear(request.year());
        }
        if (allowNulls || request.licensePlate() != null) {
            vehicle.setLicensePlate(request.licensePlate());
        }
    }

    private VehicleResponse toResponse(Vehicle vehicle) {
        String imageKey = normalize(vehicle.getImage());
        String imageUrl = resolveImageUrl(vehicle.getId(), imageKey);

        return new VehicleResponse(
                vehicle.getId(),
                vehicle.getBrand(),
                vehicle.getModel(),
                vehicle.getFuelType(),
                vehicle.getMileage(),
                vehicle.getYear(),
                vehicle.getLicensePlate(),
                imageKey,
                imageUrl
        );
    }

    private String resolveImageUrl(Long vehicleId, String imageKey) {
        if (!hasText(imageKey)) {
            return null;
        }

        if (!imageKey.startsWith(imagePrefix(vehicleId))) {
            return null;
        }

        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(properties.bucket())
                .key(imageKey)
                .build();

        PresignedGetObjectRequest presignedRequest = presigner.presignGetObject(
                GetObjectPresignRequest.builder()
                        .signatureDuration(PRESIGNED_URL_TTL)
                        .getObjectRequest(getObjectRequest)
                        .build()
        );

        return presignedRequest.url().toString();
    }

    private void validateImageKey(Long vehicleId, String imageKey) {
        String normalized = normalize(imageKey);
        if (!hasText(normalized) || !normalized.startsWith(imagePrefix(vehicleId))) {
            throw new IllegalArgumentException("Invalid image key");
        }
    }

    private String imagePrefix(Long vehicleId) {
        return String.format("vehicles/%d/", vehicleId);
    }

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
