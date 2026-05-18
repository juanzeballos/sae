package com.taller.sae.repository;

import com.taller.sae.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductoRepository extends JpaRepository<Producto, Long> {

    // Solo productos activos (no borrados lógicamente)
    List<Producto> findByActivoTrueOrderByNombreAsc();

    // Para validar duplicados de código al crear/editar
    boolean existsByCodigoAndActivoTrue(String codigo);
    boolean existsByCodigoAndActivoTrueAndIdNot(String codigo, Long id);
}
