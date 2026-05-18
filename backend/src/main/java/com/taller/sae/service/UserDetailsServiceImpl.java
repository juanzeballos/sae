package com.taller.sae.service;

import com.taller.sae.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

// UserDetailsService es la interfaz de Spring Security para cargar un usuario por username.
// Spring Security la llama internamente durante el proceso de autenticación.
//
// Separamos esto de la entidad Usuario a propósito:
//   - La entidad JPA sabe cómo persistir datos
//   - Este servicio sabe cómo cargar un usuario para Spring Security
//   - Cada clase tiene una sola responsabilidad
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        var usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));

        // Convertimos nuestra entidad al objeto UserDetails que Spring Security entiende.
        // User.builder() es una clase de Spring Security (no la nuestra).
        return User.builder()
                .username(usuario.getUsername())
                .password(usuario.getPasswordHash())   // ya está hasheado con BCrypt
                .disabled(!usuario.isActivo())
                .accountLocked(false)
                .credentialsExpired(false)
                .accountExpired(false)
                .roles("USER")
                .build();
    }
}
