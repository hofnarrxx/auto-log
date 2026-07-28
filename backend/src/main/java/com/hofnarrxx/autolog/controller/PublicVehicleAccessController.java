package com.hofnarrxx.autolog.controller;

import com.hofnarrxx.autolog.dto.MaintenanceDownloadUrlResponse;
import com.hofnarrxx.autolog.dto.PublicVehicleAccessResponse;
import com.hofnarrxx.autolog.service.MaintenanceAttachmentService;
import com.hofnarrxx.autolog.service.PublicVehicleAccessService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PublicVehicleAccessController {

    private final PublicVehicleAccessService publicVehicleAccessService;
    private final MaintenanceAttachmentService maintenanceAttachmentService;

    public PublicVehicleAccessController(PublicVehicleAccessService publicVehicleAccessService,
                                         MaintenanceAttachmentService maintenanceAttachmentService) {
        this.publicVehicleAccessService = publicVehicleAccessService;
        this.maintenanceAttachmentService = maintenanceAttachmentService;
    }

    @GetMapping("/share/{token}")
    public PublicVehicleAccessResponse getByToken(@PathVariable String token) {
        return publicVehicleAccessService.getByToken(token);
    }

    @GetMapping("/share/{token}/maintenance/{maintenanceId}/attachments/{attachmentId}/download-url")
    public MaintenanceDownloadUrlResponse getMaintenanceAttachmentDownloadUrl(@PathVariable String token,
                                                                              @PathVariable Long maintenanceId,
                                                                              @PathVariable Long attachmentId) {
        return maintenanceAttachmentService.createPublicDownloadUrl(token, maintenanceId, attachmentId);
    }
}

