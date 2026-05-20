package com.taller.sae.controller;

import com.taller.sae.dto.ClienteRequest;
import com.taller.sae.dto.ClienteResponse;
import com.taller.sae.service.ClienteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/clientes")
@RequiredArgsConstructor
public class ClienteController {

    private final ClienteService clienteService;

    // GET /clientes → lista todos los clientes activos
    @GetMapping
    public List<ClienteResponse> listar() {
        return clienteService.listar();
    }

    // GET /clientes/{id} → obtiene un cliente por ID
    @GetMapping("/{id}")
    public ClienteResponse obtener(@PathVariable Long id) {
        return clienteService.obtener(id);
    }

    // POST /clientes → crea un nuevo cliente
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClienteResponse crear(@Valid @RequestBody ClienteRequest request) {
        return clienteService.crear(request);
    }

    // PUT /clientes/{id} → edita datos del cliente
    @PutMapping("/{id}")
    public ClienteResponse editar(@PathVariable Long id,
                                  @Valid @RequestBody ClienteRequest request) {
        return clienteService.editar(id, request);
    }

    // DELETE /clientes/{id} → borrado lógico (activo = false)
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        clienteService.eliminar(id);
    }
}
