package com.hofnarrxx.autolog.ratelimit;

import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;

@Component 
public class ClientIpResolver {
    public String resolveIp(HttpServletRequest request){
        return request.getRemoteAddr();
    }
}
