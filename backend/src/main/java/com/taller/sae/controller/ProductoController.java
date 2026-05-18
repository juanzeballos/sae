package com.taller.sae.controller;

import com.taller.sae.dto.ProductoRequest;
import com.taller.sae.dto.ProductoResponse;
import com.taller.sae.service.ProductoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
 
@RestController
@RequestMapping("/productos")
@RequiredArgsConstructor
public class ProductoController {

    private final ProductoService productoService;

    // GET /productos → lista todos los productos activos con su stock
    @GetMapping
    public List<ProductoResponse> listar() {
        return productoService.listar();
    }

    // GET /productos/{id} → obtiene un producto
    @GetMapping("/{id}")
    public ProductoResponse obtener(@PathVariable Long id) {
        return productoService.obtener(id);
    }

    // POST /productos → crea un producto con stock inicial
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductoResponse crear(@Valid @RequestBody ProductoRequest request) {
        return productoService.crear(request);
    }

    // PUT /productos/{id} → edita datos del producto (no modifica stock)
    @PutMapping("/{id}")
    public ProductoResponse editar(@PathVariable Long id,
                                   @Valid @RequestBody ProductoRequest request) {
        return productoService.editar(id, request);
    }

    // DELETE /productos/{id} → borrado lógico (activo = false)
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        productoService.eliminar(id);
    }

    // PATCH /productos/{id}/stock → ajuste manual de stock
    // Body: { "cantidad": 15.0, "observacion": "Inventario físico" }
    @PatchMapping("/{id}/stock")
    public ProductoResponse ajustarStock(@PathVariable Long id,
                                         @RequestBody Map<String, Object> body) {
        Double cantidad = ((Number) body.get("cantidad")).doubleValue();
        String observacion = (String) body.get("observacion");
        return productoService.ajustarStock(id, cantidad, observacion);
    }
}
