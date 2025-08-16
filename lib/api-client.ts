type FetchOptions = RequestInit & {
  params?: Record<string, string>;
};

export async function apiClient(endpoint: string, options: FetchOptions = {}) {
  const { params, ...fetchOptions } = options;
  
  // Asegurar que siempre se envíen las credenciales
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  // Construir la URL con los parámetros de consulta
  const url = new URL(endpoint, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  try {
    const response = await fetch(url, {
      ...defaultOptions,
      ...fetchOptions,
    });

    // Si la respuesta no es ok, lanzar un error
    if (!response.ok) {
      // Intentar obtener el mensaje de error del servidor
      let errorMessage = 'Error en la llamada a la API';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Si no podemos parsear el error, usamos el mensaje por defecto
      }

      throw new Error(errorMessage);
    }

    // Si la respuesta está vacía, devolver null
    if (response.status === 204) {
      return null;
    }

    // Intentar parsear la respuesta como JSON
    return await response.json();
  } catch (error) {
    console.error('Error en llamada a la API:', error);
    throw error;
  }
}

// Ejemplo de uso:
/*
// GET request
const data = await apiClient('/api/riot/matches');

// POST request con body
const newMatch = await apiClient('/api/riot/matches', {
  method: 'POST',
  body: JSON.stringify({ matchId: '123' }),
});

// GET request con parámetros de consulta
const filteredMatches = await apiClient('/api/riot/matches', {
  params: { region: 'LAS', queue: 'ranked' },
});
*/
