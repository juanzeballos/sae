package com.taller.sae.dto;

import com.taller.sae.entity.Cliente;

public record ClienteResponse(
    Long id,
    String nombre,
    String telefono,
    String email,
    String direccion,
    String fechaAlta
) {
    public static ClienteResponse from(Cliente c) {
        return new ClienteResponse(
            c.getId(),
            c.getNombre(),
            c.getTelefono(),
            c.getEmail(),
            c.getDireccion(),
            c.getFechaAlta()
        );
    }
}
