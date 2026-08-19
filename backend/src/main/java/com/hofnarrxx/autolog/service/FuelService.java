package com.hofnarrxx.autolog.service;

import com.hofnarrxx.autolog.dto.FuelRequest;
import com.hofnarrxx.autolog.dto.FuelResponse;
import com.hofnarrxx.autolog.exception.FuelNotFoundException;
import com.hofnarrxx.autolog.exception.InvalidCurrencyException;
import com.hofnarrxx.autolog.exception.VehicleNotFoundException;
import com.hofnarrxx.autolog.model.Currency;
import com.hofnarrxx.autolog.model.Fuel;
import com.hofnarrxx.autolog.model.FuelSort;
import com.hofnarrxx.autolog.model.Vehicle;
import com.hofnarrxx.autolog.repository.FuelRepository;
import com.hofnarrxx.autolog.repository.VehicleRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import com.hofnarrxx.autolog.dto.PageRequestParams;
import com.hofnarrxx.autolog.dto.PageResponse;

@Service
public class FuelService {
    private final FuelRepository fuelRepository;
    private final VehicleRepository vehicleRepository;
    private final AuthService authService;

    public FuelService(FuelRepository fuelRepository,
            VehicleRepository vehicleRepository,
            AuthService authService) {
        this.fuelRepository = fuelRepository;
        this.vehicleRepository = vehicleRepository;
        this.authService = authService;
    }

    public PageResponse<FuelResponse> getPage(Long vehicleId, Integer page, Integer size, String sortParam,
            String gasStation) {
        Long userId = authService.getCurrentUser().getId();
        PageRequestParams pageRequestParams = PageRequestParams.of(page, size);
        Sort fuelSort = FuelSort.fromParam(sortParam).toSort();
        PageRequest pageRequest = PageRequest.of(pageRequestParams.page(), pageRequestParams.size(), fuelSort);
        Page<Fuel> fuelPage = fuelRepository.findPageForOwner(vehicleId, userId, gasStation, pageRequest);
        return PageResponse.from(fuelPage, this::toResponse);        
    }

    public FuelResponse getById(Long vehicleId, Long fuelId) {
        Long userId = authService.getCurrentUser().getId();
        Fuel fuel = findOwnedFuel(vehicleId, fuelId, userId);
        return toResponse(fuel);
    }

    public FuelResponse create(Long vehicleId, FuelRequest request) {
        Long userId = authService.getCurrentUser().getId();
        Vehicle vehicle = vehicleRepository.findByIdAndUserId(vehicleId, userId)
                .orElseThrow(VehicleNotFoundException::new);

        Fuel fuel = new Fuel();
        applyRequest(fuel, request);
        fuel.setVehicle(vehicle);

        Fuel savedFuel = fuelRepository.save(fuel);
        updateVehicleMileageIfNeeded(vehicle, savedFuel.getMileage());

        return toResponse(savedFuel);
    }

    public FuelResponse update(Long vehicleId, Long fuelId, FuelRequest request) {
        Long userId = authService.getCurrentUser().getId();
        Fuel existing = findOwnedFuel(vehicleId, fuelId, userId);
        Vehicle vehicle = existing.getVehicle();
        applyRequest(existing, request);

        Fuel savedFuel = fuelRepository.save(existing);
        updateVehicleMileageIfNeeded(vehicle, savedFuel.getMileage());

        return toResponse(savedFuel);
    }

    public void delete(Long vehicleId, Long fuelId) {
        Long userId = authService.getCurrentUser().getId();
        Fuel fuel = findOwnedFuel(vehicleId, fuelId, userId);
        fuelRepository.delete(fuel);
    }

    private void ensureVehicleOwnedByCurrentUser(Long vehicleId, Long userId) {
        vehicleRepository.findByIdAndUserId(vehicleId, userId)
                .orElseThrow(VehicleNotFoundException::new);
    }

    private Fuel findOwnedFuel(Long vehicleId, Long fuelId, Long userId) {
        ensureVehicleOwnedByCurrentUser(vehicleId, userId);
        return fuelRepository.findByIdAndVehicleIdAndVehicleUserId(fuelId, vehicleId, userId)
                .orElseThrow(FuelNotFoundException::new);
    }

    private void applyRequest(Fuel fuel, FuelRequest request) {
        Currency currency = Currency.fromDisplayName(request.currency())
                .orElseThrow(() -> new InvalidCurrencyException(
                        request.currency(),
                        Currency.allowedValues()));

        fuel.setDate(request.date());
        fuel.setMileage(request.mileage());
        fuel.setCost(request.cost());
        fuel.setAmount(request.amount());
        fuel.setGasStation(request.gasStation());
        fuel.setCurrency(currency);
    }

    private FuelResponse toResponse(Fuel fuel) {
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
                fuel.getUpdatedAt());
    }

    private void updateVehicleMileageIfNeeded(Vehicle vehicle, Integer fuelMileage) {
        if (fuelMileage != null && (vehicle.getMileage() == null || fuelMileage > vehicle.getMileage())) {
            vehicle.setMileage(fuelMileage.doubleValue());
            vehicleRepository.save(vehicle);
        }
    }
}
