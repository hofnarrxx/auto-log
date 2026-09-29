package com.hofnarrxx.autolog.config;

import com.hofnarrxx.autolog.ratelimit.RateLimitFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {
        private final AppProperties appProperties;
        private final JwtAuthenticationFilter jwtFilter;
        private final RateLimitFilter rateLimitFilter;
        private final OAuth2JwtSuccessHandler oauth2JwtSuccessHandler;

        public SecurityConfig(AppProperties appProperties, JwtAuthenticationFilter jwtFilter,
                        RateLimitFilter rateLimitFilter,
                        OAuth2JwtSuccessHandler oauth2JwtSuccessHandler) {
                this.appProperties = appProperties;
                this.jwtFilter = jwtFilter;
                this.rateLimitFilter = rateLimitFilter;
                this.oauth2JwtSuccessHandler = oauth2JwtSuccessHandler;
        }

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

                http.csrf(csrf -> csrf.disable())
                                .cors(cors -> {
                                })
                                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                                                .requestMatchers("/api/auth/**", "/oauth2/**", "/share/**").permitAll()
                                                .requestMatchers(HttpMethod.GET, "/vehicles/**", "/metadata/**")
                                                .hasAnyRole("USER", "DEMO")
                                                .anyRequest().hasRole("USER"))
                                .exceptionHandling(ex -> ex
                                                .accessDeniedHandler((request, response, accessException) -> {
                                                        response.setStatus(HttpStatus.FORBIDDEN.value());
                                                        response.setContentType("application/json");
                                                        response.getWriter().write("{\"error\":\"DEMO_READ_ONLY\"}");
                                                })
                                                .authenticationEntryPoint((request, response, authException) -> {
                                                        response.setStatus(HttpStatus.UNAUTHORIZED.value());
                                                }))
                                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                                .addFilterBefore(rateLimitFilter, JwtAuthenticationFilter.class)
                                .oauth2Login(oauth -> oauth.successHandler(oauth2JwtSuccessHandler));

                return http.build();
        }

        @Bean
        public AuthenticationManager authenticationManager(
                        AuthenticationConfiguration config) throws Exception {
                return config.getAuthenticationManager();
        }

        @Bean
        CorsConfigurationSource corsConfigurationSource() {

                CorsConfiguration config = new CorsConfiguration();

                config.setAllowedOrigins(List.of(appProperties.frontendUrl()));
                config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                config.setAllowedHeaders(List.of("*"));
                config.setAllowCredentials(true);
                config.setExposedHeaders(List.of("Retry-After"));

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

                source.registerCorsConfiguration("/**", config);

                return source;
        }
}
