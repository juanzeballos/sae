# Fase 2 — Presupuestos y Ventas: Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar los módulos de Presupuestos y Ventas al sistema SAE: crear presupuestos con ítems de producto/servicio, confirmarlos, convertirlos a ventas que descuentan stock, y anular ventas revirtiendo stock.

**Architecture:** 4 entidades JPA nuevas (Presupuesto, PresupuestoDetalle, Venta, VentaDetalle) mapeadas a tablas ya existentes en V1__init_schema.sql. Dos servicios con máquinas de estado. Dos controllers REST. Frontend: 4 páginas completas + 1 modal de selección de producto.

**Tech Stack:** Spring Boot 3.2.5, SQLite (JPA/Hibernate + Lombok), Jakarta Validation; React 18, TypeScript, Vite, shadcn/ui, Tailwind, react-router-dom, axios

---

## Mapa de archivos

### Backend (crear)
```
src/main/java/com/taller/sae/entity/Presupuesto.java
src/main/java/com/taller/sae/entity/PresupuestoDetalle.java
src/main/java/com/taller/sae/entity/Venta.java
src/main/java/com/taller/sae/entity/VentaDetalle.java
src/main/java/com/taller/sae/dto/PresupuestoDetalleRequest.java
src/main/java/com/taller/sae/dto/PresupuestoDetalleResponse.java
src/main/java/com/taller/sae/dto/PresupuestoRequest.java
src/main/java/com/taller/sae/dto/PresupuestoResponse.java
src/main/java/com/taller/sae/dto/VentaDetalleRequest.java
src/main/java/com/taller/sae/dto/VentaDetalleResponse.java
src/main/java/com/taller/sae/dto/VentaRequest.java
src/main/java/com/taller/sae/dto/VentaResponse.java
src/main/java/com/taller/sae/repository/PresupuestoRepository.java
src/main/java/com/taller/sae/repository/PresupuestoDetalleRepository.java
src/main/java/com/taller/sae/repository/VentaRepository.java
src/main/java/com/taller/sae/repository/VentaDetalleRepository.java
src/main/java/com/taller/sae/service/VentaService.java
src/main/java/com/taller/sae/service/PresupuestoService.java
src/main/java/com/taller/sae/controller/PresupuestoController.java
src/main/java/com/taller/sae/controller/VentaController.java
```

### Frontend (crear)
```
src/services/presupuestos.ts
src/services/ventas.ts
src/pages/PresupuestosPage.tsx
src/pages/PresupuestoFormPage.tsx
src/pages/VentasPage.tsx
src/pages/VentaFormPage.tsx
src/components/presupuestos/ProductoSelectorModal.tsx
```

### Frontend (modificar)
```
src/types/index.ts        — agregar interfaces Presupuesto, PresupuestoDetalle, Venta, VentaDetalle
src/components/layout/AppLayout.tsx  — agregar Presupuestos y Ventas al sidebar
src/App.tsx               — agregar 5 rutas nuevas
```

---

## Notas técnicas globales

- **Todos los valores monetales y cantidades usan `Double`** (igual que `Producto`, `Stock`, `StockMovimiento`).
- **`numero` se almacena como String** en la entidad (la columna es TEXT en SQLite) pero se expone como String en los DTOs.
- **Estados son String** (`"BORRADOR"`, `"CONFIRMADO"`, etc.) — no enums.
- **Errores**: usar `ResponseStatusException` (mismo patrón que `ProductoService`).
- **Movimientos de stock**: patrón idéntico a `ProductoService.registrarMovimiento`, más el campo `ventaId`.
- El proyecto está en rama `fase2`. Todos los commits van a esta rama.

---

## Task 1: Entidades JPA

**Files:**
- Create: `backend/src/main/java/com/taller/sae/entity/Presupuesto.java`
- Create: `backend/src/main/java/com/taller/sae/entity/PresupuestoDetalle.java`
- Create: `backend/src/main/java/com/taller/sae/entity/Venta.java`
- Create: `backend/src/main/java/com/taller/sae/entity/VentaDetalle.java`

- [ ] **Paso 1: Crear Presupuesto.java**

```java
package com.taller.sae.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "presupuestos")
@Getter @Setter @NoArgsConstructor
public class Presupuesto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String numero;

    @Column(name = "cliente_nombre", nullable = false)
    private String clienteNombre;

    @Column(nullable = false)
    private String fecha;

    @Column(nullable = false)
    private String estado;

    @Column(name = "venta_id")
    private Long ventaId;

    @Column(name = "subtotal_neto", nullable = false)
    private Double subtotalNeto;

    @Column(name = "total_iva", nullable = false)
    private Double totalIva;

    @Column(nullable = false)
    private Double total;
}
```

- [ ] **Paso 2: Crear PresupuestoDetalle.java**

```java
package com.taller.sae.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "presupuesto_detalles")
@Getter @Setter @NoArgsConstructor
public class PresupuestoDetalle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "presupuesto_id", nullable = false)
    private Presupuesto presupuesto;

    @Column(name = "producto_id")
    private Long productoId;

    @Column(name = "tipo_item", nullable = false)
    private String tipoItem;

    @Column(name = "descripcion_item", nullable = false)
    private String descripcionItem;

    @Column(nullable = false)
    private Double cantidad;

    @Column(name = "precio_unitario_neto", nullable = false)
    private Double precioUnitarioNeto;

    @Column(name = "alicuota_iva", nullable = false)
    private Integer alicuotaIva;

    @Column(name = "precio_unitario", nullable = false)
    private Double precioUnitario;

    @Column(name = "subtotal_neto", nullable = false)
    private Double subtotalNeto;

    @Column(nullable = false)
    private Double subtotal;
}
```

- [ ] **Paso 3: Crear Venta.java**

```java
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
```

- [ ] **Paso 4: Crear VentaDetalle.java**

```java
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
    private Integer alicuotaIva;

    @Column(name = "precio_unitario", nullable = false)
    private Double precioUnitario;

    @Column(name = "subtotal_neto", nullable = false)
    private Double subtotalNeto;

    @Column(nullable = false)
    private Double subtotal;
}
```

- [ ] **Paso 5: Compilar para verificar**

```
set JAVA_HOME=F:\jdk-17
cd F:\Proyectos\sae\backend
F:\Users\54347\Documents\apache-maven-3.8.4\bin\mvn compile -DskipTests -s settings-local.xml
```
Esperado: BUILD SUCCESS

- [ ] **Paso 6: Commit**

```
git add backend/src/main/java/com/taller/sae/entity/Presupuesto.java
git add backend/src/main/java/com/taller/sae/entity/PresupuestoDetalle.java
git add backend/src/main/java/com/taller/sae/entity/Venta.java
git add backend/src/main/java/com/taller/sae/entity/VentaDetalle.java
git commit -m "feat(fase2): agregar entidades JPA Presupuesto, Venta y sus detalles"
```

---

## Task 2: DTOs

**Files:**
- Create: `backend/src/main/java/com/taller/sae/dto/PresupuestoDetalleRequest.java`
- Create: `backend/src/main/java/com/taller/sae/dto/PresupuestoDetalleResponse.java`
- Create: `backend/src/main/java/com/taller/sae/dto/PresupuestoRequest.java`
- Create: `backend/src/main/java/com/taller/sae/dto/PresupuestoResponse.java`
- Create: `backend/src/main/java/com/taller/sae/dto/VentaDetalleRequest.java`
- Create: `backend/src/main/java/com/taller/sae/dto/VentaDetalleResponse.java`
- Create: `backend/src/main/java/com/taller/sae/dto/VentaRequest.java`
- Create: `backend/src/main/java/com/taller/sae/dto/VentaResponse.java`

- [ ] **Paso 1: Crear PresupuestoDetalleRequest.java**

```java
package com.taller.sae.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public record PresupuestoDetalleRequest(
        Long productoId,

        @NotBlank(message = "El tipo de ítem es obligatorio")
        String tipoItem,

        @NotBlank(message = "La descripción es obligatoria")
        String descripcionItem,

        @NotNull(message = "La cantidad es obligatoria")
        @Positive(message = "La cantidad debe ser mayor a cero")
        Double cantidad,

        @NotNull(message = "El precio unitario neto es obligatorio")
        @PositiveOrZero
        Double precioUnitarioNeto,

        @NotNull(message = "La alícuota de IVA es obligatoria")
        Integer alicuotaIva
) {}
```

- [ ] **Paso 2: Crear PresupuestoDetalleResponse.java**

```java
package com.taller.sae.dto;

import com.taller.sae.entity.PresupuestoDetalle;

public record PresupuestoDetalleResponse(
        Long id,
        Long productoId,
        String tipoItem,
        String descripcionItem,
        Double cantidad,
        Double precioUnitarioNeto,
        Integer alicuotaIva,
        Double precioUnitario,
        Double subtotalNeto,
        Double subtotal
) {
    public static PresupuestoDetalleResponse from(PresupuestoDetalle d) {
        return new PresupuestoDetalleResponse(
                d.getId(),
                d.getProductoId(),
                d.getTipoItem(),
                d.getDescripcionItem(),
                d.getCantidad(),
                d.getPrecioUnitarioNeto(),
                d.getAlicuotaIva(),
                d.getPrecioUnitario(),
                d.getSubtotalNeto(),
                d.getSubtotal()
        );
    }
}
```

- [ ] **Paso 3: Crear PresupuestoRequest.java**

```java
package com.taller.sae.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record PresupuestoRequest(
        @NotBlank(message = "El nombre del cliente es obligatorio")
        String clienteNombre,

        String fecha,

        @NotEmpty(message = "Debe incluir al menos un ítem")
        @Valid
        List<PresupuestoDetalleRequest> detalles
) {}
```

- [ ] **Paso 4: Crear PresupuestoResponse.java**

```java
package com.taller.sae.dto;

import com.taller.sae.entity.Presupuesto;
import com.taller.sae.entity.PresupuestoDetalle;

import java.util.List;

public record PresupuestoResponse(
        Long id,
        String numero,
        String clienteNombre,
        String fecha,
        String estado,
        Long ventaId,
        List<PresupuestoDetalleResponse> detalles,
        Double subtotalNeto,
        Double totalIva,
        Double total
) {
    public static PresupuestoResponse from(Presupuesto p, List<PresupuestoDetalle> detalles) {
        return new PresupuestoResponse(
                p.getId(),
                p.getNumero(),
                p.getClienteNombre(),
                p.getFecha(),
                p.getEstado(),
                p.getVentaId(),
                detalles.stream().map(PresupuestoDetalleResponse::from).toList(),
                p.getSubtotalNeto(),
                p.getTotalIva(),
                p.getTotal()
        );
    }
}
```

- [ ] **Paso 5: Crear VentaDetalleRequest.java**

```java
package com.taller.sae.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public record VentaDetalleRequest(
        Long productoId,

        @NotBlank(message = "El tipo de ítem es obligatorio")
        String tipoItem,

        @NotBlank(message = "La descripción es obligatoria")
        String descripcionItem,

        @NotNull(message = "La cantidad es obligatoria")
        @Positive(message = "La cantidad debe ser mayor a cero")
        Double cantidad,

        @NotNull(message = "El precio unitario neto es obligatorio")
        @PositiveOrZero
        Double precioUnitarioNeto,

        @NotNull(message = "La alícuota de IVA es obligatoria")
        Integer alicuotaIva
) {}
```

- [ ] **Paso 6: Crear VentaDetalleResponse.java**

```java
package com.taller.sae.dto;

import com.taller.sae.entity.VentaDetalle;

public record VentaDetalleResponse(
        Long id,
        Long productoId,
        String tipoItem,
        String descripcionItem,
        Double cantidad,
        Double precioUnitarioNeto,
        Integer alicuotaIva,
        Double precioUnitario,
        Double subtotalNeto,
        Double subtotal
) {
    public static VentaDetalleResponse from(VentaDetalle d) {
        return new VentaDetalleResponse(
                d.getId(),
                d.getProductoId(),
                d.getTipoItem(),
                d.getDescripcionItem(),
                d.getCantidad(),
                d.getPrecioUnitarioNeto(),
                d.getAlicuotaIva(),
                d.getPrecioUnitario(),
                d.getSubtotalNeto(),
                d.getSubtotal()
        );
    }
}
```

- [ ] **Paso 7: Crear VentaRequest.java**

```java
package com.taller.sae.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record VentaRequest(
        @NotBlank(message = "El nombre del cliente es obligatorio")
        String clienteNombre,

        String fecha,

        @NotEmpty(message = "Debe incluir al menos un ítem")
        @Valid
        List<VentaDetalleRequest> detalles
) {}
```

- [ ] **Paso 8: Crear VentaResponse.java**

```java
package com.taller.sae.dto;

import com.taller.sae.entity.Venta;
import com.taller.sae.entity.VentaDetalle;

import java.util.List;

public record VentaResponse(
        Long id,
        String numero,
        String clienteNombre,
        Long presupuestoId,
        String fecha,
        String estado,
        String formaPago,
        List<VentaDetalleResponse> detalles,
        Double subtotalNeto,
        Double totalIva,
        Double total
) {
    public static VentaResponse from(Venta v, List<VentaDetalle> detalles) {
        return new VentaResponse(
                v.getId(),
                v.getNumero(),
                v.getClienteNombre(),
                v.getPresupuestoId(),
                v.getFecha(),
                v.getEstado(),
                v.getFormaPago(),
                detalles.stream().map(VentaDetalleResponse::from).toList(),
                v.getSubtotalNeto(),
                v.getTotalIva(),
                v.getTotal()
        );
    }
}
```

- [ ] **Paso 9: Compilar para verificar**

```
set JAVA_HOME=F:\jdk-17
cd F:\Proyectos\sae\backend
F:\Users\54347\Documents\apache-maven-3.8.4\bin\mvn compile -DskipTests -s settings-local.xml
```
Esperado: BUILD SUCCESS

- [ ] **Paso 10: Commit**

```
git add backend/src/main/java/com/taller/sae/dto/
git commit -m "feat(fase2): agregar DTOs de presupuesto y venta"
```

---

## Task 3: Repositories

**Files:**
- Create: `backend/src/main/java/com/taller/sae/repository/PresupuestoRepository.java`
- Create: `backend/src/main/java/com/taller/sae/repository/PresupuestoDetalleRepository.java`
- Create: `backend/src/main/java/com/taller/sae/repository/VentaRepository.java`
- Create: `backend/src/main/java/com/taller/sae/repository/VentaDetalleRepository.java`

- [ ] **Paso 1: Crear PresupuestoRepository.java**

```java
package com.taller.sae.repository;

import com.taller.sae.entity.Presupuesto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PresupuestoRepository extends JpaRepository<Presupuesto, Long> {
    List<Presupuesto> findAllByOrderByNumeroDesc();

    @Query(value = "SELECT MAX(CAST(numero AS INTEGER)) FROM presupuestos", nativeQuery = true)
    Integer findMaxNumero();
}
```

- [ ] **Paso 2: Crear PresupuestoDetalleRepository.java**

```java
package com.taller.sae.repository;

import com.taller.sae.entity.PresupuestoDetalle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PresupuestoDetalleRepository extends JpaRepository<PresupuestoDetalle, Long> {
    List<PresupuestoDetalle> findByPresupuestoId(Long presupuestoId);

    @Modifying
    @Query("DELETE FROM PresupuestoDetalle d WHERE d.presupuesto.id = :presupuestoId")
    void deleteByPresupuestoId(@Param("presupuestoId") Long presupuestoId);
}
```

- [ ] **Paso 3: Crear VentaRepository.java**

```java
package com.taller.sae.repository;

import com.taller.sae.entity.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface VentaRepository extends JpaRepository<Venta, Long> {
    List<Venta> findAllByOrderByNumeroDesc();

    @Query(value = "SELECT MAX(CAST(numero AS INTEGER)) FROM ventas", nativeQuery = true)
    Integer findMaxNumero();
}
```

- [ ] **Paso 4: Crear VentaDetalleRepository.java**

```java
package com.taller.sae.repository;

import com.taller.sae.entity.VentaDetalle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VentaDetalleRepository extends JpaRepository<VentaDetalle, Long> {
    List<VentaDetalle> findByVentaId(Long ventaId);
}
```

- [ ] **Paso 5: Compilar para verificar**

```
set JAVA_HOME=F:\jdk-17
cd F:\Proyectos\sae\backend
F:\Users\54347\Documents\apache-maven-3.8.4\bin\mvn compile -DskipTests -s settings-local.xml
```
Esperado: BUILD SUCCESS

- [ ] **Paso 6: Commit**

```
git add backend/src/main/java/com/taller/sae/repository/
git commit -m "feat(fase2): agregar repositories de presupuesto y venta"
```

---

## Task 4: VentaService

**Files:**
- Create: `backend/src/main/java/com/taller/sae/service/VentaService.java`

- [ ] **Paso 1: Crear VentaService.java**

```java
package com.taller.sae.service;

import com.taller.sae.dto.VentaDetalleRequest;
import com.taller.sae.dto.VentaRequest;
import com.taller.sae.dto.VentaResponse;
import com.taller.sae.entity.*;
import com.taller.sae.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VentaService {

    private final VentaRepository ventaRepository;
    private final VentaDetalleRepository ventaDetalleRepository;
    private final ProductoRepository productoRepository;
    private final StockRepository stockRepository;
    private final StockMovimientoRepository movimientoRepository;

    // ─── Listar ─────────────────────────────────────────────────────────────

    public List<VentaResponse> listar() {
        return ventaRepository.findAllByOrderByNumeroDesc().stream()
                .map(v -> {
                    List<VentaDetalle> detalles = ventaDetalleRepository.findByVentaId(v.getId());
                    return VentaResponse.from(v, detalles);
                })
                .toList();
    }

    // ─── Obtener ─────────────────────────────────────────────────────────────

    public VentaResponse obtener(Long id) {
        Venta venta = buscarOLanzar(id);
        List<VentaDetalle> detalles = ventaDetalleRepository.findByVentaId(id);
        return VentaResponse.from(venta, detalles);
    }

    // ─── Crear (directa, sin presupuesto origen) ─────────────────────────────

    @Transactional
    public VentaResponse crear(VentaRequest request) {
        return crearInterno(request, null);
    }

    // ─── Crear desde conversión de presupuesto ───────────────────────────────

    @Transactional
    VentaResponse crearDesdePresupuesto(VentaRequest request, Long presupuestoId) {
        return crearInterno(request, presupuestoId);
    }

    // ─── Anular ──────────────────────────────────────────────────────────────

    @Transactional
    public void anular(Long id) {
        Venta venta = buscarOLanzar(id);

        if (!"ACTIVA".equals(venta.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Solo se puede anular una venta ACTIVA");
        }

        List<VentaDetalle> detalles = ventaDetalleRepository.findByVentaId(id);

        for (VentaDetalle det : detalles) {
            if ("PRODUCTO".equals(det.getTipoItem()) && det.getProductoId() != null) {
                Producto producto = productoRepository.findById(det.getProductoId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "Producto no encontrado: " + det.getProductoId()));

                Stock stock = stockRepository.findByProductoId(det.getProductoId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "Stock no encontrado para producto: " + det.getProductoId()));

                double stockAntes = stock.getCantidadActual();
                double stockDespues = stockAntes + det.getCantidad();
                stock.setCantidadActual(stockDespues);
                stockRepository.save(stock);

                registrarMovimiento(producto, "ENTRADA", det.getCantidad(),
                        stockAntes, stockDespues, venta.getId(),
                        "Anulación venta #" + venta.getNumero());
            }
        }

        venta.setEstado("ANULADA");
        ventaRepository.save(venta);
    }

    // ─── Lógica interna de creación ──────────────────────────────────────────

    private VentaResponse crearInterno(VentaRequest request, Long presupuestoId) {
        // 1. Validar stock de todos los ítems PRODUCTO antes de escribir nada
        for (VentaDetalleRequest det : request.detalles()) {
            if ("PRODUCTO".equals(det.tipoItem()) && det.productoId() != null) {
                Stock stock = stockRepository.findByProductoId(det.productoId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "Stock no encontrado para producto: " + det.productoId()));

                if (stock.getCantidadActual() < det.cantidad()) {
                    Producto p = productoRepository.findById(det.productoId())
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                    "Producto no encontrado: " + det.productoId()));
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Stock insuficiente para: " + p.getNombre()
                                    + ". Disponible: " + stock.getCantidadActual()
                                    + ", Requerido: " + det.cantidad());
                }
            }
        }

        // 2. Calcular número
        Integer maxNumero = ventaRepository.findMaxNumero();
        int nextNumero = (maxNumero == null ? 0 : maxNumero) + 1;

        // 3. Calcular totales
        double subtotalNeto = 0;
        double totalIva = 0;
        for (VentaDetalleRequest det : request.detalles()) {
            double itemSn = det.cantidad() * det.precioUnitarioNeto();
            subtotalNeto += itemSn;
            totalIva += itemSn * det.alicuotaIva() / 100.0;
        }
        double total = subtotalNeto + totalIva;

        // 4. Guardar venta
        Venta venta = new Venta();
        venta.setNumero(String.valueOf(nextNumero));
        venta.setClienteNombre(request.clienteNombre());
        venta.setPresupuestoId(presupuestoId);
        venta.setFecha(request.fecha() != null ? request.fecha() : LocalDate.now().toString());
        venta.setEstado("ACTIVA");
        venta.setFormaPago("EFECTIVO");
        venta.setSubtotalNeto(subtotalNeto);
        venta.setTotalIva(totalIva);
        venta.setTotal(total);
        ventaRepository.save(venta);

        // 5. Guardar detalles y descontar stock
        List<VentaDetalle> detallesSaved = new ArrayList<>();
        for (VentaDetalleRequest det : request.detalles()) {
            double precioUnitario = det.precioUnitarioNeto() * (1 + det.alicuotaIva() / 100.0);
            double itemSn = det.cantidad() * det.precioUnitarioNeto();
            double itemSubtotal = det.cantidad() * precioUnitario;

            VentaDetalle detalle = new VentaDetalle();
            detalle.setVenta(venta);
            detalle.setProductoId(det.productoId());
            detalle.setTipoItem(det.tipoItem());
            detalle.setDescripcionItem(det.descripcionItem());
            detalle.setCantidad(det.cantidad());
            detalle.setPrecioUnitarioNeto(det.precioUnitarioNeto());
            detalle.setAlicuotaIva(det.alicuotaIva());
            detalle.setPrecioUnitario(precioUnitario);
            detalle.setSubtotalNeto(itemSn);
            detalle.setSubtotal(itemSubtotal);

            if ("PRODUCTO".equals(det.tipoItem()) && det.productoId() != null) {
                Producto producto = productoRepository.findById(det.productoId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "Producto no encontrado: " + det.productoId()));

                detalle.setPrecioCostoUnitario(producto.getPrecioCostoNeto());

                Stock stock = stockRepository.findByProductoId(det.productoId()).get();
                double stockAntes = stock.getCantidadActual();
                double stockDespues = stockAntes - det.cantidad();
                stock.setCantidadActual(stockDespues);
                stockRepository.save(stock);

                registrarMovimiento(producto, "SALIDA", det.cantidad(),
                        stockAntes, stockDespues, venta.getId(),
                        "Venta #" + venta.getNumero());
            }

            ventaDetalleRepository.save(detalle);
            detallesSaved.add(detalle);
        }

        return VentaResponse.from(venta, detallesSaved);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Venta buscarOLanzar(Long id) {
        return ventaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Venta no encontrada: " + id));
    }

    private void registrarMovimiento(Producto producto, String tipo, Double cantidad,
                                     Double stockAntes, Double stockDespues,
                                     Long ventaId, String observacion) {
        StockMovimiento mov = new StockMovimiento();
        mov.setProducto(producto);
        mov.setTipo(tipo);
        mov.setCantidad(cantidad);
        mov.setStockAntes(stockAntes);
        mov.setStockDespues(stockDespues);
        mov.setVentaId(ventaId);
        mov.setFecha(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        mov.setObservacion(observacion);
        movimientoRepository.save(mov);
    }
}
```

- [ ] **Paso 2: Compilar para verificar**

```
set JAVA_HOME=F:\jdk-17
cd F:\Proyectos\sae\backend
F:\Users\54347\Documents\apache-maven-3.8.4\bin\mvn compile -DskipTests -s settings-local.xml
```
Esperado: BUILD SUCCESS

- [ ] **Paso 3: Commit**

```
git add backend/src/main/java/com/taller/sae/service/VentaService.java
git commit -m "feat(fase2): agregar VentaService con lógica de stock"
```

---

## Task 5: PresupuestoService

**Files:**
- Create: `backend/src/main/java/com/taller/sae/service/PresupuestoService.java`

- [ ] **Paso 1: Crear PresupuestoService.java**

```java
package com.taller.sae.service;

import com.taller.sae.dto.*;
import com.taller.sae.entity.Presupuesto;
import com.taller.sae.entity.PresupuestoDetalle;
import com.taller.sae.repository.PresupuestoDetalleRepository;
import com.taller.sae.repository.PresupuestoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PresupuestoService {

    private final PresupuestoRepository presupuestoRepository;
    private final PresupuestoDetalleRepository presupuestoDetalleRepository;
    private final VentaService ventaService;

    // ─── Listar ─────────────────────────────────────────────────────────────

    public List<PresupuestoResponse> listar() {
        return presupuestoRepository.findAllByOrderByNumeroDesc().stream()
                .map(p -> {
                    List<PresupuestoDetalle> detalles = presupuestoDetalleRepository.findByPresupuestoId(p.getId());
                    return PresupuestoResponse.from(p, detalles);
                })
                .toList();
    }

    // ─── Obtener ─────────────────────────────────────────────────────────────

    public PresupuestoResponse obtener(Long id) {
        Presupuesto presupuesto = buscarOLanzar(id);
        List<PresupuestoDetalle> detalles = presupuestoDetalleRepository.findByPresupuestoId(id);
        return PresupuestoResponse.from(presupuesto, detalles);
    }

    // ─── Crear ──────────────────────────────────────────────────────────────

    @Transactional
    public PresupuestoResponse crear(PresupuestoRequest request) {
        Integer maxNumero = presupuestoRepository.findMaxNumero();
        int nextNumero = (maxNumero == null ? 0 : maxNumero) + 1;

        Presupuesto presupuesto = new Presupuesto();
        presupuesto.setNumero(String.valueOf(nextNumero));
        presupuesto.setClienteNombre(request.clienteNombre());
        presupuesto.setFecha(request.fecha() != null ? request.fecha() : LocalDate.now().toString());
        presupuesto.setEstado("BORRADOR");

        calcularTotales(presupuesto, request.detalles());
        presupuestoRepository.save(presupuesto);

        List<PresupuestoDetalle> detalles = crearDetalles(presupuesto, request.detalles());
        return PresupuestoResponse.from(presupuesto, detalles);
    }

    // ─── Editar ──────────────────────────────────────────────────────────────

    @Transactional
    public PresupuestoResponse editar(Long id, PresupuestoRequest request) {
        Presupuesto presupuesto = buscarOLanzar(id);

        if (!"BORRADOR".equals(presupuesto.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Solo se puede editar un presupuesto en estado BORRADOR");
        }

        presupuesto.setClienteNombre(request.clienteNombre());
        if (request.fecha() != null) {
            presupuesto.setFecha(request.fecha());
        }

        presupuestoDetalleRepository.deleteByPresupuestoId(id);
        calcularTotales(presupuesto, request.detalles());
        presupuestoRepository.save(presupuesto);

        List<PresupuestoDetalle> detalles = crearDetalles(presupuesto, request.detalles());
        return PresupuestoResponse.from(presupuesto, detalles);
    }

    // ─── Eliminar ────────────────────────────────────────────────────────────

    @Transactional
    public void eliminar(Long id) {
        Presupuesto presupuesto = buscarOLanzar(id);

        if (!"BORRADOR".equals(presupuesto.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Solo se puede eliminar un presupuesto en estado BORRADOR");
        }

        presupuestoDetalleRepository.deleteByPresupuestoId(id);
        presupuestoRepository.delete(presupuesto);
    }

    // ─── Confirmar ───────────────────────────────────────────────────────────

    @Transactional
    public PresupuestoResponse confirmar(Long id) {
        Presupuesto presupuesto = buscarOLanzar(id);

        if (!"BORRADOR".equals(presupuesto.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Solo se puede confirmar un presupuesto en estado BORRADOR");
        }

        presupuesto.setEstado("CONFIRMADO");
        presupuestoRepository.save(presupuesto);

        List<PresupuestoDetalle> detalles = presupuestoDetalleRepository.findByPresupuestoId(id);
        return PresupuestoResponse.from(presupuesto, detalles);
    }

    // ─── Convertir a venta ───────────────────────────────────────────────────

    @Transactional
    public VentaResponse convertir(Long id) {
        Presupuesto presupuesto = buscarOLanzar(id);

        if (!"CONFIRMADO".equals(presupuesto.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Solo se puede convertir un presupuesto CONFIRMADO");
        }

        List<PresupuestoDetalle> detalles = presupuestoDetalleRepository.findByPresupuestoId(id);

        List<VentaDetalleRequest> detalleRequests = detalles.stream()
                .map(d -> new VentaDetalleRequest(
                        d.getProductoId(),
                        d.getTipoItem(),
                        d.getDescripcionItem(),
                        d.getCantidad(),
                        d.getPrecioUnitarioNeto(),
                        d.getAlicuotaIva()
                ))
                .toList();

        VentaRequest ventaRequest = new VentaRequest(
                presupuesto.getClienteNombre(),
                presupuesto.getFecha(),
                detalleRequests
        );

        VentaResponse ventaResponse = ventaService.crearDesdePresupuesto(ventaRequest, presupuesto.getId());

        presupuesto.setEstado("CONVERTIDO");
        presupuesto.setVentaId(ventaResponse.id());
        presupuestoRepository.save(presupuesto);

        return ventaResponse;
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Presupuesto buscarOLanzar(Long id) {
        return presupuestoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Presupuesto no encontrado: " + id));
    }

    private void calcularTotales(Presupuesto presupuesto, List<PresupuestoDetalleRequest> detalles) {
        double subtotalNeto = 0;
        double totalIva = 0;
        for (PresupuestoDetalleRequest det : detalles) {
            double itemSn = det.cantidad() * det.precioUnitarioNeto();
            subtotalNeto += itemSn;
            totalIva += itemSn * det.alicuotaIva() / 100.0;
        }
        presupuesto.setSubtotalNeto(subtotalNeto);
        presupuesto.setTotalIva(totalIva);
        presupuesto.setTotal(subtotalNeto + totalIva);
    }

    private List<PresupuestoDetalle> crearDetalles(Presupuesto presupuesto,
                                                    List<PresupuestoDetalleRequest> requests) {
        List<PresupuestoDetalle> resultado = new ArrayList<>();
        for (PresupuestoDetalleRequest req : requests) {
            double precioUnitario = req.precioUnitarioNeto() * (1 + req.alicuotaIva() / 100.0);
            double itemSn = req.cantidad() * req.precioUnitarioNeto();
            double itemSubtotal = req.cantidad() * precioUnitario;

            PresupuestoDetalle detalle = new PresupuestoDetalle();
            detalle.setPresupuesto(presupuesto);
            detalle.setProductoId(req.productoId());
            detalle.setTipoItem(req.tipoItem());
            detalle.setDescripcionItem(req.descripcionItem());
            detalle.setCantidad(req.cantidad());
            detalle.setPrecioUnitarioNeto(req.precioUnitarioNeto());
            detalle.setAlicuotaIva(req.alicuotaIva());
            detalle.setPrecioUnitario(precioUnitario);
            detalle.setSubtotalNeto(itemSn);
            detalle.setSubtotal(itemSubtotal);

            presupuestoDetalleRepository.save(detalle);
            resultado.add(detalle);
        }
        return resultado;
    }
}
```

- [ ] **Paso 2: Compilar para verificar**

```
set JAVA_HOME=F:\jdk-17
cd F:\Proyectos\sae\backend
F:\Users\54347\Documents\apache-maven-3.8.4\bin\mvn compile -DskipTests -s settings-local.xml
```
Esperado: BUILD SUCCESS

- [ ] **Paso 3: Commit**

```
git add backend/src/main/java/com/taller/sae/service/PresupuestoService.java
git commit -m "feat(fase2): agregar PresupuestoService con estados y conversión a venta"
```

---

## Task 6: Controllers

**Files:**
- Create: `backend/src/main/java/com/taller/sae/controller/PresupuestoController.java`
- Create: `backend/src/main/java/com/taller/sae/controller/VentaController.java`

- [ ] **Paso 1: Crear PresupuestoController.java**

```java
package com.taller.sae.controller;

import com.taller.sae.dto.PresupuestoRequest;
import com.taller.sae.dto.PresupuestoResponse;
import com.taller.sae.dto.VentaResponse;
import com.taller.sae.service.PresupuestoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/presupuestos")
@RequiredArgsConstructor
public class PresupuestoController {

    private final PresupuestoService presupuestoService;

    @GetMapping
    public List<PresupuestoResponse> listar() {
        return presupuestoService.listar();
    }

    @GetMapping("/{id}")
    public PresupuestoResponse obtener(@PathVariable Long id) {
        return presupuestoService.obtener(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PresupuestoResponse crear(@Valid @RequestBody PresupuestoRequest request) {
        return presupuestoService.crear(request);
    }

    @PutMapping("/{id}")
    public PresupuestoResponse editar(@PathVariable Long id,
                                      @Valid @RequestBody PresupuestoRequest request) {
        return presupuestoService.editar(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        presupuestoService.eliminar(id);
    }

    @PostMapping("/{id}/confirmar")
    public PresupuestoResponse confirmar(@PathVariable Long id) {
        return presupuestoService.confirmar(id);
    }

    @PostMapping("/{id}/convertir")
    @ResponseStatus(HttpStatus.CREATED)
    public VentaResponse convertir(@PathVariable Long id) {
        return presupuestoService.convertir(id);
    }
}
```

- [ ] **Paso 2: Crear VentaController.java**

```java
package com.taller.sae.controller;

import com.taller.sae.dto.VentaRequest;
import com.taller.sae.dto.VentaResponse;
import com.taller.sae.service.VentaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ventas")
@RequiredArgsConstructor
public class VentaController {

    private final VentaService ventaService;

    @GetMapping
    public List<VentaResponse> listar() {
        return ventaService.listar();
    }

    @GetMapping("/{id}")
    public VentaResponse obtener(@PathVariable Long id) {
        return ventaService.obtener(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VentaResponse crear(@Valid @RequestBody VentaRequest request) {
        return ventaService.crear(request);
    }

    @PostMapping("/{id}/anular")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void anular(@PathVariable Long id) {
        ventaService.anular(id);
    }
}
```

- [ ] **Paso 3: Compilar todo el backend**

```
set JAVA_HOME=F:\jdk-17
cd F:\Proyectos\sae\backend
F:\Users\54347\Documents\apache-maven-3.8.4\bin\mvn compile -DskipTests -s settings-local.xml
```
Esperado: BUILD SUCCESS

- [ ] **Paso 4: Prueba manual — levantar el backend y crear un presupuesto**

Arrancar: `java -DJAVA_HOME=F:\jdk-17 -jar target/sae-0.0.1-SNAPSHOT.jar` (o desde el IDE)

Obtener token:
```
POST http://localhost:8080/auth/login
{"username": "admin", "password": "admin123"}
```

Crear presupuesto:
```
POST http://localhost:8080/presupuestos
Authorization: Bearer <token>
{
  "clienteNombre": "Juan Pérez",
  "detalles": [{
    "tipoItem": "SERVICIO",
    "descripcionItem": "Servicio de prueba",
    "cantidad": 1,
    "precioUnitarioNeto": 100.0,
    "alicuotaIva": 21
  }]
}
```
Esperado: 201 Created con numero="1", estado="BORRADOR"

- [ ] **Paso 5: Commit**

```
git add backend/src/main/java/com/taller/sae/controller/
git commit -m "feat(fase2): agregar PresupuestoController y VentaController"
```

---

## Task 7: Frontend — Tipos y servicios

**Files:**
- Modify: `frontend/src/types/index.ts`
- Create: `frontend/src/services/presupuestos.ts`
- Create: `frontend/src/services/ventas.ts`

- [ ] **Paso 1: Agregar tipos en types/index.ts**

Agregar al final del archivo `frontend/src/types/index.ts`:

```typescript
export interface PresupuestoDetalle {
  id: number
  productoId: number | null
  tipoItem: TipoItem
  descripcionItem: string
  cantidad: number
  precioUnitarioNeto: number
  alicuotaIva: number
  precioUnitario: number
  subtotalNeto: number
  subtotal: number
}

export interface Presupuesto {
  id: number
  numero: string
  clienteNombre: string
  fecha: string
  estado: EstadoPresupuesto
  ventaId: number | null
  detalles: PresupuestoDetalle[]
  subtotalNeto: number
  totalIva: number
  total: number
}

export interface VentaDetalle {
  id: number
  productoId: number | null
  tipoItem: TipoItem
  descripcionItem: string
  cantidad: number
  precioUnitarioNeto: number
  alicuotaIva: number
  precioUnitario: number
  subtotalNeto: number
  subtotal: number
}

export interface Venta {
  id: number
  numero: string
  clienteNombre: string
  presupuestoId: number | null
  fecha: string
  estado: EstadoVenta
  formaPago: string
  detalles: VentaDetalle[]
  subtotalNeto: number
  totalIva: number
  total: number
}
```

- [ ] **Paso 2: Crear frontend/src/services/presupuestos.ts**

```typescript
import api from './api'
import type { Presupuesto, Venta } from '@/types'

export interface DetalleRequest {
  productoId?: number
  tipoItem: 'PRODUCTO' | 'SERVICIO'
  descripcionItem: string
  cantidad: number
  precioUnitarioNeto: number
  alicuotaIva: number
}

export interface PresupuestoRequest {
  clienteNombre: string
  fecha?: string
  detalles: DetalleRequest[]
}

export const presupuestosService = {
  listar: () =>
    api.get<Presupuesto[]>('/presupuestos').then(r => r.data),

  obtener: (id: number) =>
    api.get<Presupuesto>(`/presupuestos/${id}`).then(r => r.data),

  crear: (data: PresupuestoRequest) =>
    api.post<Presupuesto>('/presupuestos', data).then(r => r.data),

  editar: (id: number, data: PresupuestoRequest) =>
    api.put<Presupuesto>(`/presupuestos/${id}`, data).then(r => r.data),

  eliminar: (id: number) =>
    api.delete(`/presupuestos/${id}`),

  confirmar: (id: number) =>
    api.post<Presupuesto>(`/presupuestos/${id}/confirmar`).then(r => r.data),

  convertir: (id: number) =>
    api.post<Venta>(`/presupuestos/${id}/convertir`).then(r => r.data),
}
```

- [ ] **Paso 3: Crear frontend/src/services/ventas.ts**

```typescript
import api from './api'
import type { Venta } from '@/types'
import type { DetalleRequest } from './presupuestos'

export interface VentaRequest {
  clienteNombre: string
  fecha?: string
  detalles: DetalleRequest[]
}

export const ventasService = {
  listar: () =>
    api.get<Venta[]>('/ventas').then(r => r.data),

  obtener: (id: number) =>
    api.get<Venta>(`/ventas/${id}`).then(r => r.data),

  crear: (data: VentaRequest) =>
    api.post<Venta>('/ventas', data).then(r => r.data),

  anular: (id: number) =>
    api.post(`/ventas/${id}/anular`),
}
```

- [ ] **Paso 4: Verificar TypeScript**

```
cd F:\Proyectos\sae\frontend
npm run build
```
Esperado: sin errores de TypeScript

- [ ] **Paso 5: Commit**

```
git add frontend/src/types/index.ts
git add frontend/src/services/presupuestos.ts
git add frontend/src/services/ventas.ts
git commit -m "feat(fase2): agregar tipos y servicios frontend para presupuestos y ventas"
```

---

## Task 8: Frontend — Navegación y rutas

**Files:**
- Modify: `frontend/src/components/layout/AppLayout.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Paso 1: Actualizar AppLayout.tsx**

En `frontend/src/components/layout/AppLayout.tsx`:

1. Agregar `FileText, ShoppingCart` al import de lucide-react:
```typescript
import { Package, LayoutDashboard, LogOut, FileText, ShoppingCart } from 'lucide-react'
```

2. Actualizar NAV_ITEMS:
```typescript
const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/productos', label: 'Productos', icon: Package },
  { path: '/presupuestos', label: 'Presupuestos', icon: FileText },
  { path: '/ventas', label: 'Ventas', icon: ShoppingCart },
]
```

- [ ] **Paso 2: Actualizar App.tsx**

Reemplazar el contenido completo de `frontend/src/App.tsx`:

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import ProtectedRoute from '@/components/ProtectedRoute'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import ProductosPage from '@/pages/ProductosPage'
import PresupuestosPage from '@/pages/PresupuestosPage'
import PresupuestoFormPage from '@/pages/PresupuestoFormPage'
import VentasPage from '@/pages/VentasPage'
import VentaFormPage from '@/pages/VentaFormPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        } />

        <Route path="/productos" element={
          <ProtectedRoute><ProductosPage /></ProtectedRoute>
        } />

        <Route path="/presupuestos" element={
          <ProtectedRoute><PresupuestosPage /></ProtectedRoute>
        } />

        <Route path="/presupuestos/nuevo" element={
          <ProtectedRoute><PresupuestoFormPage /></ProtectedRoute>
        } />

        <Route path="/presupuestos/:id/editar" element={
          <ProtectedRoute><PresupuestoFormPage /></ProtectedRoute>
        } />

        <Route path="/ventas" element={
          <ProtectedRoute><VentasPage /></ProtectedRoute>
        } />

        <Route path="/ventas/nueva" element={
          <ProtectedRoute><VentaFormPage /></ProtectedRoute>
        } />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      <Toaster />
    </BrowserRouter>
  )
}

export default App
```

Nota: Los imports de PresupuestosPage, PresupuestoFormPage, VentasPage y VentaFormPage fallarán hasta que se creen esos archivos en los tasks siguientes. El `npm run build` final del task 13 validará todo junto.

- [ ] **Paso 3: Commit**

```
git add frontend/src/components/layout/AppLayout.tsx
git add frontend/src/App.tsx
git commit -m "feat(fase2): agregar Presupuestos y Ventas al sidebar y al router"
```

---

## Task 9: Frontend — ProductoSelectorModal

**Files:**
- Create: `frontend/src/components/presupuestos/ProductoSelectorModal.tsx`

- [ ] **Paso 1: Crear ProductoSelectorModal.tsx**

```typescript
import { useState, useEffect, useMemo } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { productosService } from '@/services/productos'
import type { Producto } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (producto: Producto) => void
}

export function ProductoSelectorModal({ open, onClose, onSelect }: Props) {
  const [productos, setProductos] = useState<Producto[]>([])
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    if (open) {
      productosService.listar().then(setProductos).catch(() => {})
      setBusqueda('')
    }
  }, [open])

  const filtrados = useMemo(() => {
    if (!busqueda) return productos
    const q = busqueda.toLowerCase()
    return productos.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      (p.codigo ?? '').toLowerCase().includes(q) ||
      (p.marca ?? '').toLowerCase().includes(q)
    )
  }, [productos, busqueda])

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Seleccionar producto</DialogTitle>
        </DialogHeader>

        <Input
          placeholder="Buscar por nombre, código o marca..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          autoFocus
        />

        <div className="max-h-96 overflow-auto mt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map(p => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => { onSelect(p); onClose() }}
                >
                  <TableCell>{p.codigo ?? '-'}</TableCell>
                  <TableCell>{p.nombre}</TableCell>
                  <TableCell>{p.marca ?? '-'}</TableCell>
                  <TableCell className="text-right font-mono">${p.precioVenta.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{p.stockActual}</TableCell>
                </TableRow>
              ))}
              {filtrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-400 py-6">
                    No se encontraron productos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Paso 2: Commit**

```
git add frontend/src/components/presupuestos/ProductoSelectorModal.tsx
git commit -m "feat(fase2): agregar ProductoSelectorModal"
```

---

## Task 10: Frontend — PresupuestosPage (lista)

**Files:**
- Create: `frontend/src/pages/PresupuestosPage.tsx`

- [ ] **Paso 1: Crear PresupuestosPage.tsx**

```typescript
import { useEffect, useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { presupuestosService } from '@/services/presupuestos'
import type { Presupuesto, EstadoPresupuesto } from '@/types'
import { Plus, Pencil, CheckCircle, ArrowRightCircle, Trash2, ExternalLink } from 'lucide-react'

const BADGE: Record<EstadoPresupuesto, string> = {
  BORRADOR: 'bg-slate-200 text-slate-700',
  CONFIRMADO: 'bg-blue-100 text-blue-700',
  CONVERTIDO: 'bg-green-100 text-green-700',
}

function PresupuestosPage() {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<EstadoPresupuesto | 'TODOS'>('TODOS')
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => { cargar() }, [])

  async function cargar() {
    try {
      setPresupuestos(await presupuestosService.listar())
    } catch {
      toast({ title: 'Error al cargar presupuestos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const filtrados = useMemo(() =>
    presupuestos
      .filter(p => filtroEstado === 'TODOS' || p.estado === filtroEstado)
      .filter(p => {
        if (!busqueda) return true
        const q = busqueda.toLowerCase()
        return p.clienteNombre.toLowerCase().includes(q) || p.numero.includes(q)
      }),
    [presupuestos, busqueda, filtroEstado]
  )

  function errMsg(err: unknown) {
    return (err as { response?: { data?: { message?: string } } })
      ?.response?.data?.message ?? 'Error'
  }

  async function handleConfirmar(id: number) {
    try {
      const actualizado = await presupuestosService.confirmar(id)
      setPresupuestos(prev => prev.map(p => p.id === id ? { ...p, estado: actualizado.estado } : p))
      toast({ title: 'Presupuesto confirmado' })
    } catch (err) {
      toast({ title: errMsg(err), variant: 'destructive' })
    }
  }

  async function handleConvertir(id: number) {
    try {
      const venta = await presupuestosService.convertir(id)
      await cargar()
      toast({ title: `Venta #${venta.numero} creada` })
    } catch (err) {
      toast({ title: errMsg(err), variant: 'destructive' })
    }
  }

  async function handleEliminar(id: number) {
    if (!confirm('¿Eliminar este presupuesto?')) return
    try {
      await presupuestosService.eliminar(id)
      setPresupuestos(prev => prev.filter(p => p.id !== id))
      toast({ title: 'Presupuesto eliminado' })
    } catch (err) {
      toast({ title: errMsg(err), variant: 'destructive' })
    }
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Presupuestos</h1>
          <Button onClick={() => navigate('/presupuestos/nuevo')}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo presupuesto
          </Button>
        </div>

        <div className="flex gap-3 mb-4">
          <Input
            placeholder="Buscar por cliente o número..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="max-w-sm"
          />
          <Select
            value={filtroEstado}
            onValueChange={v => setFiltroEstado(v as EstadoPresupuesto | 'TODOS')}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los estados</SelectItem>
              <SelectItem value="BORRADOR">Borrador</SelectItem>
              <SelectItem value="CONFIRMADO">Confirmado</SelectItem>
              <SelectItem value="CONVERTIDO">Convertido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nro</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-slate-600">#{p.numero}</TableCell>
                  <TableCell>{p.clienteNombre}</TableCell>
                  <TableCell>{p.fecha}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${BADGE[p.estado]}`}>
                      {p.estado}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">${p.total.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {p.estado === 'BORRADOR' && (
                        <>
                          <Button size="sm" variant="ghost"
                            onClick={() => navigate(`/presupuestos/${p.id}/editar`)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleConfirmar(p.id)}>
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleEliminar(p.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      )}
                      {p.estado === 'CONFIRMADO' && (
                        <Button size="sm" variant="outline" onClick={() => handleConvertir(p.id)}>
                          <ArrowRightCircle className="h-4 w-4 mr-1 text-green-600" />
                          Convertir a venta
                        </Button>
                      )}
                      {p.estado === 'CONVERTIDO' && (
                        <Link to="/ventas">
                          <Button size="sm" variant="ghost" title="Ver venta generada">
                            <ExternalLink className="h-4 w-4 text-slate-400" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtrados.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-400 py-10">
                    No hay presupuestos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </AppLayout>
  )
}

export default PresupuestosPage
```

- [ ] **Paso 2: Commit**

```
git add frontend/src/pages/PresupuestosPage.tsx
git commit -m "feat(fase2): agregar PresupuestosPage (lista con acciones por estado)"
```

---

## Task 11: Frontend — PresupuestoFormPage

**Files:**
- Create: `frontend/src/pages/PresupuestoFormPage.tsx`

- [ ] **Paso 1: Crear PresupuestoFormPage.tsx**

```typescript
import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import { ProductoSelectorModal } from '@/components/presupuestos/ProductoSelectorModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { presupuestosService } from '@/services/presupuestos'
import type { Producto } from '@/types'
import { Trash2, Plus } from 'lucide-react'

interface ItemRow {
  key: string
  productoId?: number
  tipoItem: 'PRODUCTO' | 'SERVICIO'
  descripcionItem: string
  cantidad: number
  precioUnitarioNeto: number
  alicuotaIva: number
}

function nuevaFila(): ItemRow {
  return {
    key: Math.random().toString(36).slice(2),
    tipoItem: 'SERVICIO',
    descripcionItem: '',
    cantidad: 1,
    precioUnitarioNeto: 0,
    alicuotaIva: 21,
  }
}

function PresupuestoFormPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const isEdit = !!id

  const [clienteNombre, setClienteNombre] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [items, setItems] = useState<ItemRow[]>([])
  const [numero, setNumero] = useState<string | null>(null)
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    presupuestosService.obtener(Number(id))
      .then(p => {
        setClienteNombre(p.clienteNombre)
        setFecha(p.fecha)
        setNumero(p.numero)
        setItems(p.detalles.map(d => ({
          key: String(d.id),
          productoId: d.productoId ?? undefined,
          tipoItem: d.tipoItem,
          descripcionItem: d.descripcionItem,
          cantidad: d.cantidad,
          precioUnitarioNeto: d.precioUnitarioNeto,
          alicuotaIva: d.alicuotaIva,
        })))
      })
      .catch(() => {
        toast({ title: 'Error al cargar presupuesto', variant: 'destructive' })
        navigate('/presupuestos')
      })
  }, [id])

  const { subtotalNeto, totalIva, total } = useMemo(() => {
    let sn = 0, iv = 0
    for (const item of items) {
      const itemSn = item.cantidad * item.precioUnitarioNeto
      sn += itemSn
      iv += itemSn * item.alicuotaIva / 100
    }
    return { subtotalNeto: sn, totalIva: iv, total: sn + iv }
  }, [items])

  function addProducto(producto: Producto) {
    setItems(prev => [...prev, {
      key: Math.random().toString(36).slice(2),
      productoId: producto.id,
      tipoItem: 'PRODUCTO',
      descripcionItem: producto.nombre,
      cantidad: 1,
      precioUnitarioNeto: producto.precioVentaNeto,
      alicuotaIva: producto.alicuotaIva,
    }])
  }

  function updateItem(key: string, field: keyof ItemRow, value: string | number) {
    setItems(prev => prev.map(item => item.key === key ? { ...item, [field]: value } : item))
  }

  function removeItem(key: string) {
    setItems(prev => prev.filter(item => item.key !== key))
  }

  async function guardar(confirmar: boolean) {
    if (!clienteNombre.trim()) {
      toast({ title: 'El nombre del cliente es obligatorio', variant: 'destructive' })
      return
    }
    if (items.length === 0) {
      toast({ title: 'Agregue al menos un ítem', variant: 'destructive' })
      return
    }

    const request = {
      clienteNombre,
      fecha,
      detalles: items.map(item => ({
        productoId: item.productoId,
        tipoItem: item.tipoItem,
        descripcionItem: item.descripcionItem,
        cantidad: item.cantidad,
        precioUnitarioNeto: item.precioUnitarioNeto,
        alicuotaIva: item.alicuotaIva,
      })),
    }

    setSaving(true)
    try {
      let saved = isEdit
        ? await presupuestosService.editar(Number(id), request)
        : await presupuestosService.crear(request)

      if (confirmar) {
        saved = await presupuestosService.confirmar(saved.id)
      }

      toast({ title: isEdit ? 'Presupuesto actualizado' : 'Presupuesto creado' })
      navigate('/presupuestos')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Error al guardar'
      toast({ title: msg, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">
          {isEdit ? `Editar presupuesto${numero ? ` #${numero}` : ''}` : 'Nuevo presupuesto'}
        </h1>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <Label>Nro</Label>
            <Input value={numero ?? 'Automático'} readOnly className="bg-slate-100" />
          </div>
          <div>
            <Label>Fecha</Label>
            <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>
          <div>
            <Label>Cliente *</Label>
            <Input
              placeholder="Nombre del cliente"
              value={clienteNombre}
              onChange={e => setClienteNombre(e.target.value)}
            />
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden mb-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead className="w-24">Cant.</TableHead>
                <TableHead className="w-36">Precio neto</TableHead>
                <TableHead className="w-24">IVA %</TableHead>
                <TableHead className="w-32 text-right">Subtotal</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => {
                const precioConIva = item.precioUnitarioNeto * (1 + item.alicuotaIva / 100)
                const subtotal = item.cantidad * precioConIva
                return (
                  <TableRow key={item.key}>
                    <TableCell>
                      <Input
                        value={item.descripcionItem}
                        onChange={e => updateItem(item.key, 'descripcionItem', e.target.value)}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number" min={0.01} step={0.01}
                        value={item.cantidad}
                        onChange={e => updateItem(item.key, 'cantidad', parseFloat(e.target.value) || 0)}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number" min={0} step={0.01}
                        value={item.precioUnitarioNeto}
                        onChange={e => updateItem(item.key, 'precioUnitarioNeto', parseFloat(e.target.value) || 0)}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={String(item.alicuotaIva)}
                        onValueChange={v => updateItem(item.key, 'alicuotaIva', Number(v))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="10">10.5%</SelectItem>
                          <SelectItem value="21">21%</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      ${subtotal.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => removeItem(item.key)}>
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                    Sin ítems. Use los botones de abajo para agregar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex gap-2 mb-6">
          <Button variant="outline" size="sm" onClick={() => setSelectorOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Producto
          </Button>
          <Button variant="outline" size="sm" onClick={() => setItems(prev => [...prev, nuevaFila()])}>
            <Plus className="h-4 w-4 mr-1" /> Servicio
          </Button>
        </div>

        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal neto:</span>
              <span className="font-mono">${subtotalNeto.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>IVA:</span>
              <span className="font-mono">${totalIva.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base border-t pt-2">
              <span>Total:</span>
              <span className="font-mono">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate('/presupuestos')}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={() => guardar(false)} disabled={saving}>
            Guardar borrador
          </Button>
          <Button onClick={() => guardar(true)} disabled={saving}>
            Guardar y confirmar
          </Button>
        </div>
      </div>

      <ProductoSelectorModal
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={addProducto}
      />
    </AppLayout>
  )
}

export default PresupuestoFormPage
```

- [ ] **Paso 2: Commit**

```
git add frontend/src/pages/PresupuestoFormPage.tsx
git commit -m "feat(fase2): agregar PresupuestoFormPage (crear/editar presupuesto)"
```

---

## Task 12: Frontend — VentasPage (lista)

**Files:**
- Create: `frontend/src/pages/VentasPage.tsx`

- [ ] **Paso 1: Crear VentasPage.tsx**

```typescript
import { useEffect, useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { ventasService } from '@/services/ventas'
import type { Venta, EstadoVenta } from '@/types'
import { Plus, Ban } from 'lucide-react'

const BADGE: Record<EstadoVenta, string> = {
  ACTIVA: 'bg-green-100 text-green-700',
  ANULADA: 'bg-red-100 text-red-600',
}

function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<EstadoVenta | 'TODOS'>('TODOS')
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => { cargar() }, [])

  async function cargar() {
    try {
      setVentas(await ventasService.listar())
    } catch {
      toast({ title: 'Error al cargar ventas', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const filtradas = useMemo(() =>
    ventas
      .filter(v => filtroEstado === 'TODOS' || v.estado === filtroEstado)
      .filter(v => {
        if (!busqueda) return true
        const q = busqueda.toLowerCase()
        return v.clienteNombre.toLowerCase().includes(q) || v.numero.includes(q)
      }),
    [ventas, busqueda, filtroEstado]
  )

  async function handleAnular(id: number) {
    if (!confirm('¿Anular esta venta? Se revertirá el stock.')) return
    try {
      await ventasService.anular(id)
      await cargar()
      toast({ title: 'Venta anulada' })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Error al anular'
      toast({ title: msg, variant: 'destructive' })
    }
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Ventas</h1>
          <Button onClick={() => navigate('/ventas/nueva')}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva venta
          </Button>
        </div>

        <div className="flex gap-3 mb-4">
          <Input
            placeholder="Buscar por cliente o número..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="max-w-sm"
          />
          <Select
            value={filtroEstado}
            onValueChange={v => setFiltroEstado(v as EstadoVenta | 'TODOS')}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los estados</SelectItem>
              <SelectItem value="ACTIVA">Activa</SelectItem>
              <SelectItem value="ANULADA">Anulada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nro</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.map(v => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono text-slate-600">#{v.numero}</TableCell>
                  <TableCell>{v.clienteNombre}</TableCell>
                  <TableCell>
                    {v.presupuestoId ? (
                      <Link to="/presupuestos" className="text-blue-600 hover:underline text-sm">
                        Pres. #{v.presupuestoId}
                      </Link>
                    ) : (
                      <span className="text-slate-500 text-sm">Directa</span>
                    )}
                  </TableCell>
                  <TableCell>{v.fecha}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${BADGE[v.estado]}`}>
                      {v.estado}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">${v.total.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    {v.estado === 'ACTIVA' && (
                      <Button size="sm" variant="ghost" onClick={() => handleAnular(v.id)}
                        title="Anular venta">
                        <Ban className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtradas.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-400 py-10">
                    No hay ventas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </AppLayout>
  )
}

export default VentasPage
```

- [ ] **Paso 2: Commit**

```
git add frontend/src/pages/VentasPage.tsx
git commit -m "feat(fase2): agregar VentasPage (lista con anulación)"
```

---

## Task 13: Frontend — VentaFormPage

**Files:**
- Create: `frontend/src/pages/VentaFormPage.tsx`

- [ ] **Paso 1: Crear VentaFormPage.tsx**

```typescript
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import { ProductoSelectorModal } from '@/components/presupuestos/ProductoSelectorModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { ventasService } from '@/services/ventas'
import type { Producto } from '@/types'
import { Trash2, Plus } from 'lucide-react'

interface ItemRow {
  key: string
  productoId?: number
  tipoItem: 'PRODUCTO' | 'SERVICIO'
  descripcionItem: string
  cantidad: number
  precioUnitarioNeto: number
  alicuotaIva: number
}

function nuevaFila(): ItemRow {
  return {
    key: Math.random().toString(36).slice(2),
    tipoItem: 'SERVICIO',
    descripcionItem: '',
    cantidad: 1,
    precioUnitarioNeto: 0,
    alicuotaIva: 21,
  }
}

function VentaFormPage() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [clienteNombre, setClienteNombre] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [items, setItems] = useState<ItemRow[]>([])
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const { subtotalNeto, totalIva, total } = useMemo(() => {
    let sn = 0, iv = 0
    for (const item of items) {
      const itemSn = item.cantidad * item.precioUnitarioNeto
      sn += itemSn
      iv += itemSn * item.alicuotaIva / 100
    }
    return { subtotalNeto: sn, totalIva: iv, total: sn + iv }
  }, [items])

  function addProducto(producto: Producto) {
    setItems(prev => [...prev, {
      key: Math.random().toString(36).slice(2),
      productoId: producto.id,
      tipoItem: 'PRODUCTO',
      descripcionItem: producto.nombre,
      cantidad: 1,
      precioUnitarioNeto: producto.precioVentaNeto,
      alicuotaIva: producto.alicuotaIva,
    }])
  }

  function updateItem(key: string, field: keyof ItemRow, value: string | number) {
    setItems(prev => prev.map(item => item.key === key ? { ...item, [field]: value } : item))
  }

  function removeItem(key: string) {
    setItems(prev => prev.filter(item => item.key !== key))
  }

  async function handleRegistrar() {
    if (!clienteNombre.trim()) {
      toast({ title: 'El nombre del cliente es obligatorio', variant: 'destructive' })
      return
    }
    if (items.length === 0) {
      toast({ title: 'Agregue al menos un ítem', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const venta = await ventasService.crear({
        clienteNombre,
        fecha,
        detalles: items.map(item => ({
          productoId: item.productoId,
          tipoItem: item.tipoItem,
          descripcionItem: item.descripcionItem,
          cantidad: item.cantidad,
          precioUnitarioNeto: item.precioUnitarioNeto,
          alicuotaIva: item.alicuotaIva,
        })),
      })
      toast({ title: `Venta #${venta.numero} registrada` })
      navigate('/ventas')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Error al registrar'
      toast({ title: msg, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Nueva venta</h1>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <Label>Nro</Label>
            <Input value="Automático" readOnly className="bg-slate-100" />
          </div>
          <div>
            <Label>Fecha</Label>
            <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>
          <div>
            <Label>Cliente *</Label>
            <Input
              placeholder="Nombre del cliente"
              value={clienteNombre}
              onChange={e => setClienteNombre(e.target.value)}
            />
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden mb-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead className="w-24">Cant.</TableHead>
                <TableHead className="w-36">Precio neto</TableHead>
                <TableHead className="w-24">IVA %</TableHead>
                <TableHead className="w-32 text-right">Subtotal</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => {
                const precioConIva = item.precioUnitarioNeto * (1 + item.alicuotaIva / 100)
                const subtotal = item.cantidad * precioConIva
                return (
                  <TableRow key={item.key}>
                    <TableCell>
                      <Input
                        value={item.descripcionItem}
                        onChange={e => updateItem(item.key, 'descripcionItem', e.target.value)}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number" min={0.01} step={0.01}
                        value={item.cantidad}
                        onChange={e => updateItem(item.key, 'cantidad', parseFloat(e.target.value) || 0)}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number" min={0} step={0.01}
                        value={item.precioUnitarioNeto}
                        onChange={e => updateItem(item.key, 'precioUnitarioNeto', parseFloat(e.target.value) || 0)}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={String(item.alicuotaIva)}
                        onValueChange={v => updateItem(item.key, 'alicuotaIva', Number(v))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="10">10.5%</SelectItem>
                          <SelectItem value="21">21%</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      ${subtotal.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => removeItem(item.key)}>
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                    Sin ítems. Use los botones de abajo para agregar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex gap-2 mb-6">
          <Button variant="outline" size="sm" onClick={() => setSelectorOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Producto
          </Button>
          <Button variant="outline" size="sm" onClick={() => setItems(prev => [...prev, nuevaFila()])}>
            <Plus className="h-4 w-4 mr-1" /> Servicio
          </Button>
        </div>

        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal neto:</span>
              <span className="font-mono">${subtotalNeto.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>IVA:</span>
              <span className="font-mono">${totalIva.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base border-t pt-2">
              <span>Total:</span>
              <span className="font-mono">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate('/ventas')}>
            Cancelar
          </Button>
          <Button onClick={handleRegistrar} disabled={saving}>
            Registrar venta
          </Button>
        </div>
      </div>

      <ProductoSelectorModal
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={addProducto}
      />
    </AppLayout>
  )
}

export default VentaFormPage
```

- [ ] **Paso 2: Build final del frontend — verificar TypeScript**

```
cd F:\Proyectos\sae\frontend
npm run build
```
Esperado: sin errores, archivos generados en `dist/`

- [ ] **Paso 3: Prueba manual completa (flujo dorado)**

Con el backend corriendo:
1. Ir a `/presupuestos/nuevo` → crear un presupuesto con 1 producto y 1 servicio → "Guardar borrador" ✓
2. En la lista, confirmar el presupuesto → estado pasa a CONFIRMADO ✓
3. Convertir a venta → redirige a `/ventas`, venta con estado ACTIVA ✓
4. Verificar en Productos que el stock del producto bajó ✓
5. Ir a `/ventas/nueva` → registrar venta directa ✓
6. Anular la venta directa → estado ANULADA, stock se revierte ✓

- [ ] **Paso 4: Commit**

```
git add frontend/src/pages/VentaFormPage.tsx
git commit -m "feat(fase2): agregar VentaFormPage (registro directo de venta)"
```

---

## Verificación final

- [ ] `mvn compile -DskipTests` pasa sin errores
- [ ] `npm run build` pasa sin errores TypeScript
- [ ] Flujo dorado completo funciona (ver Task 13, Paso 3)
- [ ] Todos los commits están en la rama `fase2`
