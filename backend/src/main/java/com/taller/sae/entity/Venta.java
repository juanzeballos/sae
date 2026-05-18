package com.taller.sae.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "ventas")
@Getter @Setter @NoArgsConstructor
public class Venta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String numero;

    @Column(name = "cliente_nombre", nullable = false)
    private String clienteNombre;

    @Column(name = "presupuesto_id")
    private Long presupuestoId;

    @Column(nullable = false)
    private String fecha;

    @Column(nullable = false)
    private String estado;

    @Column(name = "forma_pago")
    private String formaPago;

    @Column(name = "subtotal_neto", nullable = false)
    private Double subtotalNeto;

    @Column(name = "total_iva", nullable = false)
    private Double totalIva;

    @Column(nullable = false)
    private Double total;
}
