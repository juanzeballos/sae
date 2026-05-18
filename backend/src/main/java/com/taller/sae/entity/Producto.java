package com.taller.sae.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "productos")
@Getter @Setter @NoArgsConstructor
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column
    private String codigo;

    @Column(nullable = false)
    private String nombre;

    @Column
    private String descripcion;

    @Column
    private String marca;

    // Costo sin IVA (opcional, para reportes de margen)
    @Column(name = "precio_costo_neto")
    private Double precioCostoNeto;

    // Precio sin IVA → se envía a AFIP
    @Column(name = "precio_venta_neto", nullable = false)
    private Double precioVentaNeto;

    // 21 | 10 | 0
    @Column(name = "alicuota_iva", nullable = false)
    private Integer alicuotaIva = 21;

    // Precio con IVA → se muestra al cliente
    @Column(name = "precio_venta", nullable = false)
    private Double precioVenta;

    @Column(nullable = false)
    private boolean activo = true;
}
