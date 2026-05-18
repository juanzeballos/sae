package com.taller.sae.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "venta_detalles")
@Getter @Setter @NoArgsConstructor
public class VentaDetalle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "venta_id", nullable = false)
    private Venta venta;

    // Null cuando tipoItem = SERVICIO (servicio manual sin producto del catálogo)
    @Column(name = "producto_id")
    private Long productoId;

    @Column(name = "tipo_item", nullable = false)
    private String tipoItem;

    @Column(name = "descripcion_item", nullable = false)
    private String descripcionItem;

    @Column(nullable = false)
    private Double cantidad;

    @Column(name = "precio_costo_unitario")
    private Double precioCostoUnitario;

    @Column(name = "precio_unitario_neto", nullable = false)
    private Double precioUnitarioNeto;

    @Column(name = "alicuota_iva", nullable = false)
    private Integer alicuotaIva = 21;

    @Column(name = "precio_unitario", nullable = false)
    private Double precioUnitario;

    @Column(name = "subtotal_neto", nullable = false)
    private Double subtotalNeto;

    @Column(nullable = false)
    private Double subtotal;
}
