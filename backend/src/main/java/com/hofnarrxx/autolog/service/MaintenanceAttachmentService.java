package com.hofnarrxx.autolog.service;

import com.hofnarrxx.autolog.config.R2Properties;
import com.hofnarrxx.autolog.dto.MaintenanceAttachmentRequest;
import com.hofnarrxx.autolog.dto.MaintenanceAttachmentResponse;
import com.hofnarrxx.autolog.dto.MaintenanceDownloadUrlResponse;
import com.hofnarrxx.autolog.dto.MaintenanceUploadUrlRequest;
import com.hofnarrxx.autolog.dto.MaintenanceUploadUrlResponse;
import com.hofnarrxx.autolog.exception.MaintenanceNotFoundException;
import com.hofnarrxx.autolog.exception.VehicleNotFoundException;
import com.hofnarrxx.autolog.model.Maintenance;
import com.hofnarrxx.autolog.model.MaintenanceAttachment;
import com.hofnarrxx.autolog.repository.MaintenanceAttachmentRepository;
import com.hofnarrxx.autolog.repository.MaintenanceRepository;
import com.hofnarrxx.autolog.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.util.Locale;
import java.util.UUID;

@Service
public class MaintenanceAttachmentService {
    private static final Duration PRESIGNED_URL_TTL = Duration.ofMinutes(10);

    private final MaintenanceRepository maintenanceRepository;
    private final MaintenanceAttachmentRepository attachmentRepository;
    private final VehicleRepository vehicleRepository;
    private final AuthService authService;
    private final S3Presigner presigner;
    private final R2Properties properties;

    public MaintenanceAttachmentService(MaintenanceRepository maintenanceRepository,
                                        MaintenanceAttachmentRepository attachmentRepository,
                                        VehicleRepository vehicleRepository,
                                        AuthService authService,
                                        S3Presigner presigner,
                                        R2Properties properties) {
        this.maintenanceRepository = maintenanceRepository;
        this.attachmentRepository = attachmentRepository;
        this.vehicleRepository = vehicleRepository;
        this.authService = authService;
        this.presigner = presigner;
        this.properties = properties;
    }

    public MaintenanceUploadUrlResponse createUploadUrl(Long vehicleId,
                                                        Long maintenanceId,
                                                        MaintenanceUploadUrlRequest request) {
        Maintenance maintenance = getOwnedMaintenance(vehicleId, maintenanceId);

        String contentType = normalize(request.contentType());
        if (!isAllowedContentType(contentType)) {
            throw new IllegalArgumentException("Unsupported file type");
        }

        String fileName = normalize(request.fileName());
        if (fileName == null || fileName.isBlank()) {
            throw new IllegalArgumentException("File name is required");
        }

        String objectKey = buildObjectKey(vehicleId, maintenanceId, fileName);

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

        return new MaintenanceUploadUrlResponse(
                presignedRequest.url().toString(),
            objectKey
        );
    }

        public MaintenanceDownloadUrlResponse createDownloadUrl(Long vehicleId,
                                    Long maintenanceId,
                                    Long attachmentId) {
        getOwnedMaintenance(vehicleId, maintenanceId);

        MaintenanceAttachment attachment = attachmentRepository
            .findByIdAndMaintenanceId(attachmentId, maintenanceId)
            .orElseThrow(MaintenanceNotFoundException::new);

        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
            .bucket(properties.bucket())
            .key(attachment.getObjectKey())
            .build();

        PresignedGetObjectRequest presignedRequest = presigner.presignGetObject(
            GetObjectPresignRequest.builder()
                .signatureDuration(PRESIGNED_URL_TTL)
                .getObjectRequest(getObjectRequest)
                .build()
        );

        return new MaintenanceDownloadUrlResponse(presignedRequest.url().toString());
        }

    public MaintenanceAttachmentResponse saveAttachment(Long vehicleId,
                                                        Long maintenanceId,
                                                        MaintenanceAttachmentRequest request) {
        Maintenance maintenance = getOwnedMaintenance(vehicleId, maintenanceId);

        String contentType = normalize(request.contentType());
        if (!isAllowedContentType(contentType)) {
            throw new IllegalArgumentException("Unsupported file type");
        }

        String fileName = normalize(request.fileName());
        if (fileName == null || fileName.isBlank()) {
            throw new IllegalArgumentException("File name is required");
        }

        String objectKey = normalize(request.objectKey());
        if (objectKey == null || !objectKey.startsWith(attachmentPrefix(vehicleId, maintenanceId))) {
            throw new IllegalArgumentException("Invalid object key");
        }

        MaintenanceAttachment attachment = new MaintenanceAttachment();
        attachment.setMaintenance(maintenance);
        attachment.setObjectKey(objectKey);
        attachment.setFileName(trimToLength(fileName, 255));
        attachment.setContentType(contentType);
        attachment.setSizeBytes(request.sizeBytes());
        attachment.setUrl(null);

        MaintenanceAttachment saved = attachmentRepository.save(attachment);

        return toResponse(saved);
    }

    private Maintenance getOwnedMaintenance(Long vehicleId, Long maintenanceId) {
        Long userId = authService.getCurrentUser().getId();

        vehicleRepository.findByIdAndUserId(vehicleId, userId)
                .orElseThrow(VehicleNotFoundException::new);

        return maintenanceRepository.findByIdAndVehicleIdAndVehicleUserId(maintenanceId, vehicleId, userId)
                .orElseThrow(MaintenanceNotFoundException::new);
    }

    private String buildObjectKey(Long vehicleId, Long maintenanceId, String fileName) {
        String sanitized = sanitizeFileName(fileName);
        String prefix = attachmentPrefix(vehicleId, maintenanceId);
        return String.format("%s%s-%s", prefix, UUID.randomUUID(), sanitized);
    }

    private String attachmentPrefix(Long vehicleId, Long maintenanceId) {
        return String.format("maintenance/%d/%d/", vehicleId, maintenanceId);
    }

    private String sanitizeFileName(String fileName) {
        String normalized = fileName.trim();
        normalized = normalized.replaceAll("[\\\\/]+", "_");
        normalized = normalized.replaceAll("[^A-Za-z0-9._-]", "_");
        if (normalized.isBlank()) {
            return "file";
        }
        return normalized;
    }

    private boolean isAllowedContentType(String contentType) {
        if (contentType == null) {
            return false;
        }
        String lower = contentType.toLowerCase(Locale.ROOT);
        return lower.equals("application/pdf") || lower.startsWith("image/");
    }

    private MaintenanceAttachmentResponse toResponse(MaintenanceAttachment attachment) {
        return new MaintenanceAttachmentResponse(
                attachment.getId(),
                attachment.getFileName(),
                attachment.getContentType(),
                attachment.getSizeBytes(),
                attachment.getUrl(),
                attachment.getCreatedAt()
        );
    }

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }

    private String trimToLength(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }
}
