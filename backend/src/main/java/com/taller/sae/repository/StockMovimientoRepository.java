package com.taller.sae.repository;

import com.taller.sae.entity.StockMovimiento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StockMovimientoRepository extends JpaRepository<StockMovimiento, Long> {

    List<StockMovimiento> findByProductoIdOrderByFechaDesc(Long productoId);
}
