package com.hofnarrxx.autolog.controller;

import com.hofnarrxx.autolog.dto.ShareLinkCreateRequest;
import com.hofnarrxx.autolog.dto.ShareLinkResponse;
import com.hofnarrxx.autolog.model.ShareLink;
import com.hofnarrxx.autolog.service.ShareLinkService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/share-links")
public class ShareLinkController {

    private final ShareLinkService shareLinkService;

    public ShareLinkController(ShareLinkService shareLinkService) {
        this.shareLinkService = shareLinkService;
    }

    @PostMapping
    public ShareLinkResponse create(@RequestBody ShareLinkCreateRequest request) {
        ShareLink created = shareLinkService.create(request.carId(), request.expiresAt());
        return toResponse(created);
    }

    @GetMapping
    public List<ShareLinkResponse> list(@RequestParam Long carId) {
        return shareLinkService.getForCar(carId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @DeleteMapping("/{id}")
    public void revoke(@PathVariable Long id) {
        shareLinkService.revoke(id);
    }

    private ShareLinkResponse toResponse(ShareLink shareLink) {
        return new ShareLinkResponse(
                shareLink.getId(),
                shareLink.getToken(),
                shareLink.getCarId(),
                shareLink.getCreatedBy(),
                shareLink.getCreatedAt(),
                shareLink.getExpiresAt(),
                shareLink.isRevoked()
        );
    }
}

