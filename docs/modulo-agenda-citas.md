# Módulo 6 — Gestión de Agenda y Citas

## Descripción general

Módulo responsable del agendamiento de citas entre pacientes y fisioterapeutas, la gestión de tiempos no disponibles del personal (bloqueos), y la integración automática con el Módulo 7 (SesionSOAP) al marcar una cita como realizada.

---

## Arquitectura

```
CitaController / BloqueoAgendaController
        │
        ▼
CitaService (orquestador)          BloqueoAgendaService
  │  valida disponibilidad              CRUD bloqueos
  │  valida paciente activo
  │  enforces ownership por rol
  │
  ├── CitaRepository          (queries solapamiento)
  ├── BloqueoAgendaRepository (queries solapamiento)
  ├── PacienteRepository      (valida estado ACTIVO)
  ├── UsuarioRepository       (resuelve actor / profesional)
  ├── AuditoriaService        (registra todas las acciones)
  └── ApplicationEventPublisher
              │
              ▼ CitaRealizadaEvent (cuando estado → REALIZADA)
        SesionSOAPListener (Módulo 7 — futuro)
```

---

## Entidades JPA

### `Cita` — tabla `citas`

| Campo | Tipo | Nullable | Descripción |
|---|---|---|---|
| `id` | `Long` (PK) | NO | Auto-generado |
| `paciente` | `@ManyToOne Paciente` | NO | FK → `pacientes.id` |
| `profesional` | `@ManyToOne Usuario` | NO | FK → `usuarios.id` (rol FISIOTERAPEUTA) |
| `creadoPor` | `@ManyToOne Usuario` | NO | FK → `usuarios.id` (quien agendó) |
| `fechaHoraInicio` | `LocalDateTime` | NO | Inicio de la cita |
| `fechaHoraFin` | `LocalDateTime` | NO | Fin de la cita |
| `estado` | `EstadoCita` | NO | Default: `PROGRAMADA` |
| `motivoConsulta` | `String(500)` | NO | Descripción del motivo |
| `codigoCie10Sugerido` | `String(10)` | SÍ | Pre-diagnóstico opcional |
| `observaciones` | `String(1000)` | SÍ | Notas adicionales |
| `episodioClinicoId` | `Long` | SÍ | Contexto: episodio activo al agendar |
| `sesionGeneradaId` | `Long` | SÍ | ID SesionSOAP creada (Módulo 7) |
| `fechaCreacion` | `LocalDateTime` | NO | Audit — `@PrePersist` |
| `fechaModificacion` | `LocalDateTime` | NO | Audit — `@PreUpdate` |

### `BloqueoAgenda` — tabla `bloqueos_agenda`

| Campo | Tipo | Nullable | Descripción |
|---|---|---|---|
| `id` | `Long` (PK) | NO | Auto-generado |
| `profesional` | `@ManyToOne Usuario` | NO | FK → `usuarios.id` |
| `creadoPor` | `@ManyToOne Usuario` | NO | FK → `usuarios.id` (solo ADMIN) |
| `fechaHoraInicio` | `LocalDateTime` | NO | Inicio del bloqueo |
| `fechaHoraFin` | `LocalDateTime` | NO | Fin del bloqueo |
| `motivo` | `MotivoBloqueo` | NO | Enum del tipo de bloqueo |
| `descripcion` | `String(500)` | SÍ | Detalle libre |
| `fechaCreacion` | `LocalDateTime` | NO | Audit — `@PrePersist` |

---

## Enums

### `EstadoCita`

```
PROGRAMADA → REALIZADA
           → CANCELADA
           → NO_ASISTIDA → PROGRAMADA  (reprogramación)
```

> Una cita en estado `REALIZADA` o `CANCELADA` no puede ser modificada.

### `MotivoBloqueo`

```
VACACIONES | PERMISO | CAPACITACION | FERIADO | OTRO
```

---

## Endpoints REST

Base path: `/api/v1`

### Citas — `CitaController`

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| `POST` | `/citas` | ADMIN, FISIO | Crear cita con validación de disponibilidad |
| `GET` | `/citas` | ADMIN, FISIO | Listar citas (FISIO: solo las suyas) |
| `GET` | `/citas/{id}` | ADMIN, FISIO | Detalle de una cita |
| `PATCH` | `/citas/{id}/estado` | ADMIN, FISIO | Cambiar estado de la cita |
| `GET` | `/citas/agenda/view` | ADMIN, FISIO | Eventos en formato FullCalendar |

### Bloqueos — `BloqueoAgendaController`

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| `POST` | `/agenda/bloqueos` | ADMIN | Crear bloqueo de agenda |
| `GET` | `/agenda/bloqueos` | ADMIN, FISIO | Listar bloqueos (FISIO: solo los suyos) |
| `DELETE` | `/agenda/bloqueos/{id}` | ADMIN | Eliminar bloqueo |

---

## Seguridad por rol

| Acción | ADMINISTRADOR | FISIOTERAPEUTA |
|---|---|---|
| Crear cita para cualquier profesional | ✅ | ❌ (solo la suya) |
| Ver todas las citas | ✅ | ❌ (solo las suyas) |
| Cambiar estado de cualquier cita | ✅ | ❌ (solo las suyas) |
| Crear bloqueos de agenda | ✅ | ❌ |
| Eliminar bloqueos | ✅ | ❌ |
| Ver la agenda en FullCalendar (todos) | ✅ | ❌ (solo la suya) |

La validación de ownership se aplica en la **capa de servicio**, no solo en `@PreAuthorize`.

---

## Lógica de validación de disponibilidad

Antes de persistir una cita, `CitaService` ejecuta **dos verificaciones**:

### 1. Solapamiento con otras citas

```sql
SELECT COUNT(c) FROM Cita c
WHERE c.profesional.id = :profesionalId
  AND c.estado NOT IN (CANCELADA, NO_ASISTIDA)
  AND c.fechaHoraInicio < :fin
  AND c.fechaHoraFin > :inicio
  AND (:excludeId IS NULL OR c.id != :excludeId)
```

> `excludeId` permite reutilizar la query en futuras actualizaciones de horario.

### 2. Solapamiento con bloqueos de agenda

```sql
SELECT COUNT(b) FROM BloqueoAgenda b
WHERE b.profesional.id = :profesionalId
  AND b.fechaHoraInicio < :fin
  AND b.fechaHoraFin > :inicio
```

Si cualquiera de los dos conteos retorna `> 0`, se lanza `IllegalArgumentException` con mensaje descriptivo.

---

## Validaciones adicionales al crear una cita

- `fechaHoraFin` debe ser posterior a `fechaHoraInicio`
- El paciente debe existir y tener `estadoArchivo = ACTIVO`
- El profesional debe existir, tener rol `FISIOTERAPEUTA` y estar activo (`activo = true`)
- `FISIOTERAPEUTA` no puede agendar para otro profesional

---

## Vista de Agenda (FullCalendar)

Endpoint: `GET /citas/agenda/view?desde=...&hasta=...&profesionalId=...`

Devuelve una lista de `CalendarEventResponse` con citas y bloqueos mezclados.

### Colores por estado

| Estado / Tipo | Color hex |
|---|---|
| `PROGRAMADA` | `#3B82F6` (azul) |
| `REALIZADA` | `#10B981` (verde) |
| `CANCELADA` | `#6B7280` (gris) |
| `NO_ASISTIDA` | `#F59E0B` (amarillo) |
| Bloqueo de agenda | `#EF4444` (rojo) |

### Ejemplo de respuesta

```json
[
  {
    "id": "cita-42",
    "title": "García López, Juan — Dolor lumbar",
    "start": "2026-04-20T09:00:00",
    "end": "2026-04-20T09:45:00",
    "color": "#3B82F6",
    "tipo": "CITA",
    "extendedProps": {
      "estado": "PROGRAMADA",
      "pacienteId": 15,
      "profesionalNombre": "Ana Torres",
      "citaId": 42
    }
  },
  {
    "id": "bloqueo-7",
    "title": "VACACIONES — Ana Torres",
    "start": "2026-04-25T00:00:00",
    "end": "2026-04-30T23:59:00",
    "color": "#EF4444",
    "tipo": "BLOQUEO",
    "extendedProps": {
      "motivo": "VACACIONES",
      "profesionalId": 3,
      "descripcion": "Vacaciones anuales aprobadas"
    }
  }
]
```

---

## Integración con Módulo 7 (SesionSOAP)

Al cambiar el estado de una cita a `REALIZADA`, `CitaService` publica un evento Spring desacoplado:

```java
eventPublisher.publishEvent(new CitaRealizadaEvent(
    citaId, pacienteId, profesionalId,
    episodioClinicoId, motivoConsulta,
    codigoCie10Sugerido, fechaHoraRealizada
));
```

El Módulo 7 implementará un `@EventListener` sobre `CitaRealizadaEvent` para:

1. Crear un borrador de `SesionSOAP` con los datos pre-cargados
2. Actualizar `Cita.sesionGeneradaId` con el ID de la sesión creada
3. El fisioterapeuta inicia la nota SOAP sin reescribir datos ya existentes (**traspaso de contexto**)

> Mientras el Módulo 7 no exista, el evento se publica pero no tiene listener — sin errores en runtime.

---

## Estructura de archivos

```
src/main/java/com/app/fisiolab_system/
│
├── model/
│   ├── Cita.java
│   ├── BloqueoAgenda.java
│   ├── EstadoCita.java
│   └── MotivoBloqueo.java
│
├── repository/
│   ├── CitaRepository.java
│   └── BloqueoAgendaRepository.java
│
├── event/
│   └── CitaRealizadaEvent.java
│
├── dto/
│   ├── CrearCitaRequest.java
│   ├── ActualizarEstadoCitaRequest.java
│   ├── CitaResponse.java
│   ├── CalendarEventResponse.java
│   ├── CrearBloqueoRequest.java
│   └── BloqueoResponse.java
│
├── service/
│   ├── CitaService.java
│   └── BloqueoAgendaService.java
│
└── controller/
    ├── CitaController.java
    └── BloqueoAgendaController.java
```

---

## Auditoría

Todas las operaciones registran en `Auditoria` vía `AuditoriaService`:

| Acción | Código auditoria |
|---|---|
| Crear cita | `CITA_CREADA` |
| Cambiar estado | `CITA_ESTADO_CAMBIADO` |
| Crear bloqueo | `BLOQUEO_AGENDA_CREADO` |
| Eliminar bloqueo | `BLOQUEO_AGENDA_ELIMINADO` |

---

## Requisitos funcionales cubiertos

| RF | Descripción | Estado |
|---|---|---|
| RF-50 | Agendar cita con validación de disponibilidad | ✅ |
| RF-51 | Visualizar agenda por profesional (FullCalendar) | ✅ |
| RF-52 | Cambio de estado: Programada / Realizada / Cancelada / No Asistida | ✅ |
| RF-53 | Bloqueos de agenda (vacaciones, permisos, feriados) | ✅ |
| RF-54 | Restricción de acceso por rol en gestión de agenda | ✅ |
| RF-55 | Validación de paciente activo al agendar | ✅ |
| RF-56 | Traspaso de contexto Cita → SesionSOAP al marcar como Realizada | ✅ (evento publicado) |
| RF-57 | Auditoría de todas las operaciones de agenda | ✅ |
