package com.hofnarrxx.autolog.service;

import com.hofnarrxx.autolog.dto.MaintenanceAttachmentResponse;
import com.hofnarrxx.autolog.dto.MaintenanceRequest;
import com.hofnarrxx.autolog.dto.MaintenanceResponse;
import com.hofnarrxx.autolog.exception.InvalidCurrencyException;
import com.hofnarrxx.autolog.exception.InvalidMaintenanceCategoryException;
import com.hofnarrxx.autolog.exception.MaintenanceNotFoundException;
import com.hofnarrxx.autolog.exception.VehicleNotFoundException;
import com.hofnarrxx.autolog.model.Currency;
import com.hofnarrxx.autolog.model.Maintenance;
import com.hofnarrxx.autolog.model.MaintenanceCategory;
import com.hofnarrxx.autolog.model.Vehicle;
import com.hofnarrxx.autolog.repository.MaintenanceRepository;
import com.hofnarrxx.autolog.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import com.hofnarrxx.autolog.dto.PageResponse;
import com.hofnarrxx.autolog.dto.PageRequestParams;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Page;
import com.hofnarrxx.autolog.model.MaintenanceSort;

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

    public PageResponse<MaintenanceResponse> getPage(Long vehicleId, Integer page, Integer size, String sort,
            String title, List<String> categories, String currency, BigDecimal minCost, BigDecimal maxCost) {
        Long userId = authService.getCurrentUser().getId();
        boolean hasCategories = true;
        PageRequestParams pageRequestParams = PageRequestParams.of(page, size);
        Sort maintenanceSort = MaintenanceSort.fromParam(sort).toSort();
        PageRequest pageRequest = PageRequest.of(pageRequestParams.page(), pageRequestParams.size(), maintenanceSort);
        if (categories == null) {
            hasCategories = false;
            categories = List.of("_");
        }
        if (categories != null && categories.isEmpty()) {
            return PageResponse.from(Page.empty(pageRequest), this::toListResponse);
        }
        Page<Maintenance> maintenancePage = maintenanceRepository.findPageForOwner(vehicleId, userId, hasCategories,
                categories, Currency.fromDisplayName(currency).orElse(null), minCost, maxCost, title, pageRequest);
        return PageResponse.from(maintenancePage, this::toListResponse);
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

        Maintenance savedMaintenance = maintenanceRepository.save(maintenance);
        updateVehicleMileageIfNeeded(vehicle, savedMaintenance.getMileage());

        return toResponse(savedMaintenance);
    }

    public MaintenanceResponse update(Long vehicleId, Long maintenanceId, MaintenanceRequest request) {
        Long userId = authService.getCurrentUser().getId();
        Maintenance existing = findOwnedMaintenance(vehicleId, maintenanceId, userId);
        Vehicle vehicle = existing.getVehicle();
        applyRequest(existing, request);

        Maintenance savedMaintenance = maintenanceRepository.save(existing);
        updateVehicleMileageIfNeeded(vehicle, savedMaintenance.getMileage());

        return toResponse(savedMaintenance);
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
        return maintenanceRepository
                .findWithAttachmentsByIdAndVehicleIdAndVehicleUserId(maintenanceId, vehicleId, userId)
                .orElseThrow(MaintenanceNotFoundException::new);
    }

    private void applyRequest(Maintenance maintenance, MaintenanceRequest request) {
        MaintenanceCategory category = MaintenanceCategory.fromDisplayName(request.category())
                .orElseThrow(() -> new InvalidMaintenanceCategoryException(
                        request.category(),
                        MaintenanceCategory.allowedValues()));

        Currency currency = Currency.fromDisplayName(request.currency())
                .orElseThrow(() -> new InvalidCurrencyException(
                        request.currency(),
                        Currency.allowedValues()));

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
        maintenance.setCurrency(currency);
    }

    private MaintenanceResponse toResponse(Maintenance maintenance) {
        List<MaintenanceAttachmentResponse> attachments = maintenance.getAttachments()
                .stream()
                .map(attachment -> new MaintenanceAttachmentResponse(
                        attachment.getId(),
                        attachment.getFileName(),
                        attachment.getContentType(),
                        attachment.getSizeBytes(),
                        attachment.getUrl(),
                        attachment.getCreatedAt()))
                .toList();

        return new MaintenanceResponse(
                maintenance.getId(),
                maintenance.getVehicle().getId(),
                maintenance.getServiceDate(),
                maintenance.getTitle(),
                maintenance.getMileage(),
                maintenance.getCategory(),
                maintenance.getDescription(),
                maintenance.getCost(),
                maintenance.getCurrency() == null ? null : maintenance.getCurrency().getDisplayName(),
                attachments,
                maintenance.getCreatedAt(),
                maintenance.getUpdatedAt());
    }

    private MaintenanceResponse toListResponse(Maintenance maintenance) {
        return new MaintenanceResponse(
                maintenance.getId(),
                maintenance.getVehicle().getId(),
                maintenance.getServiceDate(),
                maintenance.getTitle(),
                maintenance.getMileage(),
                maintenance.getCategory(),
                maintenance.getDescription(),
                maintenance.getCost(),
                maintenance.getCurrency() == null ? null : maintenance.getCurrency().getDisplayName(),
                List.of(),
                maintenance.getCreatedAt(),
                maintenance.getUpdatedAt());
    }

    private void updateVehicleMileageIfNeeded(Vehicle vehicle, Integer maintenanceMileage) {
        if (maintenanceMileage != null && (vehicle.getMileage() == null || maintenanceMileage > vehicle.getMileage())) {
            vehicle.setMileage(maintenanceMileage.doubleValue());
            vehicleRepository.save(vehicle);
        }
    }
}
