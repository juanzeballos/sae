package com.taller.sae.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "clientes")
@Getter @Setter @NoArgsConstructor
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String apellido = "";  // workaround: columna legacy NOT NULL en V1

    @Column
    private String telefono;

    @Column
    private String email;

    @Column
    private String direccion;

    @Column(name = "fecha_alta")
    private String fechaAlta;

    @Column(nullable = false)
    private boolean activo = true;
}
