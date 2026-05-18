package com.taller.sae.repository;

import com.taller.sae.entity.Presupuesto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PresupuestoRepository extends JpaRepository<Presupuesto, Long> {
    List<Presupuesto> findAllByOrderByNumeroDesc();

    @Query(value = "SELECT MAX(CAST(numero AS INTEGER)) FROM presupuestos", nativeQuery = true)
    Integer findMaxNumero();
}
