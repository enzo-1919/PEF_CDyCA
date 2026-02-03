let usuarioActual = null;
let tablaEnEdicion = null;
let indiceTablaEnEdicion = null;
let tipoTablaEnEdicion = null;
const API_URL = 'https://pef-2pzu.onrender.com/api';

const deporteConfig = {
    rugby: { nombre: 'Rugby', color: '#2d8b2d', oscuro: '#1a5f1a' },
    futbol: { nombre: 'Fútbol', color: '#1e88e5', oscuro: '#0d47a1' },
    hockey: { nombre: 'Hockey', color: '#e91e63', oscuro: '#880e4f' },
    voley: { nombre: 'Voley', color: '#dc1c1c', oscuro: '#51414f' },
    basquet: { nombre: 'Basquet', color: '#ff6f00', oscuro: '#e65100' },
    handball: { nombre: 'Handball', color: '#00897b', oscuro: '#004d40' },
    natacion: { nombre: 'Natación', color: '#0277bd', oscuro: '#01579b' },
    tenis: { nombre: 'Tenis', color: '#ecf405', oscuro: '#ecf405' },
    patin: { nombre: 'Patín', color: '#6a1b9a', oscuro: '#4a148c' }
};

window.addEventListener('DOMContentLoaded', function() {
    verificarSesion();
    aplicarColoresDeporte();
    cargarUsuarios();
    mostrarTablasExistentes();
});

function verificarSesion() {
    const sesion = localStorage.getItem('usuarioActual');
    if (!sesion) {
        window.location.href = 'index.html';
        return;
    }
    usuarioActual = JSON.parse(sesion);
    if (usuarioActual.tipo !== 'admin') {
        window.location.href = 'usuarios.html';
        return;
    }
}

function aplicarColoresDeporte() {
    const deporte = usuarioActual.deporte;
    const config = deporteConfig[deporte];
    
    if (config) {
        document.getElementById('deporteNombre').textContent = config.nombre;
        document.documentElement.style.setProperty('--color-primario', config.color);
        document.documentElement.style.setProperty('--color-oscuro', config.oscuro);
    }
}

async function cargarUsuarios() {
    try {
        const response = await fetch(`${API_URL}/usuarios`);
        if (!response.ok) {
            throw new Error('No se pudieron cargar usuarios');
        }
        const usuarios = await response.json();
        const selector = document.getElementById('usuarioDestino');
        selector.innerHTML = '';
        
        // Filtrar solo usuarios del mismo deporte
        const usuariosNormales = usuarios.filter(u => u.tipo === 'user' && u.deporte === usuarioActual.deporte);
        
        if (usuariosNormales.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No hay usuarios disponibles';
            selector.appendChild(option);
            return;
        }
        
        usuariosNormales.forEach(usuario => {
            const option = document.createElement('option');
            option.value = usuario.nombre;
            option.textContent = usuario.nombre;
            selector.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        alert('Error: No se pudo conectar con el servidor');
    }
}

function mostrarCampoUsuario() {
    const tipo = document.getElementById('tipoTabla').value;
    const campo = document.getElementById('campoUsuario');
    if (tipo === 'individual') {
        campo.style.display = 'block';
    } else {
        campo.style.display = 'none';
    }
}

async function crearNuevaTabla() {
    const tipo = document.getElementById('tipoTabla').value;
    const nombre = document.getElementById('nombreTabla').value.trim();
    
    if (!nombre) {
        alert('Por favor ingrese un nombre para la tabla');
        return;
    }
    
    const nuevaTabla = {
        nombre: nombre,
        listas: [],
        deporte: usuarioActual.deporte
    };
    
    const tablas = await cargarTablas();
    
    if (tipo === 'general') {
        tablas.generales.push(nuevaTabla);
        indiceTablaEnEdicion = tablas.generales.length - 1;
        tipoTablaEnEdicion = 'general';
    } else {
        const usuario = document.getElementById('usuarioDestino').value;
        if (!tablas.individuales[usuario]) {
            tablas.individuales[usuario] = [];
        }
        tablas.individuales[usuario].push(nuevaTabla);
        indiceTablaEnEdicion = tablas.individuales[usuario].length - 1;
        tipoTablaEnEdicion = `individual-${usuario}`;
    }
    
    await guardarTablasEnServidor(tablas);
    tablaEnEdicion = nuevaTabla;
    mostrarEditor();
    mostrarTablasExistentes();
    document.getElementById('nombreTabla').value = '';
}

async function cargarTablas() {
    try {
        const response = await fetch(`${API_URL}/tablas`);
        if (!response.ok) {
            throw new Error('No se pudieron cargar las tablas');
        }
        const tablas = await response.json();
        return tablas;
    } catch (error) {
        console.error('Error al cargar tablas:', error);
        return { generales: [], individuales: {} };
    }
}

async function guardarTablasEnServidor(tablas) {
    try {
        const response = await fetch(`${API_URL}/tablas`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(tablas)
        });
        if (!response.ok) {
            throw new Error('No se pudieron guardar las tablas');
        }
        return true;
    } catch (error) {
        console.error('Error al guardar tablas:', error);
        alert('Error al guardar en el servidor');
        return false;
    }
}

async function mostrarTablasExistentes() {
    const contenedor = document.getElementById('tablasExistentes');
    contenedor.innerHTML = '';
    
    const tablas = await cargarTablas();
    const deporteActual = usuarioActual.deporte;
    
    // Filtrar y mostrar solo las tablas generales del deporte actual
    if (tablas.generales.length > 0) {
        tablas.generales.forEach((tabla, index) => {
            if (tabla.deporte === deporteActual) {
                const card = crearTarjetaTabla(tabla, 'general', index);
                contenedor.appendChild(card);
            }
        });
    }
    
    // Filtrar tablas individuales del deporte actual
    Object.keys(tablas.individuales).forEach(usuario => {
        tablas.individuales[usuario].forEach((tabla, index) => {
            if (tabla.deporte === deporteActual) {
                const card = crearTarjetaTabla(tabla, `individual-${usuario}`, index);
                contenedor.appendChild(card);
            }
        });
    });
    
    if (contenedor.children.length === 0) {
        contenedor.innerHTML = '<p>No hay tablas creadas aún para este deporte</p>';
    }
}

function crearTarjetaTabla(tabla, tipo, index) {
    const card = document.createElement('div');
    card.className = 'tabla-card';
    
    const tipoTexto = tipo.startsWith('individual') 
        ? `Individual (${tipo.split('-')[1]})` 
        : 'General';
    
    card.innerHTML = `
        <h3>${tabla.nombre}</h3>
        <p><strong>Tipo:</strong> ${tipoTexto}</p>
        <p><strong>Listas:</strong> ${tabla.listas.length}</p>
        <button class="btn btn-danger" style="margin-top: 10px;" onclick="event.stopPropagation(); eliminarTabla('${tipo}', ${index})">Eliminar</button>
    `;
    
    card.onclick = () => editarTabla(tipo, index);
    return card;
}

async function eliminarTabla(tipo, index) {
    if (!confirm('¿Está seguro de que desea eliminar esta tabla? Esta acción no se puede deshacer.')) {
        return;
    }
    
    const tablas = await cargarTablas();
    
    if (tipo === 'general') {
        tablas.generales.splice(index, 1);
    } else {
        const usuario = tipo.split('-')[1];
        if (tablas.individuales[usuario]) {
            tablas.individuales[usuario].splice(index, 1);
            if (tablas.individuales[usuario].length === 0) {
                delete tablas.individuales[usuario];
            }
        }
    }
    
    const guardado = await guardarTablasEnServidor(tablas);
    if (guardado) {
        alert('Tabla eliminada correctamente');
        mostrarTablasExistentes();
        if (tablaEnEdicion) {
            cerrarEditor();
        }
    }
}

async function editarTabla(tipo, index) {
    const tablas = await cargarTablas();
    
    if (tipo === 'general') {
        tablaEnEdicion = tablas.generales[index];
        tipoTablaEnEdicion = 'general';
        indiceTablaEnEdicion = index;
    } else {
        const usuario = tipo.split('-')[1];
        tablaEnEdicion = tablas.individuales[usuario][index];
        tipoTablaEnEdicion = tipo;
        indiceTablaEnEdicion = index;
    }
    
    mostrarEditor();
}

function mostrarEditor() {
    document.getElementById('nombreTablaEditor').textContent = tablaEnEdicion.nombre;
    document.getElementById('editorTabla').style.display = 'block';
    document.getElementById('panelCreacion').style.display = 'none';
    renderizarListas();
}

function cerrarEditor() {
    document.getElementById('editorTabla').style.display = 'none';
    document.getElementById('panelCreacion').style.display = 'block';
    tablaEnEdicion = null;
}

function agregarLista() {
    const titulo = prompt('Ingrese el título de la lista (Ej: Ejercicios de piernas):');
    if (!titulo) return;
    
    const nuevaLista = {
        titulo: titulo,
        ejercicios: []
    };
    
    tablaEnEdicion.listas.push(nuevaLista);
    renderizarListas();
}

function renderizarListas() {
    const contenedor = document.getElementById('contenedorListas');
    contenedor.innerHTML = '';
    
    tablaEnEdicion.listas.forEach((lista, indexLista) => {
        const listaDiv = document.createElement('div');
        listaDiv.className = 'lista';
        
        const header = document.createElement('div');
        header.className = 'lista-header';
        header.innerHTML = `
            <span>${lista.titulo}</span>
            <div>
                <button class="btn" onclick="agregarEjercicio(${indexLista})">+ Ejercicio</button>
                <button class="btn btn-danger" onclick="eliminarLista(${indexLista})">Eliminar Lista</button>
            </div>
        `;
        
        listaDiv.appendChild(header);
        
        if (lista.ejercicios.length > 0) {
            const table = crearTablaEjercicios(lista, indexLista);
            listaDiv.appendChild(table);
        }
        
        contenedor.appendChild(listaDiv);
    });
}

function crearTablaEjercicios(lista, indexLista) {
    const tableWrapper = document.createElement('div');
    tableWrapper.style.overflowX = 'auto';
    tableWrapper.style.maxWidth = '100%';
    
    const table = document.createElement('table');
    table.style.minWidth = '1200px';
    
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const thEjercicio = document.createElement('th');
    thEjercicio.textContent = 'Ejercicio';
    thEjercicio.style.position = 'sticky';
    thEjercicio.style.left = '0';
    thEjercicio.style.background = 'var(--color-oscuro)';
    thEjercicio.style.zIndex = '10';
    headerRow.appendChild(thEjercicio);
    
    // Agregar columnas para semanas 1-6
    for (let i = 1; i <= 6; i++) {
        const th = document.createElement('th');
        th.colSpan = 6; // Series, Reps, Peso, t1, t2, t3
        th.textContent = `Semana ${i}`;
        headerRow.appendChild(th);
    }
    
    const thAcciones = document.createElement('th');
    thAcciones.textContent = 'Acciones';
    thAcciones.style.position = 'sticky';
    thAcciones.style.right = '0';
    thAcciones.style.background = 'var(--color-oscuro)';
    thAcciones.style.zIndex = '10';
    headerRow.appendChild(thAcciones);
    
    thead.appendChild(headerRow);
    
    // Segunda fila de headers (subcabeceras)
    const subHeaderRow = document.createElement('tr');
    
    const thEjercicioSub = document.createElement('th');
    thEjercicioSub.textContent = '';
    thEjercicioSub.style.position = 'sticky';
    thEjercicioSub.style.left = '0';
    thEjercicioSub.style.background = 'var(--color-oscuro)';
    thEjercicioSub.style.zIndex = '10';
    subHeaderRow.appendChild(thEjercicioSub);
    
    for (let i = 1; i <= 6; i++) {
        ['Series', 'Reps', 'Peso', 't1', 't2', 't3'].forEach(label => {
            const th = document.createElement('th');
            th.textContent = label;
            th.style.fontSize = '11px';
            subHeaderRow.appendChild(th);
        });
    }
    
    const thAccionesSub = document.createElement('th');
    thAccionesSub.textContent = '';
    thAccionesSub.style.position = 'sticky';
    thAccionesSub.style.right = '0';
    thAccionesSub.style.background = 'var(--color-oscuro)';
    thAccionesSub.style.zIndex = '10';
    subHeaderRow.appendChild(thAccionesSub);
    
    thead.appendChild(subHeaderRow);
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    
    lista.ejercicios.forEach((ejercicio, indexEjercicio) => {
        const row = document.createElement('tr');
        
        const tdNombre = document.createElement('td');
        tdNombre.style.position = 'sticky';
        tdNombre.style.left = '0';
        tdNombre.style.background = 'white';
        tdNombre.style.zIndex = '5';
        const inputNombre = document.createElement('input');
        inputNombre.type = 'text';
        inputNombre.value = ejercicio.nombre;
        inputNombre.onchange = (e) => {ejercicio.nombre = e.target.value;};
        tdNombre.appendChild(inputNombre);
        row.appendChild(tdNombre);
        
        // Campos de semana 1-6
        for (let i = 1; i <= 6; i++) {
            const semanaKey = `semana${i}`;
            
            // Series
            const tdSeries = document.createElement('td');
            const inputSeries = document.createElement('input');
            inputSeries.type = 'number';
            inputSeries.placeholder = 'S';
            inputSeries.style.width = '50px';
            inputSeries.value = ejercicio[semanaKey].series;
            inputSeries.onchange = (e) => {ejercicio[semanaKey].series = e.target.value;};
            tdSeries.appendChild(inputSeries);
            row.appendChild(tdSeries);
            
            // Reps
            const tdReps = document.createElement('td');
            const inputReps = document.createElement('input');
            inputReps.type = 'number';
            inputReps.placeholder = 'R';
            inputReps.style.width = '50px';
            inputReps.value = ejercicio[semanaKey].repeticiones;
            inputReps.onchange = (e) => {ejercicio[semanaKey].repeticiones = e.target.value;};
            tdReps.appendChild(inputReps);
            row.appendChild(tdReps);
            
            // Peso
            const tdPeso = document.createElement('td');
            const inputPeso = document.createElement('input');
            inputPeso.type = 'number';
            inputPeso.placeholder = 'P';
            inputPeso.style.width = '50px';
            inputPeso.value = ejercicio[semanaKey].peso;
            inputPeso.onchange = (e) => {ejercicio[semanaKey].peso = e.target.value;};
            tdPeso.appendChild(inputPeso);
            row.appendChild(tdPeso);
            
            // t1, t2, t3
            ['t1', 't2', 't3'].forEach(t => {
                const td = document.createElement('td');
                const input = document.createElement('input');
                input.type = 'text';
                input.placeholder = t;
                input.style.width = '50px';
                input.value = ejercicio[semanaKey][t] || '';
                input.onchange = (e) => {
                    if (!ejercicio[semanaKey][t]) ejercicio[semanaKey][t] = '';
                    ejercicio[semanaKey][t] = e.target.value;
                };
                td.appendChild(input);
                row.appendChild(td);
            });
        }
        
        const tdAcciones = document.createElement('td');
        tdAcciones.style.position = 'sticky';
        tdAcciones.style.right = '0';
        tdAcciones.style.background = 'white';
        tdAcciones.style.zIndex = '5';
        const btnEliminar = document.createElement('button');
        btnEliminar.className = 'btn btn-danger';
        btnEliminar.textContent = 'Eliminar';
        btnEliminar.onclick = () => eliminarEjercicio(indexLista, indexEjercicio);
        tdAcciones.appendChild(btnEliminar);
        row.appendChild(tdAcciones);
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    tableWrapper.appendChild(table);
    return tableWrapper;
}

function agregarEjercicio(indexLista) {
    const nombre = prompt('Nombre del ejercicio (Ej: Sentadillas):');
    if (!nombre) return;
    
    const nuevoEjercicio = {
        nombre: nombre,
        semana1: { series: '3', repeticiones: '10', peso: '40', t1: '', t2: '', t3: '' },
        semana2: { series: '3', repeticiones: '10', peso: '45', t1: '', t2: '', t3: '' },
        semana3: { series: '3', repeticiones: '8', peso: '50', t1: '', t2: '', t3: '' },
        semana4: { series: '4', repeticiones: '8', peso: '50', t1: '', t2: '', t3: '' },
        semana5: { series: '4', repeticiones: '6', peso: '55', t1: '', t2: '', t3: '' },
        semana6: { series: '4', repeticiones: '6', peso: '60', t1: '', t2: '', t3: '' }
    };
    
    tablaEnEdicion.listas[indexLista].ejercicios.push(nuevoEjercicio);
    renderizarListas();
}

function eliminarEjercicio(indexLista, indexEjercicio) {
    if (confirm('¿Está seguro de eliminar este ejercicio?')) {
        tablaEnEdicion.listas[indexLista].ejercicios.splice(indexEjercicio, 1);
        renderizarListas();
    }
}

function eliminarLista(indexLista) {
    if (confirm('¿Está seguro de eliminar esta lista completa?')) {
        tablaEnEdicion.listas.splice(indexLista, 1);
        renderizarListas();
    }
}

async function guardarTabla() {
    const tablas = await cargarTablas();
    
    if (tipoTablaEnEdicion === 'general') {
        tablas.generales[indiceTablaEnEdicion] = tablaEnEdicion;
    } else {
        const usuario = tipoTablaEnEdicion.split('-')[1];
        tablas.individuales[usuario][indiceTablaEnEdicion] = tablaEnEdicion;
    }
    
    const guardado = await guardarTablasEnServidor(tablas);
    if (guardado) {
        alert('Tabla guardada correctamente');
        mostrarTablasExistentes();
    }
}

function descargarPDFAdmin() {
    if (!tablaEnEdicion) {
        alert('No hay tabla en edición');
        return;
    }
    window.print();
}

function cerrarSesion() {
    localStorage.removeItem('usuarioActual');
    localStorage.removeItem('deporteSeleccionado');
    window.location.href = 'index.html';
}