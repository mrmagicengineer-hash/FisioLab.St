const API_BASE = "http://localhost:8080/api/v1";

// Helper para obtener el token y armar los headers automáticamente
const getAuthHeaders = () => {
  // Ajusta esto dependiendo de cómo guardes el token tras el login.
  // Por ejemplo, si usas zustand, redux o cookies, extráelo desde allí.
  const token = localStorage.getItem('authToken'); // <-- Cambia 'token' por el nombre de tu key

  return {
    "Content-Type": "application/json",
    "Authorization": token ? `Bearer ${token}` : ""
  };
};

export const clinicalEpisodeService = {
  // Paso 1: Abrir el episodio clínico
  createEpisode: async (data: { numeroHcl: string; motivoConsulta: string }) => {
    const response = await fetch(`${API_BASE}/episodios-clinicos`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ pacienteId: data.numeroHcl, motivo: data.motivoConsulta }),
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error("No autorizado. Sesión expirada.");
      throw new Error("Error al abrir el episodio");
    }

    return response.json();
  },

  // Paso 2: Registrar el problema vinculado al episodio
  registerProblem: async (episodioId: number, data: { descripcion: string; codigoCie10: string; estado: string }) => {
    const response = await fetch(`${API_BASE}/episodios-clinicos/${episodioId}/problemas`, {
      method: "POST",
      headers: getAuthHeaders(), // <-- Y aquí también
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error("Error al registrar el diagnóstico");

    return response.json();
  },

  // Paso 3: Obtener el historial de episodios
  getHistory: async (numeroHcl: string) => {
    const response = await fetch(`${API_BASE}/episodios-clinicos/historial/${numeroHcl}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error("No autorizado. Sesión expirada.");
      throw new Error("Error al obtener el historial de consultas");
    }

    return response.json();
  },
  getEvaluations: async (episodioId: number) => {
    const response = await fetch(`${API_BASE}/episodios-clinicos/${episodioId}/evaluaciones`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      if (response.status === 401) throw new Error("No autorizado. Sesión expirada.");
      throw new Error(`Error al obtener las evaluaciones del episodio ${episodioId}`);
    }
    
    return response.json(); 
  },

  getFullEpisodeContent: async (episodioId: number) => {
    const response = await fetch(`${API_BASE}/episodios-clinicos/${episodioId}/contenido-completo`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) throw new Error("Error al obtener el contenido completo del episodio");
    
    return response.json(); 
  },

  getResumenGlobal: async (page: number = 1, limit: number = 8) => {
    const response = await fetch(`${API_BASE}/episodios-clinicos/consultas/resumen?page=${page}&limit=${limit}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error("No autorizado. Sesión expirada.");
      throw new Error("Error al obtener el resumen de consultas");
    }

    return response.json();
  },

  // Paso 2.5: Registrar Biometría
  registerBiometria: async (episodioId: number, data: any) => {
    const response = await fetch(`${API_BASE}/episodios-clinicos/${episodioId}/biometria`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Error al registrar la biometría");
    return response.json();
  },

  // Paso 3: Registrar Evaluación Física
  registerEvaluation: async (episodioId: number, data: any) => {
    const response = await fetch(`${API_BASE}/episodios-clinicos/${episodioId}/evaluaciones`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Error al registrar la evaluación");
    return response.json();
  },

  // Paso 4: Registrar Plan de Tratamiento
  registerPlan: async (episodioId: number, problemaId: number, data: any) => {
    const response = await fetch(`${API_BASE}/episodios-clinicos/${episodioId}/problemas/${problemaId}/plan`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Error al crear el plan de tratamiento");
    return response.json();
  },
};

