package com.hofnarrxx.autolog.dto;

import java.math.BigDecimal;
import java.util.Map;
import java.util.List;

public record FuelSummaryResponse(
    Long totalRecords,
    Map<String, BigDecimal> totalCostByCurrency,
    LatestOdometerResponse latestOdometerRecord,
    List<Long> mileageWarningRecordIds,
    Double averageConsumptionPer100km
) {

}
