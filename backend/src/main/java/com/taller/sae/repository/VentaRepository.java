package com.taller.sae.repository;

import com.taller.sae.entity.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface VentaRepository extends JpaRepository<Venta, Long> {
    @Query(value = "SELECT * FROM ventas ORDER BY CAST(numero AS INTEGER) DESC", nativeQuery = true)
    List<Venta> findAllByOrderByNumeroDesc();

    @Query(value = "SELECT MAX(CAST(numero AS INTEGER)) FROM ventas", nativeQuery = true)
    Integer findMaxNumero();
}
