// ==========================================================================
// VARIABLES GLOBALES Y CONTROL DE FLUJO
// ==========================================================================
let listaVehiculosLocal = [];

// ==========================================================================
// 1. EVENTO DE INICIALIZACIÓN UNIFICADO
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    cargarTurnos();
    cargarFosa();
    cargarCatálogoPrecios();
});

// ==========================================================================
// 2. COLUMNA 1: AGENDA DE TURNOS (GET /turnos)
// ==========================================================================
async function cargarTurnos() {
    const tablaAgenda = document.getElementById("tabla-turnos-body");
    if (!tablaAgenda) return; 

    try {
        const turnos = await apiFetch("/turnos");
        tablaAgenda.innerHTML = "";

        if (turnos.length === 0) {
            tablaAgenda.innerHTML = `<tr><td colspan="3" class="text-center" style="color: var(--texto-mutado);">No hay turnos programados</td></tr>`;
            return;
        }

        turnos.forEach(turno => {
            const fila = document.createElement("tr");
            
            const infoVehiculo = turno.vehiculo ? `${turno.vehiculo.marca} [${turno.vehiculo.patente}]` : "S/V";
            const infoCliente = turno.cliente ? turno.cliente.nombre : "S/C";
            const fechaFormateada = turno.fechaTurno ? turno.fechaTurno.replace("T", " ") : "S/F";

            fila.innerHTML = `
                <td><strong>${fechaFormateada}</strong></td>
                <td>${infoVehiculo}</td>
                <td><span style="color: var(--texto-mutado); font-size: 0.85rem;">${infoCliente}</span></td>
            `;
            tablaAgenda.appendChild(fila);
        });
    } catch (error) {
        console.error("Error al renderizar la agenda de turnos:", error);
        tablaAgenda.innerHTML = `<tr><td colspan="3" class="text-center" style="color: var(--error-rojo);">Error al cargar agenda</td></tr>`;
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
            
            let claseColor = orden.estado === "Pendiente" ? "error" : "success";
            let htmlAccion = "";

            if (orden.estado === "Pendiente") {
                htmlAccion = `<button class="btn-guardar" style="padding: 5px 10px; font-size: 0.8rem;" onclick="iniciarReparacion(${orden.id})">Iniciar</button>`;
            } 
            else if (orden.estado === "En Proceso") {
                htmlAccion = `<button class="btn-finalizar" onclick="finalizarReparacion(${orden.id})">Finalizar</button>`;
            } 
            else {
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

async function iniciarReparacion(id) {
    try {
        await apiFetch(`/reparaciones/${id}/estado`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estado: "En Proceso" })
        });
        
        mostrarFeedback("¡Vehículo ingresado a fosa correctamente!", "success");
        cargarFosa();
    } catch (error) {
        mostrarFeedback("No se pudo actualizar el estado.", "error");
    }
}

async function finalizarReparacion(id) {
    if (!confirm("¿Estás seguro de finalizar este trabajo y emitir la factura?")) {
        return;
    }

    try {
        const ordenActualizada = await apiFetch(`/reparaciones/${id}/estado`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estado: "FINALIZADO" })
        });

        const costoFormateado = new Intl.NumberFormat('es-AR', { 
            style: 'currency', 
            currency: 'ARS',
            maximumFractionDigits: 0 
        }).format(ordenActualizada.costoTotal || 0);

        mostrarFeedback(
            `🚀 ¡Trabajo Finalizado con éxito! Factura emitida: ${costoFormateado}`, 
            "success"
        );

        setTimeout(() => {
            cargarFosa();
        }, 2500);

    } catch (error) {
        console.error("Error al finalizar la orden:", error);
        mostrarFeedback("❌ No se pudo finalizar la orden de reparación.", "error");
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
// 5. CONTROLES DEL MODAL DE TURNOS FORMULARIO UNIFICADO
// ==========================================================================
async function abrirModalTurno() {
    const selectVehiculo = document.getElementById("turno-vehiculo");
    
    try {
        selectVehiculo.innerHTML = `<option value="">Cargando flota de vehículos...</option>`;
        document.getElementById("modal-turno").style.display = "flex";

        listaVehiculosLocal = await apiFetch("/vehiculos");
        selectVehiculo.innerHTML = "";

        if (listaVehiculosLocal.length === 0) {
            selectVehiculo.innerHTML = `<option value="">No hay vehículos registrados en el sistema</option>`;
            return;
        }

        const opcionInicial = document.createElement("option");
        opcionInicial.value = "";
        opcionInicial.textContent = "-- Seleccione un Vehículo --";
        selectVehiculo.appendChild(opcionInicial);

        listaVehiculosLocal.forEach(auto => {
            const opcion = document.createElement("option");
            opcion.value = auto.id; 
            opcion.textContent = `${auto.marca} - ${auto.modelo || ''} [${auto.patente}]`;
            selectVehiculo.appendChild(opcion);
        });

    } catch (error) {
        console.error("Error al cargar los vehículos para el turno:", error);
        selectVehiculo.innerHTML = `<option value="">❌ Error al conectar con el taller</option>`;
    }
}

function cerrarModalTurno() {
    document.getElementById("modal-turno").style.display = "none";
    document.getElementById("form-nuevo-turno").reset();
}

// ESCUCHA ÚNICA Y DEFINITIVA DEL FORMULARIO DE TURNOS
document.getElementById("form-nuevo-turno").addEventListener("submit", async (e) => {
    e.preventDefault();

    const idVehiculo = document.getElementById("turno-vehiculo").value;
    const fechaHoraInput = document.getElementById("turno-fecha").value;

    if (!idVehiculo || !fechaHoraInput) {
        mostrarFeedback("⚠️ Por favor, complete todos los campos.", "error");
        return;
    }

    const vehiculoSeleccionado = listaVehiculosLocal.find(auto => auto.id == idVehiculo);

    if (!vehiculoSeleccionado || !vehiculoSeleccionado.cliente) {
        mostrarFeedback("❌ Error: El vehículo seleccionado no tiene un dueño asignado.", "error");
        return;
    }

    try {
        const nuevoTurno = {
            fechaTurno: fechaHoraInput, 
            vehiculo: { id: parseInt(idVehiculo) },
            cliente: { id: parseInt(vehiculoSeleccionado.cliente.id) }
        };

        await apiFetch("/turnos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevoTurno)
        });

        cerrarModalTurno();
        mostrarFeedback("📅 ¡Turno agendado con éxito!", "success");
        cargarTurnos(); 

    } catch (error) {
        console.error("Error al agendar el turno:", error);
        mostrarFeedback("❌ Error al guardar el turno en el servidor.", "error");
    }
});

// ==========================================================================
// 6. AUXILIARES GLOBALES
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
// CONTROLES DE LA VENTANA MODAL DE SERVICIOS (TAREA 1.8 - AGREGAR)
// ==========================================================================
function abrirModalServicio() {
    const modal = document.getElementById("modal-servicio");
    if (modal) {
        modal.style.display = "flex";
    }
}

function cerrarModalServicio() {
    const modal = document.getElementById("modal-servicio");
    if (modal) {
        modal.style.display = "none";
        document.getElementById("form-nuevo-servicio").reset();
    }
}