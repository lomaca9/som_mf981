let bancoPreguntas = null;
let preguntasPartida = [];
let indiceActual = 0;
let contadorAciertos = 0;
let contadorErrores = 0;

// Configuración de la partida (salta a la pantalla de resultados tras 10 preguntas)
const TOTAL_PREGUNTAS_PARTIDA = 10;

// Recuerda el archivo activo para saber cómo recargar la categoría
let categoriaActual = '';

// Arranca el juego cargando el JSON correspondiente de forma dinámica según el botón
async function iniciarJuego(categoria) {
    categoriaActual = categoria;
    
    // Genera el nombre del archivo de forma automática (Ej: 'MF981_1.json')
    const archivoALeer = `./${categoria}.json`;

    try {
        const respuesta = await fetch(archivoALeer);
        if (!respuesta.ok) {
            throw new Error(`Error en servidor: ${respuesta.status} ${respuesta.statusText}`);
        }
        bancoPreguntas = await respuesta.json();
    } catch (error) {
        alert(`Error crítico al cargar el archivo ${archivoALeer}. Revisa que esté guardado en minúsculas en tu repositorio de GitHub.`);
        console.error(error);
        return;
    }

    // Buscamos las preguntas dentro del objeto raíz del archivo JSON
    const poolPreguntas = bancoPreguntas[categoria];
    if (!poolPreguntas) {
        alert(`Error: No se encontró la estructura interna "${categoria}" dentro de tu archivo JSON.`);
        return;
    }

    // Seleccionamos un máximo de 10 preguntas aleatorias de este archivo
    preguntasPartida = prepararPreguntasAleatorias(poolPreguntas, TOTAL_PREGUNTAS_PARTIDA);
    
    // Resetear estados de control
    indiceActual = 0;
    contadorAciertos = 0;
    contadorErrores = 0;

    // Actualizar los marcadores en tiempo real
    document.getElementById('vivo-aciertos').innerText = '0';
    document.getElementById('vivo-errores').innerText = '0';

    // Transición visual entre las pantallas del juego
    document.getElementById('pantalla-inicio').classList.add('oculto');
    document.getElementById('pantalla-resultados').classList.add('oculto');
    document.getElementById('pantalla-test').classList.remove('oculto');

    mostrarPregunta();
}

// Baraja las preguntas disponibles y recorta el array al número objetivo
function prepararPreguntasAleatorias(lista, cantidadMaxima) {
    const listaBarajada = [...lista].sort(() => Math.random() - 0.5);
    return listaBarajada.slice(0, Math.min(cantidadMaxima, listaBarajada.length));
}

// Muestra el enunciado de la pregunta y desordena las respuestas en el DOM
function mostrarPregunta() {
    document.getElementById('btn-siguiente').classList.add('oculto');
    
    const datosPregunta = preguntasPartida[indiceActual];
    
    // Actualizar barra de progreso del alumno
    document.getElementById('info-progreso').innerText = `Pregunta ${indiceActual + 1} de ${preguntasPartida.length}`;
    const porcentajeProgreso = (indiceActual / preguntasPartida.length) * 100;
    document.getElementById('linea-progreso').style.width = `${porcentajeProgreso}%`;

// 1. NUEVO: Inyectar el título del tema (Asegúrate de que en tu JSON la propiedad se llama "tema")
    document.getElementById('tema-pregunta').innerText = datosPregunta.tema || "General";
    
    // Inyectar el texto del enunciado
    document.getElementById('texto-pregunta').innerText = datosPregunta.pregunta;

    // Almacenar cuál es la respuesta correcta original
    const textoCorrecto = datosPregunta.opciones[datosPregunta.correcta];

    // Mapear y desordenar el set de respuestas
    const opcionesEstructuradas = datosPregunta.opciones.map(texto => ({
        texto: texto,
        esCorrecta: texto === textoCorrecto
    }));

    opcionesEstructuradas.sort(() => Math.random() - 0.5);

    // Limpiar e inyectar los nuevos botones en la interfaz gráfica
    const contenedor = document.getElementById('contenedor-opciones');
    contenedor.innerHTML = '';

    opcionesEstructuradas.forEach(opcion => {
        const boton = document.createElement('button');
        boton.className = 'btn-opcion';
        boton.innerText = opcion.texto;
        boton.onclick = () => verificarRespuesta(boton, opcion.esCorrecta, textoCorrecto);
        contenedor.appendChild(boton);
    });
}

// Evalúa si el alumno pulsó la opción correcta o incorrecta
function verificarRespuesta(botonSeleccionado, esCorrecta, textoCorrecto) {
    const todosLosBotones = document.querySelectorAll('.btn-opcion');
    
    // Bloquear el resto de opciones inmediatamente
    todosLosBotones.forEach(btn => btn.disabled = true);

    if (esCorrecta) {
        botonSeleccionado.classList.add('correcta');
        contadorAciertos++;
        document.getElementById('vivo-aciertos').innerText = contadorAciertos;
    } else {
        botonSeleccionado.classList.add('incorrecta');
        contadorErrores++;
        document.getElementById('vivo-errores').innerText = contadorErrores;

        // Ayuda visual revelando cuál era la respuesta correcta
        todosLosBotones.forEach(btn => {
            if (btn.innerText === textoCorrecto) {
                btn.classList.add('correcta');
            }
        });
    }

    document.getElementById('btn-siguiente').classList.remove('oculto');
}

// Avanza a la siguiente pregunta de la partida o finaliza si llegó al límite
function siguientePregunta() {
    indiceActual++;
    if (indiceActual < preguntasPartida.length) {
        mostrarPregunta();
    } else {
        finalizarEvaluacion();
    }
}

// Calcula y dibuja la nota final ponderada sobre 10
function finalizarEvaluacion() {
    document.getElementById('pantalla-test').classList.add('oculto');
    document.getElementById('pantalla-resultados').classList.remove('oculto');

    document.getElementById('aciertos').innerText = contadorAciertos;
    document.getElementById('errores').innerText = contadorErrores;

    const nota = (contadorAciertos / preguntasPartida.length) * 10;
    document.getElementById('nota-num').innerText = nota.toFixed(2);
}

// Redirige al alumno a la pantalla de selección de bloques con confirmación si está en partida
function volverAlInicio() {
    const pantallaTestOculta = document.getElementById('pantalla-test').classList.contains('oculto');

    // Si la pantalla de test NO está oculta, significa que el usuario está jugando un tema
    if (!pantallaTestOculta) {
        const confirmar = confirm("Segur que vols sortir i pràcticar altre tema?");
        if (!confirmar) {
            return; // Si el usuario cancela, no hace nada y continúa el test
        }
    }

    // Ocultar pantallas de juego y resultados
    document.getElementById('pantalla-test').classList.add('oculto');
    document.getElementById('pantalla-resultados').classList.add('oculto');
    
    // Mostrar la pantalla de inicio
    document.getElementById('pantalla-inicio').classList.remove('oculto');
}
