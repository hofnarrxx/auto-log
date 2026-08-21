package com.hofnarrxx.autolog.dto;

import java.time.LocalDate;

public record LatestOdometerResponse(
        int mileage,
        LocalDate date) {

}
