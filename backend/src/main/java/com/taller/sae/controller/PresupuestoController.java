package com.taller.sae.controller;

import com.taller.sae.dto.PresupuestoRequest;
import com.taller.sae.dto.PresupuestoResponse;
import com.taller.sae.dto.VentaRequest;
import com.taller.sae.dto.VentaResponse;
import com.taller.sae.service.PresupuestoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/presupuestos")
@RequiredArgsConstructor
public class PresupuestoController {

    private final PresupuestoService presupuestoService;

    @GetMapping
    public List<PresupuestoResponse> listar() {
        return presupuestoService.listar();
    }

    @GetMapping("/{id}")
    public PresupuestoResponse obtener(@PathVariable Long id) {
        return presupuestoService.obtener(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PresupuestoResponse crear(@Valid @RequestBody PresupuestoRequest request) {
        return presupuestoService.crear(request);
    }

    @PutMapping("/{id}")
    public PresupuestoResponse editar(@PathVariable Long id,
                                      @Valid @RequestBody PresupuestoRequest request) {
        return presupuestoService.editar(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        presupuestoService.eliminar(id);
    }

    @PostMapping("/{id}/confirmar")
    public PresupuestoResponse confirmar(@PathVariable Long id) {
        return presupuestoService.confirmar(id);
    }

    @PostMapping("/{id}/convertir")
    @ResponseStatus(HttpStatus.CREATED)
    public VentaResponse convertir(@PathVariable Long id,
                                   @RequestBody(required = false) VentaRequest ventaRequest) {
        return presupuestoService.convertir(id, ventaRequest);
    }
}
