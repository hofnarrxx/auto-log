package com.hofnarrxx.autolog.dto;

public record PageRequestParams(int page, int size) {
    public static PageRequestParams of(Integer page, Integer size) {
        if (page == null || page < 0) {
            page = 0;
        }
        if (size == null) {
            size = 20;
        }
        size = Math.clamp(size, 1, 100);
        return new PageRequestParams(page, size);
    }
}
