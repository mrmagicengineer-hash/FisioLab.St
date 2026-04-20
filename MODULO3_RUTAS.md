# Modulo 3 - Rutas

Base URL: /api/v1

## Historias clinicas y antecedentes

- POST /historias-clinicas/{numeroHcl}/antecedentes/personales
- POST /historias-clinicas/{numeroHcl}/antecedentes/familiares
- GET /historias-clinicas/{numeroHcl}/antecedentes/personales
- GET /historias-clinicas/{numeroHcl}/antecedentes/familiares
- GET /historias-clinicas/{numeroHcl}/completa
- GET /historias-clinicas/por-paciente/{pacienteId}
- GET /historias-clinicas/depuracion/candidatas
- DELETE /historias-clinicas/{numeroHcl}/depuracion

Ejemplo de numeroHcl: HC-2026-00001
Ejemplo de pacienteId: 12

## 1) POST /historias-clinicas/{numeroHcl}/antecedentes/personales

Request JSON:
```json
{
	"tipo": "PATOLOGICO",
	"descripcion": "Alergia a las nueces",
	"codigoCie10": "T78.1",
	"estado": "ACTIVO"
}
```

Response JSON (200):
```json
{
	"id": 101,
	"tipo": "PATOLOGICO",
	"descripcion": "Alergia a las nueces",
	"codigoCie10": "T78.1",
	"estado": "ACTIVO",
	"fechaRegistro": "2026-04-06T13:55:12"
}
```

## 2) POST /historias-clinicas/{numeroHcl}/antecedentes/familiares

Request JSON:
```json
{
	"parentesco": "PADRE",
	"condicion": "Diabetes mellitus tipo 2",
	"codigoCie10": "E11"
}
```

Response JSON (200):
```json
{
	"id": 77,
	"parentesco": "PADRE",
	"condicion": "Diabetes mellitus tipo 2",
	"codigoCie10": "E11",
	"fechaRegistro": "2026-04-06T13:56:41"
}
```

## 3) GET /historias-clinicas/{numeroHcl}/completa

Response JSON (200):
```json
{
	"resumen": {
		"historiaClinicaId": 45,
		"pacienteId": 12,
		"numeroHcl": "HC-2026-00001",
		"paciente": "Maria Fernanda Mena",
		"cedula": "1712345678",
		"unidadSalud": "Clinica Fisiolab",
		"estadoHistoriaClinica": "ABIERTA",
		"estadoArchivoPaciente": "ACTIVO",
		"fechaApertura": "2026-04-06T13:50:00"
	},
	"antecedentesPersonales": [
		{
			"id": 101,
			"tipo": "PATOLOGICO",
			"descripcion": "Alergia a las nueces",
			"codigoCie10": "T78.1",
			"estado": "ACTIVO",
			"fechaRegistro": "2026-04-06T13:55:12"
		}
	],
	"antecedentesFamiliares": [
		{
			"id": 77,
			"parentesco": "PADRE",
			"condicion": "Diabetes mellitus tipo 2",
			"codigoCie10": "E11",
			"fechaRegistro": "2026-04-06T13:56:41"
		}
	],
	"problemasActivos": [
		{
			"id": 101,
			"tipo": "PATOLOGICO",
			"descripcion": "Alergia a las nueces",
			"codigoCie10": "T78.1",
			"estado": "ACTIVO",
			"fechaRegistro": "2026-04-06T13:55:12"
		}
	],
	"episodiosPrevios": []
}
```

## 3.1) GET /historias-clinicas/{numeroHcl}/antecedentes/personales

Response JSON (200):
```json
[
	{
		"id": 101,
		"tipo": "PATOLOGICO",
		"descripcion": "Alergia a las nueces",
		"codigoCie10": "T78.1",
		"estado": "ACTIVO",
		"fechaRegistro": "2026-04-06T13:55:12"
	}
]
```

## 3.2) GET /historias-clinicas/{numeroHcl}/antecedentes/familiares

Response JSON (200):
```json
[
	{
		"id": 77,
		"parentesco": "PADRE",
		"condicion": "Diabetes mellitus tipo 2",
		"codigoCie10": "E11",
		"fechaRegistro": "2026-04-06T13:56:41"
	}
]
```

## 4) GET /historias-clinicas/por-paciente/{pacienteId}

Response JSON (200):
```json
{
	"historiaClinicaId": 45,
	"pacienteId": 12,
	"numeroHcl": "HC-2026-00001",
	"paciente": "Maria Fernanda Mena",
	"cedula": "1712345678",
	"unidadSalud": "Clinica Fisiolab",
	"estadoHistoriaClinica": "ABIERTA",
	"estadoArchivoPaciente": "ACTIVO",
	"fechaApertura": "2026-04-06T13:50:00"
}
```

## 5) GET /historias-clinicas/depuracion/candidatas

Response JSON (200):
```json
[
	{
		"historiaClinicaId": 13,
		"pacienteId": 8,
		"numeroHcl": "HC-2010-00420",
		"paciente": "Carlos Perez",
		"cedula": "1709876543",
		"unidadSalud": "Clinica Fisiolab",
		"estadoHistoriaClinica": "ABIERTA",
		"estadoArchivoPaciente": "PASIVO",
		"fechaApertura": "2010-03-10T09:00:00"
	}
]
```

## 6) DELETE /historias-clinicas/{numeroHcl}/depuracion

Response JSON (200):
```json
{
	"resultado": "Historia clinica depurada correctamente"
}
```
