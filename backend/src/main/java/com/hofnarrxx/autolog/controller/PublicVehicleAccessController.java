package com.hofnarrxx.autolog.controller;

import com.hofnarrxx.autolog.dto.MaintenanceDownloadUrlResponse;
import com.hofnarrxx.autolog.dto.PublicVehicleAccessResponse;
import com.hofnarrxx.autolog.service.MaintenanceAttachmentService;
import com.hofnarrxx.autolog.service.PublicVehicleAccessService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import com.hofnarrxx.autolog.dto.PageResponse;
import com.hofnarrxx.autolog.dto.FuelResponse;
import com.hofnarrxx.autolog.dto.MaintenanceResponse;
import org.springframework.web.bind.annotation.RequestParam;
import java.math.BigDecimal;
import java.util.List;
import java.util.Arrays;

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

    @GetMapping("/share/{token}/fuel")
    public PageResponse<FuelResponse> getFuelPage(@PathVariable String token,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String gasStation) {
        return publicVehicleAccessService.getFuelPage(token, page, size, sort, gasStation);
    }

    @GetMapping("/share/{token}/maintenance")
    public PageResponse<MaintenanceResponse> getMaintenancePage(@PathVariable String token,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String categoriesCsv,
            @RequestParam(required = false) String currency,
            @RequestParam(required = false) BigDecimal minCost,
            @RequestParam(required = false) BigDecimal maxCost) {
        List<String> categories;
        if (categoriesCsv == null) {
            categories = null;
        } else if (categoriesCsv.isEmpty()) {
            categories = List.of();
        } else {
            categories = Arrays.stream(categoriesCsv.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        }
        return publicVehicleAccessService.getMaintenancePage(token, page, size, sort, title, categories, currency,
                minCost, maxCost);
    }

    @GetMapping("/share/{token}/maintenance/{maintenanceId}/attachments/{attachmentId}/download-url")
    public MaintenanceDownloadUrlResponse getMaintenanceAttachmentDownloadUrl(@PathVariable String token,
            @PathVariable Long maintenanceId,
            @PathVariable Long attachmentId) {
        return maintenanceAttachmentService.createPublicDownloadUrl(token, maintenanceId, attachmentId);
    }
}
