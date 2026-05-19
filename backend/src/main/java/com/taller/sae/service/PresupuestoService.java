package com.taller.sae.service;

import com.taller.sae.dto.*;
import com.taller.sae.entity.Presupuesto;
import com.taller.sae.entity.PresupuestoDetalle;
import com.taller.sae.repository.PresupuestoDetalleRepository;
import com.taller.sae.repository.PresupuestoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PresupuestoService {

    private final PresupuestoRepository presupuestoRepository;
    private final PresupuestoDetalleRepository presupuestoDetalleRepository;
    private final VentaService ventaService;

    // ─── Listar ─────────────────────────────────────────────────────────────

    public List<PresupuestoResponse> listar() {
        return presupuestoRepository.findAllByOrderByNumeroDesc().stream()
                .map(p -> {
                    List<PresupuestoDetalle> detalles = presupuestoDetalleRepository.findByPresupuestoId(p.getId());
                    return PresupuestoResponse.from(p, detalles);
                })
                .toList();
    }

    // ─── Obtener ─────────────────────────────────────────────────────────────

    public PresupuestoResponse obtener(Long id) {
        Presupuesto presupuesto = buscarOLanzar(id);
        List<PresupuestoDetalle> detalles = presupuestoDetalleRepository.findByPresupuestoId(id);
        return PresupuestoResponse.from(presupuesto, detalles);
    }

    // ─── Crear ──────────────────────────────────────────────────────────────

    @Transactional
    public PresupuestoResponse crear(PresupuestoRequest request) {
        Integer maxNumero = presupuestoRepository.findMaxNumero();
        int nextNumero = (maxNumero == null ? 0 : maxNumero) + 1;

        Presupuesto presupuesto = new Presupuesto();
        presupuesto.setNumero(String.valueOf(nextNumero));
        presupuesto.setClienteNombre(request.clienteNombre());
        presupuesto.setFecha(request.fecha() != null ? request.fecha() : LocalDate.now().toString());
        presupuesto.setEstado("BORRADOR");

        calcularTotales(presupuesto, request.detalles());
        presupuestoRepository.save(presupuesto);

        List<PresupuestoDetalle> detalles = crearDetalles(presupuesto, request.detalles());
        return PresupuestoResponse.from(presupuesto, detalles);
    }

    // ─── Editar ──────────────────────────────────────────────────────────────

    @Transactional
    public PresupuestoResponse editar(Long id, PresupuestoRequest request) {
        Presupuesto presupuesto = buscarOLanzar(id);

        if (!"BORRADOR".equals(presupuesto.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Solo se puede editar un presupuesto en estado BORRADOR");
        }

        presupuesto.setClienteNombre(request.clienteNombre());
        if (request.fecha() != null) {
            presupuesto.setFecha(request.fecha());
        }

        presupuestoDetalleRepository.deleteByPresupuestoId(id);
        calcularTotales(presupuesto, request.detalles());
        presupuestoRepository.save(presupuesto);

        List<PresupuestoDetalle> detalles = crearDetalles(presupuesto, request.detalles());
        return PresupuestoResponse.from(presupuesto, detalles);
    }

    // ─── Eliminar ────────────────────────────────────────────────────────────

    @Transactional
    public void eliminar(Long id) {
        Presupuesto presupuesto = buscarOLanzar(id);

        if (!"BORRADOR".equals(presupuesto.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Solo se puede eliminar un presupuesto en estado BORRADOR");
        }

        presupuestoDetalleRepository.deleteByPresupuestoId(id);
        presupuestoRepository.delete(presupuesto);
    }

    // ─── Confirmar ───────────────────────────────────────────────────────────

    @Transactional
    public PresupuestoResponse confirmar(Long id) {
        Presupuesto presupuesto = buscarOLanzar(id);

        if (!"BORRADOR".equals(presupuesto.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Solo se puede confirmar un presupuesto en estado BORRADOR");
        }

        presupuesto.setEstado("CONFIRMADO");
        presupuestoRepository.save(presupuesto);

        List<PresupuestoDetalle> detalles = presupuestoDetalleRepository.findByPresupuestoId(id);
        return PresupuestoResponse.from(presupuesto, detalles);
    }

    // ─── Convertir a venta ───────────────────────────────────────────────────

    @Transactional
    public VentaResponse convertir(Long id, VentaRequest ventaRequestBody) {
        Presupuesto presupuesto = buscarOLanzar(id);

        if (!"CONFIRMADO".equals(presupuesto.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Solo se puede convertir un presupuesto CONFIRMADO");
        }

        VentaRequest ventaRequest;
        if (ventaRequestBody != null) {
            ventaRequest = ventaRequestBody;
        } else {
            List<PresupuestoDetalle> detalles = presupuestoDetalleRepository.findByPresupuestoId(id);
            List<VentaDetalleRequest> detalleRequests = detalles.stream()
                    .map(d -> new VentaDetalleRequest(
                            d.getProductoId(),
                            d.getTipoItem(),
                            d.getDescripcionItem(),
                            d.getCantidad(),
                            d.getPrecioUnitarioNeto(),
                            d.getAlicuotaIva()
                    ))
                    .toList();
            ventaRequest = new VentaRequest(
                    presupuesto.getClienteNombre(),
                    presupuesto.getFecha(),
                    detalleRequests
            );
        }

        VentaResponse ventaResponse = ventaService.crearDesdePresupuesto(ventaRequest, presupuesto.getId());

        presupuesto.setEstado("CONVERTIDO");
        presupuesto.setVentaId(ventaResponse.id());
        presupuestoRepository.save(presupuesto);

        return ventaResponse;
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Presupuesto buscarOLanzar(Long id) {
        return presupuestoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Presupuesto no encontrado: " + id));
    }

    private void calcularTotales(Presupuesto presupuesto, List<PresupuestoDetalleRequest> detalles) {
        double subtotalNeto = 0;
        double totalIva = 0;
        for (PresupuestoDetalleRequest det : detalles) {
            double itemSn = det.cantidad() * det.precioUnitarioNeto();
            subtotalNeto += itemSn;
            totalIva += itemSn * det.alicuotaIva() / 100.0;
        }
        presupuesto.setSubtotalNeto(subtotalNeto);
        presupuesto.setTotalIva(totalIva);
        presupuesto.setTotal(subtotalNeto + totalIva);
    }

    private List<PresupuestoDetalle> crearDetalles(Presupuesto presupuesto,
                                                    List<PresupuestoDetalleRequest> requests) {
        List<PresupuestoDetalle> resultado = new ArrayList<>();
        for (PresupuestoDetalleRequest req : requests) {
            double precioUnitario = req.precioUnitarioNeto() * (1 + req.alicuotaIva() / 100.0);
            double itemSn = req.cantidad() * req.precioUnitarioNeto();
            double itemSubtotal = req.cantidad() * precioUnitario;

            PresupuestoDetalle detalle = new PresupuestoDetalle();
            detalle.setPresupuesto(presupuesto);
            detalle.setProductoId(req.productoId());
            detalle.setTipoItem(req.tipoItem());
            detalle.setDescripcionItem(req.descripcionItem());
            detalle.setCantidad(req.cantidad());
            detalle.setPrecioUnitarioNeto(req.precioUnitarioNeto());
            detalle.setAlicuotaIva(req.alicuotaIva());
            detalle.setPrecioUnitario(precioUnitario);
            detalle.setSubtotalNeto(itemSn);
            detalle.setSubtotal(itemSubtotal);

            presupuestoDetalleRepository.save(detalle);
            resultado.add(detalle);
        }
        return resultado;
    }
}
