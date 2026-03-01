package com.hofnarrxx.autolog.service;

import com.hofnarrxx.autolog.model.Vehicle;
import com.hofnarrxx.autolog.repository.VehicleRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VehicleService {
    private final VehicleRepository repository;
    private final AuthService authService;

    public VehicleService(VehicleRepository repository,
                          AuthService authService){
        this.authService = authService;
        this.repository = repository;
    }

    public List<Vehicle> getAll() {
        return repository.findByUserId(authService.getCurrentUser().getId());
    }

    public Vehicle create(Vehicle vehicle) {
        vehicle.setUser(authService.getCurrentUser());
        return repository.save(vehicle);
    }
}
