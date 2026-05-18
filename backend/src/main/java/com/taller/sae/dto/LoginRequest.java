package com.taller.sae.dto;

import jakarta.validation.constraints.NotBlank;

// "record" es una clase inmutable de Java 16+.
// Equivale a una clase con constructor, getters, equals y hashCode automáticos.
// Ideal para DTOs que solo transportan datos (sin lógica).
public record LoginRequest(
        @NotBlank(message = "El usuario es obligatorio")
        String username,

        @NotBlank(message = "La contraseña es obligatoria")
        String password
) {}
