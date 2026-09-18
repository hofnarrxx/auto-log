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

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

import com.hofnarrxx.autolog.dto.PageResponse;
import com.hofnarrxx.autolog.dto.MaintenanceSummaryResponse;
import java.util.List;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.UUID;

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
    public PageResponse<MaintenanceResponse> getPage(@PathVariable UUID vehicleId,
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
        return maintenanceService.getPage(vehicleId, page, size, sort, title, categories, currency, minCost, maxCost);
    }

    @GetMapping("/summary")
    public MaintenanceSummaryResponse getSummary(@PathVariable UUID vehicleId) {
        return maintenanceService.getSummary(vehicleId);
    }

    @GetMapping("/{maintenanceId}")
    public MaintenanceResponse getById(@PathVariable UUID vehicleId,
            @PathVariable UUID maintenanceId) {
        return maintenanceService.getById(vehicleId, maintenanceId);
    }

    @PostMapping
    public MaintenanceResponse create(@PathVariable UUID vehicleId,
            @Valid @RequestBody MaintenanceRequest request) {
        return maintenanceService.create(vehicleId, request);
    }

    @PutMapping("/{maintenanceId}")
    public MaintenanceResponse update(@PathVariable UUID vehicleId,
            @PathVariable UUID maintenanceId,
            @Valid @RequestBody MaintenanceRequest request) {
        return maintenanceService.update(vehicleId, maintenanceId, request);
    }

    @DeleteMapping("/{maintenanceId}")
    public void delete(@PathVariable UUID vehicleId,
            @PathVariable UUID maintenanceId) {
        maintenanceService.delete(vehicleId, maintenanceId);
    }

    @PostMapping("/{maintenanceId}/attachments/upload-url")
    public MaintenanceUploadUrlResponse createUploadUrl(@PathVariable UUID vehicleId,
            @PathVariable UUID maintenanceId,
            @RequestBody MaintenanceUploadUrlRequest request) {
        return attachmentService.createUploadUrl(vehicleId, maintenanceId, request);
    }

    @PostMapping("/{maintenanceId}/attachments")
    public MaintenanceAttachmentResponse saveAttachment(@PathVariable UUID vehicleId,
            @PathVariable UUID maintenanceId,
            @RequestBody MaintenanceAttachmentRequest request) {
        return attachmentService.saveAttachment(vehicleId, maintenanceId, request);
    }

    @GetMapping("/{maintenanceId}/attachments/{attachmentId}/download-url")
    public MaintenanceDownloadUrlResponse createDownloadUrl(@PathVariable UUID vehicleId,
            @PathVariable UUID maintenanceId,
            @PathVariable UUID attachmentId) {
        return attachmentService.createDownloadUrl(vehicleId, maintenanceId, attachmentId);
    }

    @DeleteMapping("/{maintenanceId}/attachments/{attachmentId}")
    public void deleteAttachment(@PathVariable UUID vehicleId,
            @PathVariable UUID maintenanceId,
            @PathVariable UUID attachmentId) {
        attachmentService.deleteAttachment(vehicleId, maintenanceId, attachmentId);
    }
}
