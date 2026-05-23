package com.taller.sae.service;

import com.taller.sae.dto.ClienteRequest;
import com.taller.sae.dto.ClienteResponse;
import com.taller.sae.entity.Cliente;
import com.taller.sae.repository.ClienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public List<ClienteResponse> listar() {
        return clienteRepository.findByActivoTrueOrderByNombreAsc()
                .stream().map(ClienteResponse::from).toList();
    }

    public ClienteResponse obtener(Long id) {
        return ClienteResponse.from(buscarOLanzar(id));
    }

    @Transactional
    public ClienteResponse crear(ClienteRequest request) {
        Cliente cliente = new Cliente();
        cliente.setApellido("");  // workaround columna NOT NULL legacy
        cliente.setFechaAlta(LocalDate.now().toString());
        mapearCampos(cliente, request);
        return ClienteResponse.from(clienteRepository.save(cliente));
    }

    @Transactional
    public ClienteResponse editar(Long id, ClienteRequest request) {
        Cliente cliente = buscarOLanzar(id);
        mapearCampos(cliente, request);
        return ClienteResponse.from(clienteRepository.save(cliente));
    }

    @Transactional
    public void eliminar(Long id) {
        Cliente cliente = buscarOLanzar(id);
        cliente.setActivo(false);
        clienteRepository.save(cliente);
    }

    private Cliente buscarOLanzar(Long id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Cliente no encontrado: " + id));
    }

    private void mapearCampos(Cliente c, ClienteRequest r) {
        c.setNombre(r.nombre());
        c.setTelefono(r.telefono());
        c.setEmail(r.email());
        c.setDireccion(r.direccion());
    }
}
