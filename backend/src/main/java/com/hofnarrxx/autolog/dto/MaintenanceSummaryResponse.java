package com.hofnarrxx.autolog.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import jakarta.annotation.Nullable;

public record MaintenanceSummaryResponse(
        long totalRecords,
        Map<String, BigDecimal> totalCostByCurrency,
        @Nullable LatestOdometerResponse latestOdometer,
        List<UUID> mileageWarningRecordIds,
        BigDecimal maxCost) {
}
