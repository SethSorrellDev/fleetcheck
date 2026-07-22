package com.fleetcheck.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationEntryPoint authenticationEntryPoint() {
        return (request, response, authException) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"status\":401,\"error\":\"Unauthorized\",\"message\":\"Authentication required.\"}");
        };
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/h2-console/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()

                // Account administration: ADMIN only, every method including reads.
                .requestMatchers("/api/accounts/**").hasRole("ADMIN")

                // Reports log: drivers file reports but don't browse the history.
                .requestMatchers(HttpMethod.GET, "/api/inspection-reports/**").hasAnyRole("MECHANIC", "FLEET_MANAGER", "ADMIN")

                .requestMatchers(HttpMethod.POST, "/api/inspection-reports/*/complete-repair").hasRole("MECHANIC")
                .requestMatchers(HttpMethod.POST, "/api/inspection-reports/*/review").hasRole("DRIVER")
                .requestMatchers(HttpMethod.POST, "/api/inspection-reports").hasRole("DRIVER")
                .requestMatchers(HttpMethod.PUT, "/api/inspection-reports/**").hasRole("FLEET_MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/api/inspection-reports/**").hasAnyRole("FLEET_MANAGER", "ADMIN")

                .requestMatchers(HttpMethod.POST, "/api/repair-orders").hasRole("MECHANIC")
                .requestMatchers(HttpMethod.PUT, "/api/repair-orders/**").hasRole("MECHANIC")
                .requestMatchers(HttpMethod.DELETE, "/api/repair-orders/**").hasRole("FLEET_MANAGER")

                .requestMatchers(HttpMethod.POST, "/api/damage-markings").hasRole("DRIVER")
                .requestMatchers(HttpMethod.PUT, "/api/damage-markings/**").hasRole("DRIVER")
                .requestMatchers(HttpMethod.DELETE, "/api/damage-markings/**").hasRole("FLEET_MANAGER")

                .requestMatchers(HttpMethod.POST, "/api/vehicles").hasRole("FLEET_MANAGER")
                .requestMatchers(HttpMethod.PUT, "/api/vehicles/**").hasRole("FLEET_MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/api/vehicles/**").hasRole("FLEET_MANAGER")

                .requestMatchers(HttpMethod.POST, "/api/drivers").hasRole("FLEET_MANAGER")
                .requestMatchers(HttpMethod.PUT, "/api/drivers/**").hasRole("FLEET_MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/api/drivers/**").hasRole("FLEET_MANAGER")

                .requestMatchers(HttpMethod.GET, "/api/**").authenticated()
                .anyRequest().authenticated()
            )
            .httpBasic(basic -> basic.authenticationEntryPoint(authenticationEntryPoint()));

        return http.build();
    }
}
