package com.taller.sae.dto;

import com.taller.sae.entity.Gasto;

public record GastoResponse(
        Long id,
        String fecha,
        String descripcion,
        Double monto,
        String categoria
) {
    public static GastoResponse from(Gasto g) {
        return new GastoResponse(g.getId(), g.getFecha(), g.getDescripcion(), g.getMonto(), g.getCategoria().name());
    }
}
