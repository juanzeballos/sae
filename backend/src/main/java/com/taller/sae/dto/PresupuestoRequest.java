package com.taller.sae.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record PresupuestoRequest(
        @NotBlank(message = "El nombre del cliente es obligatorio")
        String clienteNombre,

        String fecha,

        @NotEmpty(message = "Debe incluir al menos un ítem")
        @Valid
        List<PresupuestoDetalleRequest> detalles
) {}
