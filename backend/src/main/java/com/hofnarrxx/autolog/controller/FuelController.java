package com.hofnarrxx.autolog.controller;

import com.hofnarrxx.autolog.dto.FuelRequest;
import com.hofnarrxx.autolog.dto.FuelResponse;
import com.hofnarrxx.autolog.dto.FuelSummaryResponse;
import com.hofnarrxx.autolog.service.FuelService;
import org.springframework.web.bind.annotation.*;

import com.hofnarrxx.autolog.dto.PageResponse;

@RestController
@RequestMapping("/vehicles/{vehicleId}/fuel")
public class FuelController {
    private final FuelService fuelService;

    public FuelController(FuelService fuelService) {
        this.fuelService = fuelService;
    }

    @GetMapping
    public PageResponse<FuelResponse> getPage(@PathVariable Long vehicleId,
    @RequestParam(required = false) Integer page,
    @RequestParam(required = false) Integer size,
    @RequestParam(required = false) String sort,
    @RequestParam(required = false) String gasStation) {
        return fuelService.getPage(vehicleId, page, size, sort, gasStation);
    }

    @GetMapping("/summary")
    public FuelSummaryResponse getSummary(@PathVariable Long vehicleId) {
        return fuelService.getSummary(vehicleId);
    }

    @GetMapping("/{fuelId}")
    public FuelResponse getById(@PathVariable Long vehicleId,
                                @PathVariable Long fuelId) {
        return fuelService.getById(vehicleId, fuelId);
    }

    @PostMapping
    public FuelResponse create(@PathVariable Long vehicleId,
                               @RequestBody FuelRequest request) {
        return fuelService.create(vehicleId, request);
    }

    @PutMapping("/{fuelId}")
    public FuelResponse update(@PathVariable Long vehicleId,
                               @PathVariable Long fuelId,
                               @RequestBody FuelRequest request) {
        return fuelService.update(vehicleId, fuelId, request);
    }

    @DeleteMapping("/{fuelId}")
    public void delete(@PathVariable Long vehicleId,
                       @PathVariable Long fuelId) {
        fuelService.delete(vehicleId, fuelId);
    }
}

