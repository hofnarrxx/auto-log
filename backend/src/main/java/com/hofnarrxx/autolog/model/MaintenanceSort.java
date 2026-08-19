package com.hofnarrxx.autolog.model;

import java.util.Arrays;

import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Order;

public enum MaintenanceSort {
    NEWEST,
    OLDEST,
    PRICE_LOW_HIGH,
    PRICE_HIGH_LOW;
    public static MaintenanceSort fromParam(String value) {
        if (value == null) {
            return NEWEST;
        }
        String normalized = value.replace('-', '_').trim();
        return Arrays.stream(values())
                .filter(sort -> sort.name().equalsIgnoreCase(normalized))
                .findFirst()
                .orElse(NEWEST);
    }

    public Sort toSort() {
        switch (this) {
            case NEWEST:
                return Sort.by(Sort.Direction.DESC, "serviceDate").and(Sort.by(Sort.Direction.DESC, "id"));
            case OLDEST:
                return Sort.by(Sort.Direction.ASC, "serviceDate").and(Sort.by(Sort.Direction.ASC, "id"));
            case PRICE_LOW_HIGH:
                Order ascCostOrder = Sort.Order.asc("cost").with(Sort.NullHandling.NULLS_LAST);
                return Sort.by(ascCostOrder).and(Sort.by(Sort.Direction.ASC, "id"));
            case PRICE_HIGH_LOW:
                Order descCostOrder = Sort.Order.desc("cost").with(Sort.NullHandling.NULLS_LAST);
                return Sort.by(descCostOrder).and(Sort.by(Sort.Direction.DESC, "id"));
            default:
                return Sort.by(Sort.Direction.DESC, "serviceDate").and(Sort.by(Sort.Direction.DESC, "id"));
        }
    }
}
