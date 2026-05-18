package com.taller.sae.dto;

import com.taller.sae.entity.VentaDetalle;

// precioCostoUnitario se omite intencionalmente: es un campo interno para reportes de margen,
// no necesario en la respuesta de la API en Fase 2.
public record VentaDetalleResponse(
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
    public static VentaDetalleResponse from(VentaDetalle d) {
        return new VentaDetalleResponse(
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
