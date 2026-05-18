package com.taller.sae.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "stock")
@Getter @Setter @NoArgsConstructor
public class Stock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Un registro de stock por producto (UNIQUE en la BD)
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false, unique = true)
    private Producto producto;

    @Column(name = "cantidad_actual", nullable = false)
    private Double cantidadActual = 0.0;

    // Umbral para alertas futuras
    @Column(name = "stock_minimo", nullable = false)
    private Double stockMinimo = 0.0;
}
