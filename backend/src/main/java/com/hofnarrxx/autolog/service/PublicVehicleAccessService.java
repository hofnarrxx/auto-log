package com.hofnarrxx.autolog.service;

import com.hofnarrxx.autolog.dto.PublicVehicleAccessResponse;
import com.hofnarrxx.autolog.exception.ShareLinkNotFoundException;
import com.hofnarrxx.autolog.model.ShareLink;
import com.hofnarrxx.autolog.model.Vehicle;
import com.hofnarrxx.autolog.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.hofnarrxx.autolog.dto.FuelSummaryResponse;
import com.hofnarrxx.autolog.dto.MaintenanceSummaryResponse;
import com.hofnarrxx.autolog.dto.PageResponse;
import com.hofnarrxx.autolog.dto.FuelResponse;
import com.hofnarrxx.autolog.dto.MaintenanceResponse;
import java.math.BigDecimal;
import java.util.List;

@Service
public class PublicVehicleAccessService {

    private final ShareLinkService shareLinkService;
    private final VehicleRepository vehicleRepository;
    private final FuelService fuelService;
    private final MaintenanceService maintenanceService;

    private record ResolvedShare(ShareLink shareLink, Vehicle vehicle) {
    }

    public PublicVehicleAccessService(ShareLinkService shareLinkService,
            VehicleRepository vehicleRepository,
            FuelService fuelService,
            MaintenanceService maintenanceService) {
        this.shareLinkService = shareLinkService;
        this.vehicleRepository = vehicleRepository;
        this.fuelService = fuelService;
        this.maintenanceService = maintenanceService;
    }

    private ResolvedShare resolveShare(String token) {
        ShareLink shareLink = shareLinkService.resolveActive(token)
                .orElseThrow(ShareLinkNotFoundException::new);

        Vehicle vehicle = vehicleRepository.findById(shareLink.getCarId())
                .orElseThrow(ShareLinkNotFoundException::new);

        return new ResolvedShare(shareLink, vehicle);
    }

    @Transactional(readOnly = true)
    public PublicVehicleAccessResponse getByToken(String token) {
        ResolvedShare resolved = resolveShare(token);
        Vehicle vehicle = resolved.vehicle();

        FuelSummaryResponse fuelSummary = fuelService.getSummaryForPublicAccess(vehicle.getId());
        MaintenanceSummaryResponse maintenanceSummary = maintenanceService.getSummaryForPublicAccess(vehicle.getId());

        return new PublicVehicleAccessResponse(
                vehicle.getId(),
                vehicle.getBrand(),
                vehicle.getModel(),
                vehicle.getFuelType(),
                vehicle.getMileage(),
                vehicle.getYear(),
                fuelSummary,
                maintenanceSummary);
    }

    public PageResponse<FuelResponse> getFuelPage(String token, Integer page, Integer size,
            String sort, String gasStation) {
        Long vehicleId = resolveShare(token).vehicle().getId();
        return fuelService.getPageForPublicAccess(vehicleId, page, size, sort, gasStation);
    }

    public PageResponse<MaintenanceResponse> getMaintenancePage(String token, Integer page, Integer size,
            String sort, String title, List<String> categories, String currency,
            BigDecimal minCost, BigDecimal maxCost) {
        Long vehicleId = resolveShare(token).vehicle().getId();
        return maintenanceService.getPageForPublicAccess(
                vehicleId, page, size, sort, title, categories, currency, minCost, maxCost);
    }
}
