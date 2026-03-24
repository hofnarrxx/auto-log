package com.hofnarrxx.autolog.controller;

import com.hofnarrxx.autolog.model.MaintenanceCategory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/maintenance")
public class MaintenanceDataController {
    @GetMapping("/categories")
    public List<String> getCategories() {
        return MaintenanceCategory.allowedValues();
    }
}

