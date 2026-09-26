package com.hofnarrxx.autolog.service;

import com.hofnarrxx.autolog.config.R2Properties;
import com.hofnarrxx.autolog.dto.VehicleRequest;
import com.hofnarrxx.autolog.dto.VehicleResponse;
import com.hofnarrxx.autolog.exception.VehicleNotFoundException;
import com.hofnarrxx.autolog.exception.InvalidFuelTypeException;
import com.hofnarrxx.autolog.model.FuelType;
import com.hofnarrxx.autolog.model.Vehicle;
import com.hofnarrxx.autolog.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class VehicleService {
    private static final Duration PRESIGNED_URL_TTL = Duration.ofMinutes(60);

    private final VehicleRepository repository;
    private final AuthService authService;
    private final ShareLinkService shareLinkService;
    private final S3Presigner presigner;
    private final R2Properties properties;

    public VehicleService(VehicleRepository repository,
                          AuthService authService,
                          ShareLinkService shareLinkService,
                          S3Presigner presigner,
                          R2Properties properties) {
        this.authService = authService;
        this.shareLinkService = shareLinkService;
        this.repository = repository;
        this.presigner = presigner;
        this.properties = properties;
    }

    public List<VehicleResponse> getAll() {
        return repository.findByUserIdAndDeletedAtIsNull(authService.getCurrentUser().getId())
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
            String imageKey = normalize(request.imageKey());
            validateImageKey(saved.getId(), imageKey);
            saved.setImage(imageKey);
            saved = repository.save(saved);
        }

        return toResponse(saved);
    }

    public VehicleResponse update(UUID id, VehicleRequest request) {
        Vehicle existing = repository.findByIdAndUserIdAndDeletedAtIsNull(id, authService.getCurrentUser().getId())
                .orElseThrow(VehicleNotFoundException::new);
        applyRequest(existing, request, false);

        if (request.imageKey() != null) {
            if (request.imageKey().isBlank()) {
                existing.setImage(null);
            } else {
                String imageKey = normalize(request.imageKey());
                validateImageKey(existing.getId(), imageKey);
                existing.setImage(imageKey);
            }
        }

        return toResponse(repository.save(existing));
    }

    @Transactional
    public void delete(UUID id){
        Vehicle vehicle = repository.findByIdAndUserIdAndDeletedAtIsNull(id, authService.getCurrentUser().getId())
                .orElseThrow(VehicleNotFoundException::new);
        vehicle.setDeletedAt(Instant.now());
        repository.save(vehicle);
        shareLinkService.revokeAllForCar(id);
    }

    private void applyRequest(Vehicle vehicle, VehicleRequest request, boolean allowNulls) {
        // allowNulls is true when creating a new vehicle, false when updating
        // when creating - we require necessary fields
        // when updating - only fields in request that are not null are applied
        if(allowNulls) {
            requirePresent(request.make(), "make");
            requirePresent(request.model(), "model");
            requirePresent(request.fuelType(), "fuelType");
            requirePresent(request.mileage(), "mileage");
            requirePresent(request.year(), "year");
        }

        validateYear(request.year());
        
        if (allowNulls || request.make() != null) {
            vehicle.setMake(request.make());
        }
        if (allowNulls || request.model() != null) {
            vehicle.setModel(request.model());
        }
        if (allowNulls || request.fuelType() != null) {
            vehicle.setFuelType(parseFuelType(request.fuelType()));
        }
        if (allowNulls || request.mileage() != null) {
            vehicle.setMileage(request.mileage());
        }
        if (allowNulls || request.year() != null) {
            vehicle.setYear(request.year());
        }
        if (allowNulls || request.licensePlate() != null) {
            String licensePlate = normalize(request.licensePlate());
            vehicle.setLicensePlate(hasText(licensePlate) ? licensePlate : null);
        }
    }

    private void requirePresent(Object value, String field) {
        if (value == null) {
            throw new IllegalArgumentException(field + " is required");
        }
    }
    private void validateYear(Integer year) {
        if (year != null && year > java.time.Year.now().getValue()) {
            throw new IllegalArgumentException("year must not be in the future");
        }
    }

    private FuelType parseFuelType(String value) {
        if(value == null) return null;
        return FuelType.fromDisplayName(value)
                .orElseThrow(() -> new InvalidFuelTypeException(value, FuelType.allowedValues()));
    }

    private VehicleResponse toResponse(Vehicle vehicle) {
        String imageKey = normalize(vehicle.getImage());
        String imageUrl = resolveImageUrl(vehicle.getId(), imageKey);

        return new VehicleResponse(
                vehicle.getId(),
                vehicle.getMake(),
                vehicle.getModel(),
                vehicle.getFuelType().getDisplayName(),
                vehicle.getMileage(),
                vehicle.getYear(),
                vehicle.getLicensePlate(),
                imageKey,
                imageUrl
        );
    }

    private String resolveImageUrl(UUID vehicleId, String imageKey) {
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

    private void validateImageKey(UUID vehicleId, String imageKey) {
        if (!hasText(imageKey) || !imageKey.startsWith(imagePrefix(vehicleId))) {
            throw new IllegalArgumentException("Invalid image key");
        }
    }

    private String imagePrefix(UUID vehicleId) {
        return String.format("vehicles/%s/", vehicleId);
    }

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
