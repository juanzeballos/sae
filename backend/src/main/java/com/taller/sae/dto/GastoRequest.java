package com.taller.sae.dto;

import com.taller.sae.entity.CategoriaGasto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record GastoRequest(
        @NotBlank String fecha,
        @NotBlank String descripcion,
        @NotNull @Positive Double monto,
        @NotNull CategoriaGasto categoria
) {}
