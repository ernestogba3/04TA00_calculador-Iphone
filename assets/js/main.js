// ─── ESTADO DE LA CALCULADORA ───────────────────────────────────────────────
let primerNumero = '';
let operadorActual = '';
let esperandoSegundo = false;
let operacionRealizada = false;

// ─── ELEMENTOS DEL DOM ──────────────────────────────────────────────────────
const pantalla = document.getElementById('texto');
const botonesNum = document.querySelectorAll('.num');
const botonIgual = document.getElementById('igual');
const botonSumar = document.getElementById('sumar');
const botonRestar = document.getElementById('restar');
const botonMultiplicar = document.getElementById('multiplicar');
const botonDividir = document.getElementById('dividir');
const botonesGrisClaro = document.querySelectorAll('.grisClaro');
const botonesOperadorExtra = document.querySelectorAll('.operador');

// ─── FUNCIONES AUXILIARES ────────────────────────────────────────────────────

function actualizarPantalla(valor) {
    pantalla.value = valor;
}

function obtenerValorPantalla() {
    // Reemplaza coma por punto para que parseFloat funcione correctamente
    return parseFloat(pantalla.value.replace(',', '.'));
}

function formatearResultado(num) {
    // Evita decimales infinitos (ej: 1/3 = 0.3333...)
    if (!isFinite(num)) return 'Error';
    const str = parseFloat(num.toFixed(10)).toString();
    // Devuelve con coma si hay decimales (estilo europeo)
    return str.replace('.', ',');
}

// ─── BOTONES NUMÉRICOS ───────────────────────────────────────────────────────
botonesNum.forEach(boton => {
    boton.addEventListener('click', () => {
        const valor = boton.textContent.trim();

        // Evita doble coma
        if (valor === ',' && pantalla.value.includes(',')) return;

        if (esperandoSegundo || operacionRealizada) {
            actualizarPantalla(valor === ',' ? '0,' : valor);
            esperandoSegundo = false;
            operacionRealizada = false;
        } else {
            const actual = pantalla.value;
            if (actual === '0' && valor !== ',') {
                actualizarPantalla(valor);
            } else {
                actualizarPantalla(actual + valor);
            }
        }
    });
});

// ─── BOTONES DE OPERADOR BÁSICO (+, -, ×, ÷) ────────────────────────────────
function manejarOperador(operador) {
    // Si ya hay una operación pendiente, calcula antes de continuar
    if (operadorActual && !esperandoSegundo) {
        calcular();
    }
    primerNumero = pantalla.value;
    operadorActual = operador;
    esperandoSegundo = true;
    operacionRealizada = false;
}

botonSumar.addEventListener('click', () => manejarOperador('+'));
botonRestar.addEventListener('click', () => manejarOperador('-'));
botonMultiplicar.addEventListener('click', () => manejarOperador('*'));
botonDividir.addEventListener('click', () => manejarOperador('/'));

// ─── BOTÓN IGUAL (=) ─────────────────────────────────────────────────────────
function calcular() {
    if (!operadorActual || esperandoSegundo) return;

    const num1 = parseFloat(primerNumero.replace(',', '.'));
    const num2 = obtenerValorPantalla();
    let resultado;

    switch (operadorActual) {
        case '+': resultado = num1 + num2; break;
        case '-': resultado = num1 - num2; break;
        case '*': resultado = num1 * num2; break;
        case '/':
            resultado = num2 !== 0 ? num1 / num2 : 'Error';
            break;
        default: return;
    }

    actualizarPantalla(resultado === 'Error' ? 'Error' : formatearResultado(resultado));
    operadorActual = '';
    primerNumero = '';
    esperandoSegundo = false;
    operacionRealizada = true;
}

botonIgual.addEventListener('click', calcular);

// ─── BOTONES C, AC Y % ───────────────────────────────────────────────────────
botonesGrisClaro.forEach(boton => {
    boton.addEventListener('click', () => {
        const texto = boton.textContent.trim();

        if (texto === 'C') {
            // Borra el último carácter
            const actual = pantalla.value;
            if (actual.length > 1) {
                actualizarPantalla(actual.slice(0, -1));
            } else {
                actualizarPantalla('0');
            }
        }

        if (texto === 'AC') {
            // Resetea todo el estado
            actualizarPantalla('0');
            primerNumero = '';
            operadorActual = '';
            esperandoSegundo = false;
            operacionRealizada = false;
        }

        if (texto === '%') {
            const valor = obtenerValorPantalla();
            actualizarPantalla(formatearResultado(valor / 100));
        }
    });
});

// ─── BOTONES OPERADORES EXTRA (x², x³, π, √) ─────────────────────────────────
botonesOperadorExtra.forEach(boton => {
    boton.addEventListener('click', () => {
        const texto = boton.textContent.trim();
        const valor = obtenerValorPantalla();

        if (texto === 'x²') {
            actualizarPantalla(formatearResultado(Math.pow(valor, 2)));
            operacionRealizada = true;
        }

        if (texto === 'x³') {
            actualizarPantalla(formatearResultado(Math.pow(valor, 3)));
            operacionRealizada = true;
        }

        if (texto === 'PI') {
            actualizarPantalla(formatearResultado(Math.PI));
            operacionRealizada = true;
        }

        if (texto === '√') {
            if (valor < 0) {
                actualizarPantalla('Error');
            } else {
                actualizarPantalla(formatearResultado(Math.sqrt(valor)));
            }
            operacionRealizada = true;
        }
    });
});