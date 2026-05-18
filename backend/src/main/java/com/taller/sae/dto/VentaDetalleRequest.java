package com.taller.sae.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public record VentaDetalleRequest(
        // Null cuando tipoItem = "SERVICIO" (servicio manual, sin producto del catálogo)
        Long productoId,

        @NotBlank(message = "El tipo de ítem es obligatorio")
        String tipoItem,

        @NotBlank(message = "La descripción es obligatoria")
        String descripcionItem,

        @NotNull(message = "La cantidad es obligatoria")
        @Positive(message = "La cantidad debe ser mayor a cero")
        Double cantidad,

        @NotNull(message = "El precio unitario neto es obligatorio")
        @PositiveOrZero
        Double precioUnitarioNeto,

        @NotNull(message = "La alícuota de IVA es obligatoria")
        @Min(value = 0, message = "La alícuota de IVA no puede ser negativa")
        Integer alicuotaIva
) {}
