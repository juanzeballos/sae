package com.taller.sae.repository;

import com.taller.sae.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// JpaRepository<Usuario, Long>:
//   - Usuario = la entidad que maneja
//   - Long    = el tipo del ID (@Id)
// Spring genera automáticamente: findById, save, delete, count, findAll, etc.
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // Spring traduce el nombre del método a SQL:
    // "findByUsername" → SELECT * FROM usuarios WHERE username = ?
    Optional<Usuario> findByUsername(String username);
}
