let usuarioActual = null;
let tablaEnEdicion = null;
let indiceTablaEnEdicion = null;
let tipoTablaEnEdicion = null;
const API_URL = 'https://pef-2pzu.onrender.com/api';
window.addEventListener('DOMContentLoaded', function() {
    verificarSesion();
    cargarUsuarios();
    mostrarTablasExistentes();});
function verificarSesion() {
    const sesion = localStorage.getItem('usuarioActual');
    if (!sesion) {window.location.href = 'index.html';return;}
    usuarioActual = JSON.parse(sesion);
    if (usuarioActual.tipo !== 'admin') {window.location.href = 'usuarios.html';return;}}
async function cargarUsuarios() {
    try {
        const response = await fetch(`${API_URL}/usuarios`);
        if (!response.ok) {throw new Error('No se pudieron cargar usuarios');}
        const usuarios = await response.json();
        const selector = document.getElementById('usuarioDestino');
        selector.innerHTML = '';
        const usuariosNormales = usuarios.filter(u => u.tipo === 'user');
        if (usuariosNormales.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No hay usuarios disponibles';
            selector.appendChild(option);
            return;}
        usuariosNormales.forEach(usuario => {
            const option = document.createElement('option');
            option.value = usuario.nombre;
            option.textContent = usuario.nombre;
            selector.appendChild(option);});} catch (error) {
        console.error('Error al cargar usuarios:', error);
        alert('Error: No se pudo conectar con el servidor');}}
function mostrarCampoUsuario() {
    const tipo = document.getElementById('tipoTabla').value;
    const campo = document.getElementById('campoUsuario');    
    if (tipo === 'individual') {campo.style.display = 'block';} else {campo.style.display = 'none';}}
async function crearNuevaTabla() {
    const tipo = document.getElementById('tipoTabla').value;
    const nombre = document.getElementById('nombreTabla').value.trim();
    if (!nombre) {alert('Por favor ingrese un nombre para la tabla');return;}
    const nuevaTabla = {nombre: nombre,listas: []};
    const tablas = await cargarTablas();    
    if (tipo === 'general') {
        tablas.generales.push(nuevaTabla);
        indiceTablaEnEdicion = tablas.generales.length - 1;
        tipoTablaEnEdicion = 'general';} else {
        const usuario = document.getElementById('usuarioDestino').value;
        if (!tablas.individuales[usuario]) {tablas.individuales[usuario] = [];}
        tablas.individuales[usuario].push(nuevaTabla);
        indiceTablaEnEdicion = tablas.individuales[usuario].length - 1;
        tipoTablaEnEdicion = `individual-${usuario}`;}
    await guardarTablasEnServidor(tablas);
    tablaEnEdicion = nuevaTabla;
    mostrarEditor();
    mostrarTablasExistentes();
    document.getElementById('nombreTabla').value = '';}
async function cargarTablas() {
    try {
        const response = await fetch(`${API_URL}/tablas`);
        if (!response.ok) {throw new Error('No se pudieron cargar las tablas');}
        const tablas = await response.json();
        return tablas;} catch (error) {
        console.error('Error al cargar tablas:', error);
        return { generales: [], individuales: {} };}}
async function guardarTablasEnServidor(tablas) {
    try {
        const response = await fetch(`${API_URL}/tablas`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(tablas)});
        if (!response.ok) {throw new Error('No se pudieron guardar las tablas');}
        return true;} catch (error) {
        console.error('Error al guardar tablas:', error);
        alert('Error al guardar en el servidor');
        return false;}}
async function mostrarTablasExistentes() {
    const contenedor = document.getElementById('tablasExistentes');
    contenedor.innerHTML = '';    
    const tablas = await cargarTablas();
    if (tablas.generales.length > 0) {
        tablas.generales.forEach((tabla, index) => {
            const card = crearTarjetaTabla(tabla, 'general', index);
            contenedor.appendChild(card);});}
    Object.keys(tablas.individuales).forEach(usuario => {
        tablas.individuales[usuario].forEach((tabla, index) => {
            const card = crearTarjetaTabla(tabla, `individual-${usuario}`, index);
            contenedor.appendChild(card);});});
    if (contenedor.children.length === 0) {contenedor.innerHTML = '<p>No hay tablas creadas aún</p>';}}
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
    return card;}
async function eliminarTabla(tipo, index) {
    if (!confirm('¿Está seguro de que desea eliminar esta tabla? Esta acción no se puede deshacer.')) {return;}
    const tablas = await cargarTablas();
    if (tipo === 'general') {tablas.generales.splice(index, 1);} else {
        const usuario = tipo.split('-')[1];
        if (tablas.individuales[usuario]) {
            tablas.individuales[usuario].splice(index, 1);
            if (tablas.individuales[usuario].length === 0) {delete tablas.individuales[usuario];}}}
    const guardado = await guardarTablasEnServidor(tablas);
    if (guardado) {
        alert('Tabla eliminada correctamente');
        mostrarTablasExistentes();
        if (tablaEnEdicion) {cerrarEditor();}}}
async function editarTabla(tipo, index) {
    const tablas = await cargarTablas();
    if (tipo === 'general') {
        tablaEnEdicion = tablas.generales[index];
        tipoTablaEnEdicion = 'general';
        indiceTablaEnEdicion = index;} else {
        const usuario = tipo.split('-')[1];
        tablaEnEdicion = tablas.individuales[usuario][index];
        tipoTablaEnEdicion = tipo;
        indiceTablaEnEdicion = index;}
    mostrarEditor();}
function mostrarEditor() {
    document.getElementById('nombreTablaEditor').textContent = tablaEnEdicion.nombre;
    document.getElementById('editorTabla').style.display = 'block';
    document.getElementById('panelCreacion').style.display = 'none';
    renderizarListas();}
function cerrarEditor() {
    document.getElementById('editorTabla').style.display = 'none';
    document.getElementById('panelCreacion').style.display = 'block';
    tablaEnEdicion = null;}
function agregarLista() {
    const titulo = prompt('Ingrese el título de la lista (Ej: Ejercicios de piernas):');    
    if (!titulo) return;    
    const nuevaLista = {titulo: titulo,ejercicios: []};
    tablaEnEdicion.listas.push(nuevaLista);
    renderizarListas();}
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
            listaDiv.appendChild(table);}
        contenedor.appendChild(listaDiv);});}
function crearTablaEjercicios(lista, indexLista) {
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');    
    const thEjercicio = document.createElement('th');
    thEjercicio.textContent = 'Ejercicio';
    headerRow.appendChild(thEjercicio);    
    for (let i = 1; i <= 6; i++) {
        const th = document.createElement('th');
        th.textContent = `Semana ${i}`;
        headerRow.appendChild(th);}    
    const thAcciones = document.createElement('th');
    thAcciones.textContent = 'Acciones';
    headerRow.appendChild(thAcciones);    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');    
    lista.ejercicios.forEach((ejercicio, indexEjercicio) => {
        const row = document.createElement('tr');
        const tdNombre = document.createElement('td');
        const inputNombre = document.createElement('input');
        inputNombre.type = 'text';
        inputNombre.value = ejercicio.nombre;
        inputNombre.onchange = (e) => {ejercicio.nombre = e.target.value;};
        tdNombre.appendChild(inputNombre);
        row.appendChild(tdNombre);
        for (let i = 1; i <= 6; i++) {
            const td = document.createElement('td');
            td.className = 'semana-datos';
            const semanaKey = `semana${i}`;            
            const inputSeries = document.createElement('input');
            inputSeries.type = 'number';
            inputSeries.placeholder = 'Series';
            inputSeries.value = ejercicio[semanaKey].series;
            inputSeries.onchange = (e) => {ejercicio[semanaKey].series = e.target.value;};
            const inputReps = document.createElement('input');
            inputReps.type = 'number';
            inputReps.placeholder = 'Reps';
            inputReps.value = ejercicio[semanaKey].repeticiones;
            inputReps.onchange = (e) => {ejercicio[semanaKey].repeticiones = e.target.value;};
            const inputPeso = document.createElement('input');
            inputPeso.type = 'number';
            inputPeso.placeholder = 'Peso (kg)';
            inputPeso.value = ejercicio[semanaKey].peso;
            inputPeso.onchange = (e) => {ejercicio[semanaKey].peso = e.target.value;};
            td.appendChild(inputSeries);
            td.appendChild(inputReps);
            td.appendChild(inputPeso);
            row.appendChild(td);}
        const tdAcciones = document.createElement('td');
        const btnEliminar = document.createElement('button');
        btnEliminar.className = 'btn btn-danger';
        btnEliminar.textContent = 'Eliminar';
        btnEliminar.onclick = () => eliminarEjercicio(indexLista, indexEjercicio);
        tdAcciones.appendChild(btnEliminar);
        row.appendChild(tdAcciones);
        tbody.appendChild(row);});
    table.appendChild(tbody);
    return table;}
function agregarEjercicio(indexLista) {
    const nombre = prompt('Nombre del ejercicio (Ej: Sentadillas):');
    if (!nombre) return;
    const nuevoEjercicio = {
        nombre: nombre,
        semana1: { series: '3', repeticiones: '10', peso: '40' },
        semana2: { series: '3', repeticiones: '10', peso: '45' },
        semana3: { series: '3', repeticiones: '8', peso: '50' },
        semana4: { series: '4', repeticiones: '8', peso: '50' },
        semana5: { series: '4', repeticiones: '6', peso: '55' },
        semana6: { series: '4', repeticiones: '6', peso: '60' }};
    tablaEnEdicion.listas[indexLista].ejercicios.push(nuevoEjercicio);
    renderizarListas();}
function eliminarEjercicio(indexLista, indexEjercicio) {
    if (confirm('¿Está seguro de eliminar este ejercicio?')) {
        tablaEnEdicion.listas[indexLista].ejercicios.splice(indexEjercicio, 1);
        renderizarListas();}}
function eliminarLista(indexLista) {
    if (confirm('¿Está seguro de eliminar esta lista completa?')) {
        tablaEnEdicion.listas.splice(indexLista, 1);renderizarListas();}}
async function guardarTabla() {
    const tablas = await cargarTablas();
    if (tipoTablaEnEdicion === 'general') {
        tablas.generales[indiceTablaEnEdicion] = tablaEnEdicion;} else {
        const usuario = tipoTablaEnEdicion.split('-')[1];
        tablas.individuales[usuario][indiceTablaEnEdicion] = tablaEnEdicion;}
    const guardado = await guardarTablasEnServidor(tablas);
    if (guardado) {alert('Tabla guardada correctamente');mostrarTablasExistentes();}}
function descargarPDFAdmin() {
    if (!tablaEnEdicion) {alert('No hay tabla en edición');return;}window.print();}
function cerrarSesion() {
    localStorage.removeItem('usuarioActual');
    window.location.href = 'index.html';}