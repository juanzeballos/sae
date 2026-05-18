package com.taller.sae.config;

import com.taller.sae.entity.Usuario;
import com.taller.sae.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

// ApplicationRunner: se ejecuta automáticamente UNA vez cuando Spring Boot termina de arrancar.
// Usamos esto para crear el usuario admin si la base de datos está vacía.
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        if (usuarioRepository.count() == 0) {
            Usuario admin = new Usuario();
            admin.setUsername("admin");
            // Nunca guardes contraseñas en texto plano.
            // BCrypt genera un hash distinto cada vez, pero siempre verifica correctamente.
            admin.setPasswordHash(passwordEncoder.encode("admin123"));
            usuarioRepository.save(admin);

            log.info("=== Usuario admin creado: admin / admin123 ===");
            log.info("=== IMPORTANTE: cambiar la contraseña en produccion ===");
        }
    }
}
