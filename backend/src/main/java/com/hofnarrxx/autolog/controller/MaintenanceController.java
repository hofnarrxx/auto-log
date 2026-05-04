package com.hofnarrxx.autolog.controller;

import com.hofnarrxx.autolog.dto.MaintenanceAttachmentRequest;
import com.hofnarrxx.autolog.dto.MaintenanceAttachmentResponse;
import com.hofnarrxx.autolog.dto.MaintenanceDownloadUrlResponse;
import com.hofnarrxx.autolog.dto.MaintenanceRequest;
import com.hofnarrxx.autolog.dto.MaintenanceResponse;
import com.hofnarrxx.autolog.dto.MaintenanceUploadUrlRequest;
import com.hofnarrxx.autolog.dto.MaintenanceUploadUrlResponse;
import com.hofnarrxx.autolog.service.MaintenanceAttachmentService;
import com.hofnarrxx.autolog.service.MaintenanceService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/vehicles/{vehicleId}/maintenance")
public class MaintenanceController {
    private final MaintenanceService maintenanceService;
    private final MaintenanceAttachmentService attachmentService;

    public MaintenanceController(MaintenanceService maintenanceService,
                                 MaintenanceAttachmentService attachmentService) {
        this.maintenanceService = maintenanceService;
        this.attachmentService = attachmentService;
    }

    @GetMapping
    public List<MaintenanceResponse> getAll(@PathVariable Long vehicleId) {
        return maintenanceService.getAll(vehicleId);
    }

    @GetMapping("/{maintenanceId}")
    public MaintenanceResponse getById(@PathVariable Long vehicleId,
                                       @PathVariable Long maintenanceId) {
        return maintenanceService.getById(vehicleId, maintenanceId);
    }

    @PostMapping
    public MaintenanceResponse create(@PathVariable Long vehicleId,
                                      @RequestBody MaintenanceRequest request) {
        return maintenanceService.create(vehicleId, request);
    }

    @PutMapping("/{maintenanceId}")
    public MaintenanceResponse update(@PathVariable Long vehicleId,
                                      @PathVariable Long maintenanceId,
                                      @RequestBody MaintenanceRequest request) {
        return maintenanceService.update(vehicleId, maintenanceId, request);
    }

    @DeleteMapping("/{maintenanceId}")
    public void delete(@PathVariable Long vehicleId,
                       @PathVariable Long maintenanceId) {
        maintenanceService.delete(vehicleId, maintenanceId);
    }

    @PostMapping("/{maintenanceId}/attachments/upload-url")
    public MaintenanceUploadUrlResponse createUploadUrl(@PathVariable Long vehicleId,
                                                        @PathVariable Long maintenanceId,
                                                        @RequestBody MaintenanceUploadUrlRequest request) {
        return attachmentService.createUploadUrl(vehicleId, maintenanceId, request);
    }

    @PostMapping("/{maintenanceId}/attachments")
    public MaintenanceAttachmentResponse saveAttachment(@PathVariable Long vehicleId,
                                                        @PathVariable Long maintenanceId,
                                                        @RequestBody MaintenanceAttachmentRequest request) {
        return attachmentService.saveAttachment(vehicleId, maintenanceId, request);
    }

    @GetMapping("/{maintenanceId}/attachments/{attachmentId}/download-url")
    public MaintenanceDownloadUrlResponse createDownloadUrl(@PathVariable Long vehicleId,
                                                            @PathVariable Long maintenanceId,
                                                            @PathVariable Long attachmentId) {
        return attachmentService.createDownloadUrl(vehicleId, maintenanceId, attachmentId);
    }
}

