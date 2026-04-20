package com.hofnarrxx.autolog.controller;

import com.hofnarrxx.autolog.dto.PublicCarResponse;
import com.hofnarrxx.autolog.service.PublicCarService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PublicCarController {

    private final PublicCarService publicCarService;

    public PublicCarController(PublicCarService publicCarService) {
        this.publicCarService = publicCarService;
    }

    @GetMapping("/api/public/cars/{token}")
    public PublicCarResponse getByToken(@PathVariable String token) {
        return publicCarService.getByToken(token);
    }
}

