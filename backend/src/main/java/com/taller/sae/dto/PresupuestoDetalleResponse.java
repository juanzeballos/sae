package com.taller.sae.dto;

import com.taller.sae.entity.PresupuestoDetalle;

public record PresupuestoDetalleResponse(
        Long id,
        Long productoId,
        String tipoItem,
        String descripcionItem,
        Double cantidad,
        Double precioUnitarioNeto,
        Integer alicuotaIva,
        Double precioUnitario,
        Double subtotalNeto,
        Double subtotal
) {
    public static PresupuestoDetalleResponse from(PresupuestoDetalle d) {
        return new PresupuestoDetalleResponse(
                d.getId(),
                d.getProductoId(),
                d.getTipoItem(),
                d.getDescripcionItem(),
                d.getCantidad(),
                d.getPrecioUnitarioNeto(),
                d.getAlicuotaIva(),
                d.getPrecioUnitario(),
                d.getSubtotalNeto(),
                d.getSubtotal()
        );
    }
}
