package com.hofnarrxx.autolog.service;

import com.hofnarrxx.autolog.config.R2Properties;
import com.hofnarrxx.autolog.dto.VehicleImageDownloadUrlResponse;
import com.hofnarrxx.autolog.dto.VehicleImageUploadUrlRequest;
import com.hofnarrxx.autolog.dto.VehicleImageUploadUrlResponse;
import com.hofnarrxx.autolog.exception.VehicleNotFoundException;
import com.hofnarrxx.autolog.model.Vehicle;
import com.hofnarrxx.autolog.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.util.Locale;
import java.util.UUID;

@Service
public class VehicleImageService {
    private static final Duration PRESIGNED_URL_TTL = Duration.ofMinutes(10);
    private static final long MAX_IMAGE_BYTES = 5L * 1024 * 1024;

    private final VehicleRepository vehicleRepository;
    private final AuthService authService;
    private final S3Presigner presigner;
    private final R2Properties properties;

    public VehicleImageService(VehicleRepository vehicleRepository,
                               AuthService authService,
                               S3Presigner presigner,
                               R2Properties properties) {
        this.vehicleRepository = vehicleRepository;
        this.authService = authService;
        this.presigner = presigner;
        this.properties = properties;
    }

    public VehicleImageUploadUrlResponse createUploadUrl(Long vehicleId,
                                                         VehicleImageUploadUrlRequest request) {
        getOwnedVehicle(vehicleId);

        if (request.sizeBytes() == null || request.sizeBytes() <= 0 || request.sizeBytes() > MAX_IMAGE_BYTES) {
            throw new IllegalArgumentException("Image exceeds maximum size");
        }

        String contentType = normalize(request.contentType());
        if (!isAllowedContentType(contentType)) {
            throw new IllegalArgumentException("Unsupported file type");
        }

        String fileName = normalize(request.fileName());
        if (fileName == null || fileName.isBlank()) {
            throw new IllegalArgumentException("File name is required");
        }

        String objectKey = buildObjectKey(vehicleId, fileName);

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(properties.bucket())
                .key(objectKey)
                .contentType(contentType)
                .build();

        PresignedPutObjectRequest presignedRequest = presigner.presignPutObject(
                PutObjectPresignRequest.builder()
                        .signatureDuration(PRESIGNED_URL_TTL)
                        .putObjectRequest(putObjectRequest)
                        .build()
        );

        return new VehicleImageUploadUrlResponse(
                presignedRequest.url().toString(),
                objectKey
        );
    }

    public VehicleImageDownloadUrlResponse createDownloadUrl(Long vehicleId) {
        Vehicle vehicle = getOwnedVehicle(vehicleId);

        String objectKey = normalize(vehicle.getImage());
        if (objectKey == null || objectKey.isBlank()) {
            return new VehicleImageDownloadUrlResponse(null);
        }

        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(properties.bucket())
                .key(objectKey)
                .build();

        PresignedGetObjectRequest presignedRequest = presigner.presignGetObject(
                GetObjectPresignRequest.builder()
                        .signatureDuration(PRESIGNED_URL_TTL)
                        .getObjectRequest(getObjectRequest)
                        .build()
        );

        return new VehicleImageDownloadUrlResponse(presignedRequest.url().toString());
    }

    private Vehicle getOwnedVehicle(Long vehicleId) {
        Long userId = authService.getCurrentUser().getId();
        return vehicleRepository.findByIdAndUserId(vehicleId, userId)
                .orElseThrow(VehicleNotFoundException::new);
    }

    private String buildObjectKey(Long vehicleId, String fileName) {
        String sanitized = sanitizeFileName(fileName);
        String prefix = imagePrefix(vehicleId);
        return String.format("%s%s-%s", prefix, UUID.randomUUID(), sanitized);
    }

    private String imagePrefix(Long vehicleId) {
        return String.format("vehicles/%d/", vehicleId);
    }

    private String sanitizeFileName(String fileName) {
        String normalized = fileName.trim();
        normalized = normalized.replaceAll("[\\\\/]+", "_");
        normalized = normalized.replaceAll("[^A-Za-z0-9._-]", "_");
        if (normalized.isBlank()) {
            return "image";
        }
        return normalized;
    }

    private boolean isAllowedContentType(String contentType) {
        if (contentType == null) {
            return false;
        }
        String lower = contentType.toLowerCase(Locale.ROOT);
        return lower.startsWith("image/");
    }

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }
}
