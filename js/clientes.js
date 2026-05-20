// ==========================================================================
// 1. EVENTO DE INICIALIZACIÓN
// ==========================================================================
// Ejecuta la carga de clientes de forma automática apenas la pantalla se renderiza
document.addEventListener("DOMContentLoaded", () => {
    cargarClientes();
    configurarFormulario();
});

// ==========================================================================
// 2. LECTURA DE DATOS (GET ALL)
// ==========================================================================
async function cargarClientes() {
    const tablaBody = document.getElementById("tabla-clientes-body");
    
    try {
        // Hacemos el llamado a nuestro backend usando el helper de api.js
        const clientes = await apiFetch("/clientes");
        
        // Limpiamos el mensaje de "Cargando..."
        tablaBody.innerHTML = "";
        
        if (clientes.length === 0) {
            tablaBody.innerHTML = `<tr><td colspan="4" class="text-center">No hay clientes registrados en el sistema.</td></tr>`;
            return;
        }
        
        // Recorremos los clientes y construimos las filas de la tabla dinámicamente
        clientes.forEach(cliente => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td><strong>${cliente.id}</strong></td>
                <td>${cliente.nombre}</td>
                <td>${cliente.telefono || '<span class="text-center">-</span>'}</td>
                <td>
                    <button class="btn-eliminar" onclick="eliminarCliente(${cliente.id})">Eliminar</button>
                </td>
            `;
            tablaBody.appendChild(fila);
        });
        
    } catch (error) {
        tablaBody.innerHTML = `<tr><td colspan="4" class="text-center" style="color: var(--error-rojo);">Error al conectar con el servidor. Verifique el backend.</td></tr>`;
    }
}

// ==========================================================================
// 3. CREACIÓN DE DATOS (POST)
// ==========================================================================
function configurarFormulario() {
    const formulario = document.getElementById("form-cliente");
    
    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault(); // Evita que la página se recargue por defecto
        
        const feedback = document.getElementById("mensaje-feedback");
        
        // Capturamos los datos que escribió el usuario en los inputs
        const nombreInput = document.getElementById("nombre").value.trim();
        const telefonoInput = document.getElementById("telefono").value.trim();
        
        // Construimos el objeto JSON idéntico a lo que espera nuestra API de Spring Boot
        const nuevoCliente = {
            nombre: nombreInput,
            telefono: telefonoInput === "" ? null : telefonoInput
        };
        
        try {
            // Enviamos el objeto por POST al backend
            await apiFetch("/clientes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(nuevoCliente)
            });
            
            // Si sale bien, mostramos feedback de éxito
            mostrarFeedback("¡Cliente registrado con éxito!", "success");
            formulario.reset(); // Vaciamos los campos del formulario
            cargarClientes();   // Recargamos la tabla en vivo para ver el nuevo cliente inmediatamente
            
        } catch (error) {
            // Si el backend rebota la petición (ej. nombre vacío), capturamos el mensaje de error exacto
            mostrarFeedback(error.message, "error");
        }
    });
}

// ==========================================================================
// 4. FUNCIONES AUXILIARES DE INTERFAZ
// ==========================================================================
function mostrarFeedback(mensaje, tipo) {
    const feedback = document.getElementById("mensaje-feedback");
    feedback.innerText = mensaje;
    feedback.className = `feedback ${tipo}`; // Al agregar la clase, CSS dispara la animación de entrada
    
    // Configuramos el temporizador para iniciar la salida suave antes de borrar el texto
    setTimeout(() => {
        feedback.className = "feedback"; // Quitamos .success/.error, CSS dispara la animación de salida
        
        // Esperamos 400 milisegundos (lo que dura la transición CSS) para vaciar el texto limpio
        setTimeout(() => {
            if (feedback.className === "feedback") {
                feedback.innerText = "";
            }
        }, 400);
        
    }, 4000); // El cartel se queda visible 4 segundos completos
}