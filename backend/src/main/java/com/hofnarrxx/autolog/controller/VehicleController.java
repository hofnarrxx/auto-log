package com.hofnarrxx.autolog.controller;

import com.hofnarrxx.autolog.model.Vehicle;
import com.hofnarrxx.autolog.service.VehicleService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/vehicles")
public class VehicleController {
    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService){
        this.vehicleService = vehicleService;
    }

    @GetMapping
    public List<Vehicle> getAll() {
        return vehicleService.getAll();
    }

    @PostMapping
    public Vehicle create(@RequestBody Vehicle vehicle) {
        return vehicleService.create(vehicle);
    }

    @DeleteMapping
    public void delete(@PathVariable Long id){
         vehicleService.delete(id);
    }

    @PutMapping("/{id}")
    public Vehicle update(@PathVariable Long id, @RequestBody Vehicle vehicle) {
        return vehicleService.update(id, vehicle);
    }
}
