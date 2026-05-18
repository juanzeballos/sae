package com.taller.sae.config;

import com.taller.sae.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

// OncePerRequestFilter: garantiza que este filtro se ejecuta UNA sola vez por request.
// Es similar a un javax.servlet.Filter, pero Spring lo gestiona automáticamente.
//
// Flujo por request:
//   1. Leer el header "Authorization"
//   2. Extraer el token (viene como "Bearer <token>")
//   3. Validar el token con JwtService
//   4. Si es válido, cargar el usuario en el SecurityContext
//   5. Continuar con el resto de la cadena de filtros
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        // Si no hay header o no empieza con "Bearer ", dejamos pasar sin autenticar.
        // El endpoint /auth/login no requiere token, por eso llegará hasta el controller.
        // Los endpoints protegidos serán rechazados más adelante por Spring Security.
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Extraemos el token: "Bearer eyJhbGci..." → "eyJhbGci..."
        String token = authHeader.substring(7);

        String username = jwtService.extractUsername(token);

        // Solo procesamos si hay username Y todavía no hay una autenticación en el contexto
        // (evitamos re-autenticar en el mismo request)
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if (jwtService.isTokenValid(token, userDetails)) {
                // Creamos el objeto de autenticación y lo ponemos en el SecurityContext.
                // A partir de acá, Spring Security sabe quién es el usuario en este request.
                var authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,                           // credentials = null (ya está autenticado)
                        userDetails.getAuthorities()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }
}
