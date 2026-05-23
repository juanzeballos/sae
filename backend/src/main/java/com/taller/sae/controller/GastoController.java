package com.taller.sae.controller;

import com.taller.sae.dto.GastoRequest;
import com.taller.sae.dto.GastoResponse;
import com.taller.sae.service.GastoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/gastos")
@RequiredArgsConstructor
public class GastoController {

    private final GastoService gastoService;

    // GET /gastos → lista todos los gastos ordenados por fecha desc
    @GetMapping
    public List<GastoResponse> listar() {
        return gastoService.listar();
    }

    // GET /gastos/{id} → obtiene un gasto por ID
    @GetMapping("/{id}")
    public GastoResponse obtener(@PathVariable Long id) {
        return gastoService.obtener(id);
    }

    // POST /gastos → crea un nuevo gasto
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GastoResponse crear(@Valid @RequestBody GastoRequest request) {
        return gastoService.crear(request);
    }

    // PUT /gastos/{id} → edita un gasto existente
    @PutMapping("/{id}")
    public GastoResponse editar(@PathVariable Long id,
                                @Valid @RequestBody GastoRequest request) {
        return gastoService.editar(id, request);
    }

    // DELETE /gastos/{id} → elimina el gasto
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        gastoService.eliminar(id);
    }
}
