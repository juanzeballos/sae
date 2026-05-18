package com.taller.sae.service;

import com.taller.sae.dto.LoginRequest;
import com.taller.sae.dto.LoginResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public LoginResponse login(LoginRequest request) {
        // authenticate() internamente:
        //   1. Llama a UserDetailsServiceImpl.loadUserByUsername()
        //   2. Compara la contraseña con BCrypt
        //   3. Si falla, lanza BadCredentialsException (Spring Security la maneja)
        //   4. Si pasa, el usuario está autenticado
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );

        // Si llegamos acá, las credenciales son válidas.
        // Generamos el token JWT y lo devolvemos al cliente.
        String token = jwtService.generateToken(request.username());
        return new LoginResponse(token, request.username());
    }
}
