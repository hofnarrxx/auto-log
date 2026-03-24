package com.hofnarrxx.autolog.controller;

import com.hofnarrxx.autolog.dto.MaintenanceRequest;
import com.hofnarrxx.autolog.dto.MaintenanceResponse;
import com.hofnarrxx.autolog.service.MaintenanceService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/vehicles/{vehicleId}/maintenance")
public class MaintenanceController {
    private final MaintenanceService maintenanceService;

    public MaintenanceController(MaintenanceService maintenanceService) {
        this.maintenanceService = maintenanceService;
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
}

