package com.hofnarrxx.autolog.service;

import com.hofnarrxx.autolog.dto.MaintenanceRequest;
import com.hofnarrxx.autolog.dto.MaintenanceResponse;
import com.hofnarrxx.autolog.exception.InvalidMaintenanceCategoryException;
import com.hofnarrxx.autolog.exception.MaintenanceNotFoundException;
import com.hofnarrxx.autolog.exception.VehicleNotFoundException;
import com.hofnarrxx.autolog.model.Maintenance;
import com.hofnarrxx.autolog.model.MaintenanceCategory;
import com.hofnarrxx.autolog.model.Vehicle;
import com.hofnarrxx.autolog.repository.MaintenanceRepository;
import com.hofnarrxx.autolog.repository.VehicleRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MaintenanceService {
    private final MaintenanceRepository maintenanceRepository;
    private final VehicleRepository vehicleRepository;
    private final AuthService authService;

    public MaintenanceService(MaintenanceRepository maintenanceRepository,
                              VehicleRepository vehicleRepository,
                              AuthService authService) {
        this.maintenanceRepository = maintenanceRepository;
        this.vehicleRepository = vehicleRepository;
        this.authService = authService;
    }

    public List<MaintenanceResponse> getAll(Long vehicleId) {
        Long userId = authService.getCurrentUser().getId();
        ensureVehicleOwnedByCurrentUser(vehicleId, userId);

        return maintenanceRepository.findByVehicleIdAndVehicleUserId(vehicleId, userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public MaintenanceResponse getById(Long vehicleId, Long maintenanceId) {
        Long userId = authService.getCurrentUser().getId();
        Maintenance maintenance = findOwnedMaintenance(vehicleId, maintenanceId, userId);
        return toResponse(maintenance);
    }

    public MaintenanceResponse create(Long vehicleId, MaintenanceRequest request) {
        Long userId = authService.getCurrentUser().getId();
        Vehicle vehicle = vehicleRepository.findByIdAndUserId(vehicleId, userId)
                .orElseThrow(VehicleNotFoundException::new);

        Maintenance maintenance = new Maintenance();
        applyRequest(maintenance, request);
        maintenance.setVehicle(vehicle);

        return toResponse(maintenanceRepository.save(maintenance));
    }

    public MaintenanceResponse update(Long vehicleId, Long maintenanceId, MaintenanceRequest request) {
        Long userId = authService.getCurrentUser().getId();
        Maintenance existing = findOwnedMaintenance(vehicleId, maintenanceId, userId);
        applyRequest(existing, request);

        return toResponse(maintenanceRepository.save(existing));
    }

    public void delete(Long vehicleId, Long maintenanceId) {
        Long userId = authService.getCurrentUser().getId();
        Maintenance maintenance = findOwnedMaintenance(vehicleId, maintenanceId, userId);
        maintenanceRepository.delete(maintenance);
    }

    private void ensureVehicleOwnedByCurrentUser(Long vehicleId, Long userId) {
        vehicleRepository.findByIdAndUserId(vehicleId, userId)
                .orElseThrow(VehicleNotFoundException::new);
    }

    private Maintenance findOwnedMaintenance(Long vehicleId, Long maintenanceId, Long userId) {
        ensureVehicleOwnedByCurrentUser(vehicleId, userId);
        return maintenanceRepository.findByIdAndVehicleIdAndVehicleUserId(maintenanceId, vehicleId, userId)
                .orElseThrow(MaintenanceNotFoundException::new);
    }

    private void applyRequest(Maintenance maintenance, MaintenanceRequest request) {
        MaintenanceCategory category = MaintenanceCategory.fromDisplayName(request.category())
                .orElseThrow(() -> new InvalidMaintenanceCategoryException(
                        request.category(),
                        MaintenanceCategory.allowedValues()
                ));

        String title = request.title() == null ? null : request.title().trim();
        if (title != null && title.length() > 50) {
            title = title.substring(0, 50);
        }

        maintenance.setServiceDate(request.serviceDate());
        maintenance.setTitle(title);
        maintenance.setMileage(request.mileage());
        maintenance.setCategory(category.getDisplayName());
        maintenance.setDescription(request.description());
        maintenance.setCost(request.cost());
    }

    private MaintenanceResponse toResponse(Maintenance maintenance) {
        return new MaintenanceResponse(
                maintenance.getId(),
                maintenance.getVehicle().getId(),
                maintenance.getServiceDate(),
            maintenance.getTitle(),
                maintenance.getMileage(),
                maintenance.getCategory(),
                maintenance.getDescription(),
                maintenance.getCost(),
                maintenance.getCreatedAt(),
                maintenance.getUpdatedAt()
        );
    }
}
