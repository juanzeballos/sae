package com.taller.sae.dto;

import com.taller.sae.entity.Producto;
import com.taller.sae.entity.Stock;

public record ProductoResponse(
        Long id,
        String codigo,
        String nombre,
        String descripcion,
        String marca,
        Double precioCostoNeto,
        Double precioVentaNeto,
        Integer alicuotaIva,
        Double precioVenta,
        boolean activo,
        Double stockActual,
        Double stockMinimo
) {
    // Factory method: construye el response a partir de las dos entidades
    public static ProductoResponse from(Producto p, Stock s) {
        return new ProductoResponse(
                p.getId(),
                p.getCodigo(),
                p.getNombre(),
                p.getDescripcion(),
                p.getMarca(),
                p.getPrecioCostoNeto(),
                p.getPrecioVentaNeto(),
                p.getAlicuotaIva(),
                p.getPrecioVenta(),
                p.isActivo(),
                s != null ? s.getCantidadActual() : 0.0,
                s != null ? s.getStockMinimo() : 0.0
        );
    }
}
