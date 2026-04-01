package com.hofnarrxx.autolog.controller;

import com.hofnarrxx.autolog.model.Currency;
import com.hofnarrxx.autolog.model.MaintenanceCategory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/metadata")
public class MetadataController {
    @GetMapping("/maintenance/categories")
    public List<String> getMaintenanceCategories() {
        return MaintenanceCategory.allowedValues();
    }

    @GetMapping("/currencies")
    public List<String> getCurrencies() {
        return Currency.allowedValues();
    }
}

