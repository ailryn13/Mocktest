package com.mocktest.config;

import com.mocktest.security.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Central Spring Security configuration.
 *
 * <ul>
 *   <li>Stateless sessions (JWT-based).</li>
 *   <li>Public endpoints: {@code /api/auth/**}.</li>
 *   <li>Admin-only: {@code /api/admin/**}.</li>
 *   <li>Mediator endpoints: {@code /api/mediator/**}.</li>
 *   <li>Student endpoints: {@code /api/student/**}.</li>
 *   <li>Everything else requires authentication.</li>
 * </ul>
 */
@Configuration
@EnableMethodSecurity          // enables @PreAuthorize on methods
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;
    private final List<String> allowedOriginPatterns;

    public SecurityConfig(
            JwtAuthenticationFilter jwtFilter,
            @Value("${app.cors.allowed-origin-patterns:http://localhost:3000,http://*:3000,https://*:3000}")
            String allowedOriginPatterns
    ) {
        this.jwtFilter = jwtFilter;
        this.allowedOriginPatterns = Arrays.stream(allowedOriginPatterns.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())                          // stateless → no CSRF
            .sessionManagement(sm ->
                sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Let CORS pre-flight requests pass through without auth
                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/auth/**").permitAll()        // login / password-reset
                .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                .requestMatchers("/api/mediator/**").hasAnyRole("MEDIATOR", "SUPER_ADMIN")
                .requestMatchers("/api/student/**").hasAnyRole("STUDENT", "SUPER_ADMIN")
                .anyRequest().authenticated()
            )
            // Return 401 (not 403) when the JWT is missing or expired
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(unauthorizedEntryPoint())
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Returns HTTP 401 with a JSON body when a request arrives with no valid JWT.
     * Without this, Spring Security's default Http403ForbiddenEntryPoint fires and
     * swallows the real cause (expired / missing token), making it look like an
     * authorisation error rather than an authentication error.
     */
    @Bean
    public AuthenticationEntryPoint unauthorizedEntryPoint() {
        return (request, response, authException) -> {
            response.setContentType("application/json");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write(
                "{\"status\":401,\"message\":\"Unauthorized: your session has expired. Please log in again.\"}");
        };
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(allowedOriginPatterns);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
