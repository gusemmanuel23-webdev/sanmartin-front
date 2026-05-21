// ==========================================================================
// 1. EVENTO DE INICIALIZACIÓN (TRIPLE LLAMADA)
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    cargarTurnos();
    cargarFosa();
    cargarCatálogoPrecios();
});

// ==========================================================================
// 2. COLUMNA 1: TURNOS (GET /turnos)
// ==========================================================================
async function cargarTurnos() {
    const tabla = document.getElementById("tabla-turnos-body");
    try {
        const turnos = await apiFetch("/turnos");
        tabla.innerHTML = "";
        
        if (turnos.length === 0) {
            tabla.innerHTML = `<tr><td colspan="2" class="text-center">No hay turnos programados.</td></tr>`;
            return;
        }
        
        turnos.forEach(turno => {
            const fila = document.createElement("tr");
            
            // Formateamos la fecha/hora nativa para que sea amigable en la pizarra
            // Usamos 'fechaTurno' que es el nombre exacto de tu atributo en el backend
            const fechaFormateada = turno.fechaTurno 
                ? new Date(turno.fechaTurno).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' })
                : "Sin fecha";
                
            const vehiculoInfo = turno.vehiculo 
                ? `${turno.vehiculo.marca} (${turno.vehiculo.patente})` 
                : "Desconocido";

            fila.innerHTML = `
                <td>${fechaFormateada} hs</td>
                <td><strong>${vehiculoInfo}</strong></td>
            `;
            tabla.appendChild(fila);
        });
    } catch (error) {
        tabla.innerHTML = `<tr><td colspan="2" class="text-center" style="color: var(--error-rojo);">Error de carga</td></tr>`;
    }
}

// ==========================================================================
// 3. COLUMNA 2: PIZARRA DE FOSA (GET /reparaciones & PATCH)
// ==========================================================================
async function cargarFosa() {
    const tabla = document.getElementById("tabla-fosa-body");
    try {
        const ordenes = await apiFetch("/reparaciones");
        tabla.innerHTML = "";
        
        if (ordenes.length === 0) {
            tabla.innerHTML = `<tr><td colspan="4" class="text-center">Fosa vacía. Sin órdenes de trabajo.</td></tr>`;
            return;
        }
        
        ordenes.forEach(orden => {
            const fila = document.createElement("tr");
            const vehiculoInfo = orden.vehiculo ? `${orden.vehiculo.marca} [${orden.vehiculo.patente}]` : "S/D";
            
            // Estilos de badge de estado (usando la clase .badge-estado que creamos ayer)
            let claseColor = orden.estado === "Pendiente" ? "error" : "success";

            // --- LÓGICA DE BOTONES DINÁMICOS ---
            let htmlAccion = "";

            if (orden.estado === "Pendiente") {
                // Si está pendiente, botón azul para INICIAR
                htmlAccion = `<button class="btn-guardar" style="padding: 5px 10px; font-size: 0.8rem;" onclick="iniciarReparacion(${orden.id})">Iniciar</button>`;
            } 
            else if (orden.estado === "En Proceso") {
                // Si está en progreso, botón verde para FINALIZAR (Tarea 1.3)
                htmlAccion = `<button class="btn-finalizar" onclick="finalizarReparacion(${orden.id})">Finalizar</button>`;
            } 
            else {
                // Si ya está finalizado, texto informativo
                htmlAccion = `<span style="color: var(--texto-mutado); font-style: italic;">Completado</span>`;
            }

            fila.innerHTML = `
                <td>${vehiculoInfo}</td>
                <td>${orden.descripcionProblema || "Mantenimiento general"}</td>
                <td><span class="badge-estado feedback ${claseColor}" style="display: inline-block; margin-top: 0;">${orden.estado}</span></td>
                <td>${htmlAccion}</td>
            `;
            tabla.appendChild(fila);
        });
    } catch (error) {
        tabla.innerHTML = `<tr><td colspan="4" class="text-center" style="color: var(--error-rojo);">Error de conexión</td></tr>`;
    }
}

// ==========================================================================
// 3.5 FUNCIÓN: FINALIZAR REPARACIÓN Y MOSTRAR FACTURA (TAREA 1.4)
// ==========================================================================
async function finalizarReparacion(id) {
    // Primero, una confirmación nativa para evitar clics accidentales del mecánico
    if (!confirm("¿Estás seguro de finalizar este trabajo y emitir la factura?")) {
        return;
    }

    try {
        // Enviamos la petición PATCH al backend usando el helper global apiFetch
        // Mandamos el objeto con el estado en mayúsculas como espera tu validador del Back
        const ordenActualizada = await apiFetch(`/reparaciones/${id}/estado`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ estado: "FINALIZADO" })
        });

        // Formateamos el costo total que nos devolvió el servidor para mostrarlo lindo
        const costoFormateado = new Intl.NumberFormat('es-AR', { 
            style: 'currency', 
            currency: 'ARS',
            maximumFractionDigits: 0 
        }).format(ordenActualizada.costoTotal || 0);

        // Disparamos el feedback animado con el total facturado
        mostrarFeedback(
            `🚀 ¡Trabajo Finalizado con éxito! Factura emitida: ${costoFormateado}`, 
            "success"
        );

        // Le damos 2.5 segundos para que el operario lea el cartel antes de recargar la pizarra
        setTimeout(() => {
            cargarFosa();
        }, 2500);

    } catch (error) {
        console.error("Error al finalizar la orden:", error);
        mostrarFeedback("❌ No se pudo finalizar la orden de reparación.", "error");
    }
}

// FUNCIÓN DE MUTACIÓN (PATCH /reparaciones/{id}/estado)
async function iniciarReparacion(id) {
    try {
        // Le pegamos al endpoint dinámico que armamos en el back
        await apiFetch(`/reparaciones/${id}/estado`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                estado: "En Proceso"
            })
        });
        
        // Lanzamos nuestra hermosa animación de feedback suave
        mostrarFeedback("¡Vehículo ingresado a fosa correctamente!", "success");
        
        // Recargamos la fosa al instante para ver el cambio de estado reflejado en vivo
        cargarFosa();
    } catch (error) {
        mostrarFeedback("No se pudo actualizar el estado.", "error");
    }
}

// ==========================================================================
// 4. COLUMNA 3: PRECIOS (GET /servicios)
// ==========================================================================
async function cargarCatálogoPrecios() {
    const tabla = document.getElementById("tabla-servicios-body");
    try {
        const servicios = await apiFetch("/servicios");
        tabla.innerHTML = "";
        
        if (servicios.length === 0) {
            tabla.innerHTML = `<tr><td colspan="2" class="text-center">Sin servicios cargados.</td></tr>`;
            return;
        }
        
        servicios.forEach(servicio => {
            const fila = document.createElement("tr");
            
            // Cambiamos 'servicio.precio' por 'servicio.precioBase' para que coincida con tu Back
            const precioFormateado = new Intl.NumberFormat('es-AR', { 
                style: 'currency', 
                currency: 'ARS', 
                maximumFractionDigits: 0 
            }).format(servicio.precioBase);

            fila.innerHTML = `
                <td>
                    <strong>${servicio.nombre}</strong><br>
                    <small style="color: var(--texto-mutated); font-size: 0.75rem;">${servicio.descripcion || ''}</small>
                </td>
                <td style="font-weight: 600; color: var(--acento-azul); vertical-align: middle;">${precioFormateado}</td>
            `;
            tabla.appendChild(fila);
        });
    } catch (error) {
        tabla.innerHTML = `<tr><td colspan="2" class="text-center" style="color: var(--error-rojo);">Error de catálogo</td></tr>`;
    }
}

// ==========================================================================
// 5. AUXILIARES
// ==========================================================================
function mostrarFeedback(mensaje, tipo) {
    const feedback = document.getElementById("mensaje-feedback");
    if(!feedback) return;
    feedback.innerText = mensaje;
    feedback.className = `feedback ${tipo}`;
    
    setTimeout(() => {
        feedback.className = "feedback";
        setTimeout(() => {
            if (feedback.className === "feedback") feedback.innerText = "";
        }, 400);
    }, 4000);
}

// ==========================================================================
// CONTROLES DE LA VENTANA MODAL DE TURNOS (TAREA 1.5)
// ==========================================================================
function abrirModalTurno() {
    document.getElementById("modal-turno").style.display = "flex";
}

function cerrarModalTurno() {
    document.getElementById("modal-turno").style.display = "none";
    document.getElementById("form-nuevo-turno").reset();
}