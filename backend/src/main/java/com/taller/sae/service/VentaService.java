package com.taller.sae.service;

import com.taller.sae.dto.VentaDetalleRequest;
import com.taller.sae.dto.VentaRequest;
import com.taller.sae.dto.VentaResponse;
import com.taller.sae.entity.*;
import com.taller.sae.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VentaService {

    private final VentaRepository ventaRepository;
    private final VentaDetalleRepository ventaDetalleRepository;
    private final ProductoRepository productoRepository;
    private final StockRepository stockRepository;
    private final StockMovimientoRepository movimientoRepository;

    // ─── Listar ─────────────────────────────────────────────────────────────

    public List<VentaResponse> listar() {
        return ventaRepository.findAllByOrderByNumeroDesc().stream()
                .map(v -> {
                    List<VentaDetalle> detalles = ventaDetalleRepository.findByVentaId(v.getId());
                    return VentaResponse.from(v, detalles);
                })
                .toList();
    }

    // ─── Obtener ─────────────────────────────────────────────────────────────

    public VentaResponse obtener(Long id) {
        Venta venta = buscarOLanzar(id);
        List<VentaDetalle> detalles = ventaDetalleRepository.findByVentaId(id);
        return VentaResponse.from(venta, detalles);
    }

    // ─── Crear (directa, sin presupuesto origen) ─────────────────────────────

    @Transactional
    public VentaResponse crear(VentaRequest request) {
        return crearInterno(request, null);
    }

    // ─── Crear desde conversión de presupuesto ───────────────────────────────

    @Transactional
    VentaResponse crearDesdePresupuesto(VentaRequest request, Long presupuestoId) {
        return crearInterno(request, presupuestoId);
    }

    // ─── Anular ──────────────────────────────────────────────────────────────

    @Transactional
    public void anular(Long id) {
        Venta venta = buscarOLanzar(id);

        if (!"ACTIVA".equals(venta.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Solo se puede anular una venta ACTIVA");
        }

        List<VentaDetalle> detalles = ventaDetalleRepository.findByVentaId(id);

        for (VentaDetalle det : detalles) {
            if ("PRODUCTO".equals(det.getTipoItem()) && det.getProductoId() != null) {
                Producto producto = productoRepository.findById(det.getProductoId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "Producto no encontrado: " + det.getProductoId()));

                Stock stock = stockRepository.findByProductoId(det.getProductoId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "Stock no encontrado para producto: " + det.getProductoId()));

                double stockAntes = stock.getCantidadActual();
                double stockDespues = stockAntes + det.getCantidad();
                stock.setCantidadActual(stockDespues);
                stockRepository.save(stock);

                registrarMovimiento(producto, "ENTRADA", det.getCantidad(),
                        stockAntes, stockDespues, venta.getId(),
                        "Anulación venta #" + venta.getNumero());
            }
        }

        venta.setEstado("ANULADA");
        ventaRepository.save(venta);
    }

    // ─── Lógica interna de creación ──────────────────────────────────────────

    private VentaResponse crearInterno(VentaRequest request, Long presupuestoId) {
        // 1. Validar stock de todos los ítems PRODUCTO antes de escribir nada
        for (VentaDetalleRequest det : request.detalles()) {
            if ("PRODUCTO".equals(det.tipoItem()) && det.productoId() != null) {
                Stock stock = stockRepository.findByProductoId(det.productoId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "Stock no encontrado para producto: " + det.productoId()));

                if (stock.getCantidadActual() < det.cantidad()) {
                    Producto p = productoRepository.findById(det.productoId())
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                    "Producto no encontrado: " + det.productoId()));
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Stock insuficiente para: " + p.getNombre()
                                    + ". Disponible: " + stock.getCantidadActual()
                                    + ", Requerido: " + det.cantidad());
                }
            }
        }

        // 2. Calcular número
        Integer maxNumero = ventaRepository.findMaxNumero();
        int nextNumero = (maxNumero == null ? 0 : maxNumero) + 1;

        // 3. Calcular totales
        double subtotalNeto = 0;
        double totalIva = 0;
        for (VentaDetalleRequest det : request.detalles()) {
            double itemSn = det.cantidad() * det.precioUnitarioNeto();
            subtotalNeto += itemSn;
            totalIva += itemSn * det.alicuotaIva() / 100.0;
        }
        double total = subtotalNeto + totalIva;

        // 4. Guardar venta
        Venta venta = new Venta();
        venta.setNumero(String.valueOf(nextNumero));
        venta.setClienteNombre(request.clienteNombre());
        venta.setPresupuestoId(presupuestoId);
        venta.setFecha(request.fecha() != null ? request.fecha() : LocalDate.now().toString());
        venta.setEstado("ACTIVA");
        venta.setFormaPago("EFECTIVO");
        venta.setSubtotalNeto(subtotalNeto);
        venta.setTotalIva(totalIva);
        venta.setTotal(total);
        ventaRepository.save(venta);

        // 5. Guardar detalles y descontar stock
        List<VentaDetalle> detallesSaved = new ArrayList<>();
        for (VentaDetalleRequest det : request.detalles()) {
            double precioUnitario = det.precioUnitarioNeto() * (1 + det.alicuotaIva() / 100.0);
            double itemSn = det.cantidad() * det.precioUnitarioNeto();
            double itemSubtotal = det.cantidad() * precioUnitario;

            VentaDetalle detalle = new VentaDetalle();
            detalle.setVenta(venta);
            detalle.setProductoId(det.productoId());
            detalle.setTipoItem(det.tipoItem());
            detalle.setDescripcionItem(det.descripcionItem());
            detalle.setCantidad(det.cantidad());
            detalle.setPrecioUnitarioNeto(det.precioUnitarioNeto());
            detalle.setAlicuotaIva(det.alicuotaIva());
            detalle.setPrecioUnitario(precioUnitario);
            detalle.setSubtotalNeto(itemSn);
            detalle.setSubtotal(itemSubtotal);

            if ("PRODUCTO".equals(det.tipoItem()) && det.productoId() != null) {
                Producto producto = productoRepository.findById(det.productoId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "Producto no encontrado: " + det.productoId()));

                detalle.setPrecioCostoUnitario(producto.getPrecioCostoNeto());

                Stock stock = stockRepository.findByProductoId(det.productoId()).get();
                double stockAntes = stock.getCantidadActual();
                double stockDespues = stockAntes - det.cantidad();
                stock.setCantidadActual(stockDespues);
                stockRepository.save(stock);

                registrarMovimiento(producto, "SALIDA", det.cantidad(),
                        stockAntes, stockDespues, venta.getId(),
                        "Venta #" + venta.getNumero());
            }

            ventaDetalleRepository.save(detalle);
            detallesSaved.add(detalle);
        }

        return VentaResponse.from(venta, detallesSaved);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Venta buscarOLanzar(Long id) {
        return ventaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Venta no encontrada: " + id));
    }

    private void registrarMovimiento(Producto producto, String tipo, Double cantidad,
                                     Double stockAntes, Double stockDespues,
                                     Long ventaId, String observacion) {
        StockMovimiento mov = new StockMovimiento();
        mov.setProducto(producto);
        mov.setTipo(tipo);
        mov.setCantidad(cantidad);
        mov.setStockAntes(stockAntes);
        mov.setStockDespues(stockDespues);
        mov.setVentaId(ventaId);
        mov.setFecha(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        mov.setObservacion(observacion);
        movimientoRepository.save(mov);
    }
}
