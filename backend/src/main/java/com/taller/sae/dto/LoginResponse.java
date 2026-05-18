package com.taller.sae.dto;

// Lo que el servidor devuelve al hacer login exitoso.
// React guarda el "token" en localStorage y lo envía en cada request.
public record LoginResponse(
        String token,
        String username
) {}
