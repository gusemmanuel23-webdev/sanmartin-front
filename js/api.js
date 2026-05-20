// La URL base donde está escuchando nuestro servidor de Spring Boot
const API_BASE_URL = "http://localhost:8080";

// Función auxiliar para centralizar las peticiones y manejar errores de red de forma limpia
async function apiFetch(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        
        // Si el estado no está entre 200 y 299, arrojamos la respuesta para manejar el error
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Error del servidor: ${response.status}`);
        }
        
        // Si el estado es 204 (No Content del DELETE), no intentamos parsear JSON porque viene vacío
        if (response.status === 204) {
            return null;
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Fallo en la petición a ${endpoint}:`, error);
        throw error;
    }
}