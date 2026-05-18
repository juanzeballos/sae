package com.taller.sae.dto;

import com.taller.sae.entity.Presupuesto;
import com.taller.sae.entity.PresupuestoDetalle;

import java.util.List;

public record PresupuestoResponse(
        Long id,
        String numero,
        String clienteNombre,
        String fecha,
        String estado,
        Long ventaId,
        List<PresupuestoDetalleResponse> detalles,
        Double subtotalNeto,
        Double totalIva,
        Double total
) {
    public static PresupuestoResponse from(Presupuesto p, List<PresupuestoDetalle> detalles) {
        return new PresupuestoResponse(
                p.getId(),
                p.getNumero(),
                p.getClienteNombre(),
                p.getFecha(),
                p.getEstado(),
                p.getVentaId(),
                detalles.stream().map(PresupuestoDetalleResponse::from).toList(),
                p.getSubtotalNeto(),
                p.getTotalIva(),
                p.getTotal()
        );
    }
}
