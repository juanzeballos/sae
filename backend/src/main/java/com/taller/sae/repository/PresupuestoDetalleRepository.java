package com.taller.sae.repository;

import com.taller.sae.entity.PresupuestoDetalle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PresupuestoDetalleRepository extends JpaRepository<PresupuestoDetalle, Long> {
    List<PresupuestoDetalle> findByPresupuestoId(Long presupuestoId);

    @Modifying
    @Query("DELETE FROM PresupuestoDetalle d WHERE d.presupuesto.id = :presupuestoId")
    void deleteByPresupuestoId(@Param("presupuestoId") Long presupuestoId);
}
