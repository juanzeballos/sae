package com.taller.sae.repository;

import com.taller.sae.entity.Presupuesto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PresupuestoRepository extends JpaRepository<Presupuesto, Long> {
    @Query(value = "SELECT * FROM presupuestos ORDER BY CAST(numero AS INTEGER) DESC", nativeQuery = true)
    List<Presupuesto> findAllByOrderByNumeroDesc();

    @Query(value = "SELECT MAX(CAST(numero AS INTEGER)) FROM presupuestos", nativeQuery = true)
    Integer findMaxNumero();
}
