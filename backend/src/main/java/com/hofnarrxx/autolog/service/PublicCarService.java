package com.hofnarrxx.autolog.service;

import com.hofnarrxx.autolog.dto.FuelResponse;
import com.hofnarrxx.autolog.dto.MaintenanceResponse;
import com.hofnarrxx.autolog.dto.PublicCarResponse;
import com.hofnarrxx.autolog.exception.ShareLinkNotFoundException;
import com.hofnarrxx.autolog.model.Fuel;
import com.hofnarrxx.autolog.model.Maintenance;
import com.hofnarrxx.autolog.model.ShareLink;
import com.hofnarrxx.autolog.model.Vehicle;
import com.hofnarrxx.autolog.repository.FuelRepository;
import com.hofnarrxx.autolog.repository.MaintenanceRepository;
import com.hofnarrxx.autolog.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PublicCarService {

    private final ShareLinkService shareLinkService;
    private final VehicleRepository vehicleRepository;
    private final FuelRepository fuelRepository;
    private final MaintenanceRepository maintenanceRepository;

    public PublicCarService(ShareLinkService shareLinkService,
                            VehicleRepository vehicleRepository,
                            FuelRepository fuelRepository,
                            MaintenanceRepository maintenanceRepository) {
        this.shareLinkService = shareLinkService;
        this.vehicleRepository = vehicleRepository;
        this.fuelRepository = fuelRepository;
        this.maintenanceRepository = maintenanceRepository;
    }

    @Transactional(readOnly = true)
    public PublicCarResponse getByToken(String token) {
        ShareLink shareLink = shareLinkService.resolveActive(token)
                .orElseThrow(ShareLinkNotFoundException::new);

        Vehicle vehicle = vehicleRepository.findById(shareLink.getCarId())
                .orElseThrow(ShareLinkNotFoundException::new);

        List<FuelResponse> fuelEntries = fuelRepository.findByVehicleIdOrderByCreatedAtDesc(vehicle.getId())
                .stream()
                .map(this::toFuelResponse)
                .toList();

        List<MaintenanceResponse> maintenanceEntries = maintenanceRepository
                .findByVehicleIdOrderByCreatedAtDesc(vehicle.getId())
                .stream()
                .map(this::toMaintenanceResponse)
                .toList();

        return new PublicCarResponse(
                vehicle.getId(),
                vehicle.getBrand(),
                vehicle.getModel(),
                vehicle.getFuelType(),
                vehicle.getMileage(),
                vehicle.getYear(),
                fuelEntries,
                maintenanceEntries
        );
    }

    private FuelResponse toFuelResponse(Fuel fuel) {
        return new FuelResponse(
                fuel.getId(),
                fuel.getVehicle().getId(),
                fuel.getDate(),
                fuel.getMileage(),
                fuel.getCost(),
                fuel.getAmount(),
                fuel.getGasStation(),
                fuel.getCurrency() == null ? null : fuel.getCurrency().getDisplayName(),
                fuel.getCreatedAt(),
                fuel.getUpdatedAt()
        );
    }

    private MaintenanceResponse toMaintenanceResponse(Maintenance maintenance) {
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
                maintenance.getCreatedAt(),
                maintenance.getUpdatedAt()
        );
    }
}
