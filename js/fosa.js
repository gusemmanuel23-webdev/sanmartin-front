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
            
            // Estilizamos el badge de estado según corresponda
            let claseEstado = "text-center";
            let estiloBadge = "padding: 3px 8px; border-radius: 4px; font-size: 0.85rem; font-weight: 600;";
            
            if (orden.estado === "Pendiente") {
                estiloBadge += " background-color: rgba(231, 76, 60, 0.15); color: var(--error-rojo); border: 1px solid var(--error-rojo);";
            } else {
                estiloBadge += " background-color: rgba(46, 204, 113, 0.15); color: var(--exito-verde); border: 1px solid var(--exito-verde);";
            }

            // Si está pendiente, le ofrecemos al mecánico el botón para iniciar el trabajo
            // Si ya está en progreso, mostramos un guión
            const botonAccion = orden.estado === "Pendiente"
                ? `<button class="btn-guardar" style="padding: 5px 10px; font-size: 0.8rem;" onclick="iniciarReparacion(${orden.id})">Iniciar</button>`
                : `<span style="color: var(--texto-mutado); font-style: italic;">En fosa</span>`;

            fila.innerHTML = `
                <td>${vehiculoInfo}</td>
                <td>${orden.descripcionProblema || "Mantenimiento general"}</td>
                <td><span style="${estiloBadge}">${orden.estado}</span></td>
                <td>${botonAccion}</td>
            `;
            tabla.appendChild(fila);
        });
    } catch (error) {
        tabla.innerHTML = `<tr><td colspan="4" class="text-center" style="color: var(--error-rojo);">Error de conexión</td></tr>`;
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
            
            // Formateamos el costo a moneda local de forma elegante
            const precioFormateado = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(servicio.precio);

            fila.innerHTML = `
                <td>${servicio.nombre}</td>
                <td style="font-weight: 600; color: var(--acento-azul);">${precioFormateado}</td>
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