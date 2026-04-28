package com.hofnarrxx.autolog.controller;

import com.hofnarrxx.autolog.dto.PublicVehicleAccessResponse;
import com.hofnarrxx.autolog.service.PublicVehicleAccessService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PublicVehicleAccessController {

    private final PublicVehicleAccessService publicVehicleAccessService;

    public PublicVehicleAccessController(PublicVehicleAccessService publicVehicleAccessService) {
        this.publicVehicleAccessService = publicVehicleAccessService;
    }

    @GetMapping("/share/{token}")
    public PublicVehicleAccessResponse getByToken(@PathVariable String token) {
        return publicVehicleAccessService.getByToken(token);
    }
}

