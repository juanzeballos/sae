package com.taller.sae.repository;

import com.taller.sae.entity.Gasto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GastoRepository extends JpaRepository<Gasto, Long> {
    List<Gasto> findAllByOrderByFechaDesc();
}
