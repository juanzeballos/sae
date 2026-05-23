package com.taller.sae.service;

import com.taller.sae.dto.GastoRequest;
import com.taller.sae.dto.GastoResponse;
import com.taller.sae.entity.Gasto;
import com.taller.sae.repository.GastoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GastoService {

    private final GastoRepository gastoRepository;

    public List<GastoResponse> listar() {
        return gastoRepository.findAllByOrderByFechaDesc()
                .stream().map(GastoResponse::from).toList();
    }

    public GastoResponse obtener(Long id) {
        return GastoResponse.from(buscarOLanzar(id));
    }

    @Transactional
    public GastoResponse crear(GastoRequest request) {
        Gasto gasto = new Gasto();
        mapearCampos(gasto, request);
        return GastoResponse.from(gastoRepository.save(gasto));
    }

    @Transactional
    public GastoResponse editar(Long id, GastoRequest request) {
        Gasto gasto = buscarOLanzar(id);
        mapearCampos(gasto, request);
        return GastoResponse.from(gastoRepository.save(gasto));
    }

    @Transactional
    public void eliminar(Long id) {
        buscarOLanzar(id);
        gastoRepository.deleteById(id);
    }

    private Gasto buscarOLanzar(Long id) {
        return gastoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Gasto no encontrado: " + id));
    }

    private void mapearCampos(Gasto g, GastoRequest r) {
        g.setFecha(r.fecha());
        g.setDescripcion(r.descripcion());
        g.setMonto(r.monto());
        g.setCategoria(r.categoria());
    }
}
