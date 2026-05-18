package com.taller.sae.service;

import com.taller.sae.dto.ProductoRequest;
import com.taller.sae.dto.ProductoResponse;
import com.taller.sae.entity.Producto;
import com.taller.sae.entity.Stock;
import com.taller.sae.entity.StockMovimiento;
import com.taller.sae.repository.ProductoRepository;
import com.taller.sae.repository.StockMovimientoRepository;
import com.taller.sae.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final StockRepository stockRepository;
    private final StockMovimientoRepository movimientoRepository;

    // ─── Listar todos los productos activos con su stock ────────────────────

    public List<ProductoResponse> listar() {
        return productoRepository.findByActivoTrueOrderByNombreAsc().stream()
                .map(p -> {
                    Stock stock = stockRepository.findByProductoId(p.getId()).orElse(null);
                    return ProductoResponse.from(p, stock);
                })
                .toList();
    }

    // ─── Obtener uno por ID ──────────────────────────────────────────────────

    public ProductoResponse obtener(Long id) {
        Producto producto = buscarActivoOLanzar(id);
        Stock stock = stockRepository.findByProductoId(id).orElse(null);
        return ProductoResponse.from(producto, stock);
    }

    // ─── Crear producto + stock inicial ─────────────────────────────────────

    @Transactional
    public ProductoResponse crear(ProductoRequest request) {
        validarCodigoDuplicado(request.codigo(), null);

        Producto producto = new Producto();
        mapearCampos(producto, request);
        productoRepository.save(producto);

        double cantidadInicial = request.stockInicial() != null ? request.stockInicial() : 0.0;
        double stockMinimo = request.stockMinimo() != null ? request.stockMinimo() : 0.0;

        Stock stock = new Stock();
        stock.setProducto(producto);
        stock.setCantidadActual(cantidadInicial);
        stock.setStockMinimo(stockMinimo);
        stockRepository.save(stock);

        // Registrar el stock inicial solo si es mayor a 0
        if (cantidadInicial > 0) {
            registrarMovimiento(producto, "ENTRADA", cantidadInicial, 0.0, cantidadInicial, "Stock inicial");
        }

        return ProductoResponse.from(producto, stock);
    }

    // ─── Editar producto ─────────────────────────────────────────────────────

    @Transactional
    public ProductoResponse editar(Long id, ProductoRequest request) {
        Producto producto = buscarActivoOLanzar(id);
        validarCodigoDuplicado(request.codigo(), id);

        mapearCampos(producto, request);
        productoRepository.save(producto);

        // La edición NO modifica el stock (hay endpoints separados para eso)
        Stock stock = stockRepository.findByProductoId(id).orElse(null);
        return ProductoResponse.from(producto, stock);
    }

    // ─── Eliminar (borrado lógico) ────────────────────────────────────────────

    @Transactional
    public void eliminar(Long id) {
        Producto producto = buscarActivoOLanzar(id);
        producto.setActivo(false);
        productoRepository.save(producto);
    }

    // ─── Ajustar stock manualmente ───────────────────────────────────────────

    @Transactional
    public ProductoResponse ajustarStock(Long id, Double nuevaCantidad, String observacion) {
        if (nuevaCantidad < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La cantidad no puede ser negativa");
        }

        Producto producto = buscarActivoOLanzar(id);
        Stock stock = stockRepository.findByProductoId(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Stock no encontrado para el producto " + id));

        double stockAntes = stock.getCantidadActual();
        stock.setCantidadActual(nuevaCantidad);
        stockRepository.save(stock);

        String obs = (observacion != null && !observacion.isBlank()) ? observacion : "Ajuste manual";
        registrarMovimiento(producto, "AJUSTE", Math.abs(nuevaCantidad - stockAntes), stockAntes, nuevaCantidad, obs);

        return ProductoResponse.from(producto, stock);
    }

    // ─── Helpers privados ────────────────────────────────────────────────────

    private Producto buscarActivoOLanzar(Long id) {
        return productoRepository.findById(id)
                .filter(Producto::isActivo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado: " + id));
    }

    private void validarCodigoDuplicado(String codigo, Long idExcluir) {
        if (codigo == null || codigo.isBlank()) return;

        boolean duplicado = idExcluir == null
                ? productoRepository.existsByCodigoAndActivoTrue(codigo)
                : productoRepository.existsByCodigoAndActivoTrueAndIdNot(codigo, idExcluir);

        if (duplicado) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un producto con el código: " + codigo);
        }
    }

    private void mapearCampos(Producto producto, ProductoRequest request) {
        producto.setCodigo(request.codigo());
        producto.setNombre(request.nombre());
        producto.setDescripcion(request.descripcion());
        producto.setMarca(request.marca());
        producto.setPrecioCostoNeto(request.precioCostoNeto());
        producto.setPrecioVentaNeto(request.precioVentaNeto());
        producto.setAlicuotaIva(request.alicuotaIva() != null ? request.alicuotaIva() : 21);
        producto.setPrecioVenta(request.precioVenta());
    }

    private void registrarMovimiento(Producto producto, String tipo, Double cantidad,
                                     Double stockAntes, Double stockDespues, String observacion) {
        StockMovimiento mov = new StockMovimiento();
        mov.setProducto(producto);
        mov.setTipo(tipo);
        mov.setCantidad(cantidad);
        mov.setStockAntes(stockAntes);
        mov.setStockDespues(stockDespues);
        mov.setFecha(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        mov.setObservacion(observacion);
        movimientoRepository.save(mov);
    }
}
