package com.taller.sae.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "stock_movimientos")
@Getter @Setter @NoArgsConstructor
public class StockMovimiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    // ENTRADA | SALIDA | AJUSTE
    @Column(nullable = false)
    private String tipo;

    @Column(nullable = false)
    private Double cantidad;

    @Column(name = "stock_antes", nullable = false)
    private Double stockAntes;

    @Column(name = "stock_despues", nullable = false)
    private Double stockDespues;

    // Guardado como String ISO (SQLite no tiene tipo DATETIME nativo)
    @Column(nullable = false)
    private String fecha;

    // Null si el movimiento no fue originado por una venta
    @Column(name = "venta_id")
    private Long ventaId;

    @Column
    private String observacion;
}
