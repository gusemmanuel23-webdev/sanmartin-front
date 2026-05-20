// ==========================================================================
// 1. EVENTO DE INICIALIZACIÓN
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    cargarClientesEnDesplegable();
    cargarVehiculos();
    configurarFormularioVehiculo();
});

// ==========================================================================
// 2. POBLAR DESPLEGABLE DE CLIENTES (GET /clientes)
// ==========================================================================
async function cargarClientesEnDesplegable() {
    const selectCliente = document.getElementById("cliente-select");
    
    try {
        // Pedimos los clientes al backend para saber a quién le pertenece el auto
        const clientes = await apiFetch("/clientes");
        
        // Limpiamos el texto de espera
        selectCliente.innerHTML = '<option value="">-- Seleccione un Dueño --</option>';
        
        // Inyectamos cada cliente como una opción del menú
        clientes.forEach(cliente => {
            const opcion = document.createElement("option");
            opcion.value = cliente.id; // El ID va oculto en el valor
            opcion.text = `${cliente.nombre} (ID: ${cliente.id})`; // Lo que ve el usuario
            selectCliente.appendChild(opcion);
        });
        
    } catch (error) {
        selectCliente.innerHTML = '<option value="">Error al cargar clientes</option>';
    }
}

// ==========================================================================
// 3. LECTURA DE VEHÍCULOS (GET /vehiculos)
// ==========================================================================
async function cargarVehiculos() {
    const tablaBody = document.getElementById("tabla-vehiculos-body");
    
    try {
        const vehiculos = await apiFetch("/vehiculos");
        tablaBody.innerHTML = "";
        
        if (vehiculos.length === 0) {
            tablaBody.innerHTML = `<tr><td colspan="6" class="text-center">No hay vehículos registrados en la flota.</td></tr>`;
            return;
        }
        
        vehiculos.forEach(vehiculo => {
            const fila = document.createElement("tr");
            
            // Evaluamos de forma segura si el vehículo tiene un cliente asignado
            const duenoNombre = vehiculo.cliente ? vehiculo.cliente.nombre : '<span style="color: var(--error-rojo);">Sin Dueño</span>';
            
            fila.innerHTML = `
                <td><strong>${vehiculo.id}</strong></td>
                <td><span style="letter-spacing: 1px; font-weight: 600;">${vehiculo.patente}</span></td>
                <td>${vehiculo.marca} ${vehiculo.modelo}</td>
                <td>${vehiculo.anio}</td>
                <td>${duenoNombre}</td>
                <td>
                    <button class="btn-eliminar" onclick="eliminarVehiculo(${vehiculo.id})">Eliminar</button>
                </td>
            `;
            tablaBody.appendChild(fila);
        });
        
    } catch (error) {
        tablaBody.innerHTML = `<tr><td colspan="6" class="text-center" style="color: var(--error-rojo);">Error al conectar con el servidor.</td></tr>`;
    }
}

// ==========================================================================
// 4. CREACIÓN DE VEHÍCULOS (POST /vehiculos)
// ==========================================================================
function configurarFormularioVehiculo() {
    const formulario = document.getElementById("form-vehiculo");
    
    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        
        const patenteInput = document.getElementById("patente").value.trim().toUpperCase();
        const marcaInput = document.getElementById("marca").value.trim();
        const modeloInput = document.getElementById("modelo").value.trim();
        const anioInput = parseInt(document.getElementById("anio").value);
        const clienteIdInput = document.getElementById("cliente-select").value;
        
        // Construimos el JSON respetando la relación de objeto anidado que espera Hibernate
        const nuevoVehiculo = {
            patente: patenteInput,
            marca: marcaInput,
            modelo: modeloInput,
            anio: anioInput,
            cliente: {
                id: parseInt(clienteIdInput) // Asociamos pasándole el ID seleccionado
            }
        };
        
        try {
            await apiFetch("/vehiculos", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(nuevoVehiculo)
            });
            
            mostrarFeedback("¡Vehículo registrado y asociado con éxito!", "success");
            formulario.reset();
            cargarVehiculos(); // Refrescamos la tabla en tiempo real
            
        } catch (error) {
            mostrarFeedback(error.message, "error");
        }
    });
}

// ==========================================================================
// 5. FUNCIONES AUXILIARES
// ==========================================================================
function mostrarFeedback(mensaje, tipo) {
    const feedback = document.getElementById("mensaje-feedback");
    feedback.innerText = mensaje;
    feedback.className = `feedback ${tipo}`;
    
    setTimeout(() => {
        feedback.className = "feedback";
        feedback.innerText = "";
    }, 4000);
}