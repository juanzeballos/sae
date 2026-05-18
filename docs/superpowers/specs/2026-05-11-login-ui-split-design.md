# Login UI — Split Layout Slate/Naranja

**Fecha:** 2026-05-11  
**Archivo afectado:** `frontend/src/pages/LoginPage.tsx`

---

## Descripción

Rediseño visual de la pantalla de login para que sea coherente con el tema Slate + Naranja/Ámbar del sistema. Se reemplaza el card centrado sobre fondo gris claro por un layout dividido en dos paneles horizontales.

---

## Layout

La pantalla ocupa el 100% del viewport (`min-h-screen`) y se divide en dos columnas con flexbox.

### Panel izquierdo — `w-5/12` — fondo `bg-slate-800`

Centrado vertical y horizontalmente (`flex flex-col items-center justify-center`). Contiene:

| Elemento | Clases / detalle |
|---|---|
| Logo cuadrado "S" | `w-14 h-14 bg-amber-500 rounded-xl` — letra blanca, `font-bold text-2xl` |
| Título "SAE" | `text-white text-3xl font-bold` |
| Subtítulo | `text-slate-400 text-sm text-center` — "Sistema de Gestión para Taller" |
| Línea decorativa | `w-10 h-0.5 bg-amber-500 rounded my-2` |
| Tagline | `text-slate-600 text-xs text-center leading-relaxed` — "Gestioná tu stock, ventas y clientes desde un solo lugar." |

### Panel derecho — `flex-1` — fondo `bg-white`

Centrado vertical y horizontalmente. Contiene un wrapper `w-full max-w-xs` (320px):

| Elemento | Clases / detalle |
|---|---|
| Heading | `text-2xl font-bold text-slate-800` — "Bienvenido" |
| Sub-heading | `text-sm text-slate-400 mb-6` — "Ingresá tus credenciales para continuar" |
| Campo Usuario | `Label` + `Input` — igual al actual |
| Campo Contraseña | `Label` + `Input type="password"` — igual al actual |
| Error message | `text-sm text-destructive` — igual al actual, solo se muestra si hay error |
| Botón | `Button type="submit" w-full` — naranja por el `--primary` ya configurado en `index.css` |
| Footer | `text-xs text-slate-400 text-center mt-6` — "SAE · Taller v1.0" |

---

## Lo que NO cambia

- Lógica de autenticación (`useAuth`, `login()`, `loading`, `error`)
- Navegación al dashboard tras login exitoso (`navigate('/dashboard')`)
- Validación HTML nativa (`required`)
- Atributos de accesibilidad (`htmlFor`, `autoComplete`, `id`)
- Estado `disabled` en loading

---

## Archivos a modificar

| Archivo | Acción |
|---|---|
| `frontend/src/pages/LoginPage.tsx` | Reemplazar JSX del return — lógica intacta |

No se agregan dependencias ni componentes nuevos.
