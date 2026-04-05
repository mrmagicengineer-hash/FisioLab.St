# Documentacion de Endpoints - Fisiolab System

## Informacion general
- Base URL local: `http://localhost:8080/api/v1`
- Formato de respuesta: `application/json`
- Autenticacion: `Bearer JWT` (header `Authorization`)

## Swagger
- UI: `http://localhost:8080/api/v1/swagger-ui/index.html`
- OpenAPI JSON: `http://localhost:8080/api/v1/v3/api-docs`

## Autenticacion

### POST /auth/login
Inicia sesion y retorna un token JWT.

Request body:
```json
{
  "email": "admin@fisiolab.com",
  "password": "TuPassword123"
}
```

Validaciones:
- `email`: obligatorio, formato email
- `password`: obligatorio

Response 200:
```json
{
  "token": "eyJhbGciOiJI...",
  "tokenType": "Bearer",
  "expiresIn": 1800000
}
```

Posibles codigos:
- `200 OK`
- `401 Unauthorized`

cURL:
```bash
curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fisiolab.com",
    "password": "TuPassword123"
  }'
```

### POST /auth/change-password
Cambia la contrasena del usuario autenticado.

Requiere header:
- `Authorization: Bearer <token>`

Request body:
```json
{
  "currentPassword": "PasswordActual123",
  "newPassword": "PasswordNueva123"
}
```

Validaciones:
- `currentPassword`: obligatorio
- `newPassword`: obligatorio

Response 200:
```json
"Contrasena cambiada exitosamente"
```

Posibles codigos:
- `200 OK`
- `401 Unauthorized`

cURL:
```bash
curl -X POST "http://localhost:8080/api/v1/auth/change-password" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "currentPassword": "PasswordActual123",
    "newPassword": "PasswordNueva123"
  }'
```

## Administracion de usuarios

### POST /admin/usuarios
Crea un usuario profesional (solo rol ADMINISTRADOR).

Requiere header:
- `Authorization: Bearer <token>`

Request body:
```json
{
  "cedula": "1234567890",
  "email": "fisio@fisiolab.com",
  "name": "Juan",
  "lastName": "Perez",
  "password": "TuPassword123",
  "rol": "FISIOTERAPEUTA",
  "especialidad": "Rehabilitacion deportiva",
  "tipoProfesional": "Fisioterapeuta",
  "codigoRegistro": "COL-FT-001"
}
```

Validaciones:
- `cedula`: obligatorio, max 20
- `email`: obligatorio, email valido, max 120
- `name`: obligatorio, max 120
- `lastName`: obligatorio, max 120
- `password`: obligatorio
- `rol`: obligatorio
- `especialidad`: opcional, max 120
- `tipoProfesional`: opcional, max 120
- `codigoRegistro`: opcional, max 120

Valores permitidos en `rol`:
- `ADMINISTRADOR`
- `FISIOTERAPEUTA`
- `MEDICO`

Response 200:
```json
{
  "id": 12,
  "cedula": "1234567890",
  "email": "fisio@fisiolab.com",
  "name": "Juan",
  "lastName": "Perez",
  "rol": "FISIOTERAPEUTA",
  "activo": true,
  "especialidad": "Rehabilitacion deportiva",
  "tipoProfesional": "Fisioterapeuta",
  "codigoRegistro": "COL-FT-001"
}
```

Posibles codigos:
- `200 OK`
- `403 Forbidden`
- `401 Unauthorized`

cURL:
```bash
curl -X POST "http://localhost:8080/api/v1/admin/usuarios" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "cedula": "1234567890",
    "email": "fisio@fisiolab.com",
    "name": "Juan",
    "lastName": "Perez",
    "password": "TuPassword123",
    "rol": "FISIOTERAPEUTA",
    "especialidad": "Rehabilitacion deportiva",
    "tipoProfesional": "Fisioterapeuta",
    "codigoRegistro": "COL-FT-001"
  }'
```

### POST /admin/usuarios/{id}
Endpoint definido pero actualmente sin implementacion (retorna `null` en el controlador).

## Pruebas

### GET /test/token
Genera un token de prueba con un usuario hardcodeado.

Response 200:
```text
eyJhbGciOiJIUzI1NiJ9...
```

cURL:
```bash
curl -X GET "http://localhost:8080/api/v1/test/token"
```

## Header de autenticacion
Ejemplo de uso para endpoints protegidos:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```
