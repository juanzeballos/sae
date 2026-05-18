package com.taller.sae.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public record ProductoRequest(

        String codigo,

        @NotBlank(message = "El nombre es obligatorio")
        String nombre,

        String descripcion,
        String marca,

        @PositiveOrZero(message = "El precio de costo no puede ser negativo")
        Double precioCostoNeto,

        @NotNull(message = "El precio de venta neto es obligatorio")
        @Positive(message = "El precio de venta neto debe ser mayor a cero")
        Double precioVentaNeto,

        // Si no se envía, el service usa 21 por defecto
        Integer alicuotaIva,

        @NotNull(message = "El precio de venta es obligatorio")
        @Positive(message = "El precio de venta debe ser mayor a cero")
        Double precioVenta,

        // Solo se usa al crear el producto. En edición se ignora.
        @PositiveOrZero(message = "El stock inicial no puede ser negativo")
        Double stockInicial,

        @PositiveOrZero(message = "El stock mínimo no puede ser negativo")
        Double stockMinimo
) {}
