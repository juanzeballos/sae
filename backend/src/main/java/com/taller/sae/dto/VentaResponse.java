package com.taller.sae.dto;

import com.taller.sae.entity.Venta;
import com.taller.sae.entity.VentaDetalle;

import java.util.List;

public record VentaResponse(
        Long id,
        String numero,
        String clienteNombre,
        Long presupuestoId,
        String fecha,
        String estado,
        String formaPago,
        List<VentaDetalleResponse> detalles,
        Double subtotalNeto,
        Double totalIva,
        Double total
) {
    public static VentaResponse from(Venta v, List<VentaDetalle> detalles) {
        return new VentaResponse(
                v.getId(),
                v.getNumero(),
                v.getClienteNombre(),
                v.getPresupuestoId(),
                v.getFecha(),
                v.getEstado(),
                v.getFormaPago(),
                detalles.stream().map(VentaDetalleResponse::from).toList(),
                v.getSubtotalNeto(),
                v.getTotalIva(),
                v.getTotal()
        );
    }
}
