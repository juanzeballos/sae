package com.taller.sae.dto;

import jakarta.validation.constraints.NotBlank;

public record ClienteRequest(
    @NotBlank(message = "El nombre es obligatorio") String nombre,
    String telefono,
    String email,
    String direccion
) {}
