package com.hofnarrxx.autolog.controller;

import com.hofnarrxx.autolog.dto.VehicleImageDownloadUrlResponse;
import com.hofnarrxx.autolog.dto.VehicleImageUploadUrlRequest;
import com.hofnarrxx.autolog.dto.VehicleImageUploadUrlResponse;
import com.hofnarrxx.autolog.dto.VehicleRequest;
import com.hofnarrxx.autolog.dto.VehicleResponse;
import com.hofnarrxx.autolog.service.VehicleImageService;
import com.hofnarrxx.autolog.service.VehicleService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/vehicles")
public class VehicleController {
    private final VehicleService vehicleService;
    private final VehicleImageService vehicleImageService;

    public VehicleController(VehicleService vehicleService,
                             VehicleImageService vehicleImageService) {
        this.vehicleService = vehicleService;
        this.vehicleImageService = vehicleImageService;
    }

    @GetMapping
    public List<VehicleResponse> getAll() {
        return vehicleService.getAll();
    }

    @PostMapping
    public VehicleResponse create(@RequestBody VehicleRequest request) {
        return vehicleService.create(request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id){
         vehicleService.delete(id);
    }

    @PutMapping("/{id}")
    public VehicleResponse update(@PathVariable Long id, @RequestBody VehicleRequest request) {
        return vehicleService.update(id, request);
    }

    @PostMapping("/{id}/image/upload-url")
    public VehicleImageUploadUrlResponse createImageUploadUrl(@PathVariable Long id,
                                                              @RequestBody VehicleImageUploadUrlRequest request) {
        return vehicleImageService.createUploadUrl(id, request);
    }

    @GetMapping("/{id}/image/download-url")
    public VehicleImageDownloadUrlResponse createImageDownloadUrl(@PathVariable Long id) {
        return vehicleImageService.createDownloadUrl(id);
    }
}
