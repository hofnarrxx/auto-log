package com.hofnarrxx.autolog.model;

import java.util.Arrays;

import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Order;
import org.springframework.data.jpa.domain.JpaSort;

public enum FuelSort {
    NEWEST,
    OLDEST,
    PRICE_LOW_HIGH,
    PRICE_HIGH_LOW,
    PRICE_PER_UNIT_LOW_HIGH,
    PRICE_PER_UNIT_HIGH_LOW;

    public static FuelSort fromParam(String value) {
        if (value == null) {
            return NEWEST;
        }
        String normalized = value.replace('-', '_').trim();
        return Arrays.stream(values())
                .filter(sort -> sort.name().equalsIgnoreCase(normalized))
                .findFirst()
                .orElse(NEWEST);
    }

    private static final String pricePerUnitFlag = "case when f.amount is null or f.amount = 0 or f.cost is null then 1 else 0 end";
    private static final String pricePerUnitExpression = "case when f.amount is null or f.amount = 0 then null else f.cost / f.amount end";

    public Sort toSort() {
        switch (this) {
            case NEWEST:
                return Sort.by(Sort.Direction.DESC, "date").and(Sort.by(Sort.Direction.DESC, "id"));
            case OLDEST:
                return Sort.by(Sort.Direction.ASC, "date").and(Sort.by(Sort.Direction.ASC, "id"));
            case PRICE_LOW_HIGH:
                Order ascCostOrder = Sort.Order.asc("cost").with(Sort.NullHandling.NULLS_LAST);
                return Sort.by(ascCostOrder).and(Sort.by(Sort.Direction.ASC, "id"));
            case PRICE_HIGH_LOW:
                Order descCostOrder = Sort.Order.desc("cost").with(Sort.NullHandling.NULLS_LAST);
                return Sort.by(descCostOrder).and(Sort.by(Sort.Direction.DESC, "id"));
            case PRICE_PER_UNIT_LOW_HIGH:
                return JpaSort.unsafe(Sort.Direction.ASC, pricePerUnitFlag).andUnsafe(Sort.Direction.ASC,
                        pricePerUnitExpression).and(Sort.by(Sort.Direction.ASC, "id"));
            case PRICE_PER_UNIT_HIGH_LOW:
                return JpaSort.unsafe(Sort.Direction.ASC, pricePerUnitFlag).andUnsafe(Sort.Direction.DESC,
                        pricePerUnitExpression).and(Sort.by(Sort.Direction.DESC, "id"));
            default:
                return Sort.by(Sort.Direction.DESC, "date").and(Sort.by(Sort.Direction.DESC, "id"));
        }
    }
}
