package com.hofnarrxx.autolog.dto;

import java.math.BigDecimal;
import java.util.Map;
import java.util.List;
import java.util.UUID;

public record FuelSummaryResponse(
    Long totalRecords,
    Map<String, BigDecimal> totalCostByCurrency,
    LatestOdometerResponse latestOdometerRecord,
    List<UUID> mileageWarningRecordIds,
    Double averageConsumptionPer100km
) {

}
