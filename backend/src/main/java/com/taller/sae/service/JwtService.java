package com.taller.sae.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.expiration-ms}")
    private long expirationMs;

    // ─── Generar token ───────────────────────────────────────────────────────

    public String generateToken(String username) {
        return Jwts.builder()
                .subject(username)                                          // quién es el usuario
                .issuedAt(new Date())                                       // cuándo se generó
                .expiration(new Date(System.currentTimeMillis() + expirationMs)) // cuándo vence
                .signWith(getSignKey())                                     // firma con la clave secreta
                .compact();                                                 // serializa a String
    }

    // ─── Validar token ───────────────────────────────────────────────────────

    // Retorna true si el token:
    //   1. Pertenece al mismo usuario que userDetails
    //   2. No está vencido
    //   3. La firma es válida (si no lo fuera, extractAllClaims lanzaría excepción)
    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            String username = extractUsername(token);
            return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
        } catch (JwtException e) {
            // Token malformado, firma inválida, etc.
            return false;
        }
    }

    // ─── Extraer datos del token ─────────────────────────────────────────────

    public String extractUsername(String token) {
        // "subject" es el campo donde guardamos el username al generar el token
        return extractClaim(token, Claims::getSubject);
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    // Método genérico: extrae cualquier claim usando una función
    // Claims::getSubject, Claims::getExpiration, etc.
    private <T> T extractClaim(String token, Function<Claims, T> claimResolver) {
        Claims claims = extractAllClaims(token);
        return claimResolver.apply(claims);
    }

    // Parsea y verifica la firma del token. Lanza JwtException si es inválido.
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSignKey())   // usa la misma clave para verificar la firma
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // ─── Clave de firma ──────────────────────────────────────────────────────

    // Convierte el String de application.properties en una SecretKey criptográfica.
    // HMAC-SHA256 requiere mínimo 32 bytes (256 bits).
    private SecretKey getSignKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }
}
