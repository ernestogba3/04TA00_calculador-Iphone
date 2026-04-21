class Calculadora {
    constructor() {
        this.expresion    = '';
        this.resultado    = '0';
        this.nuevaEntrada = true;
        this.errorActivo  = false;

        this.displayEl = document.getElementById('display');
        this.exprEl    = document.getElementById('expression'); // línea superior del display

        this._bindEventos();
    }

    /* ─────────────────────────────────────────────
       BINDING DE EVENTOS
       ─────────────────────────────────────────────
       FIX #1: El selector era '.button' (no existe).
               Ahora escuchamos en '.calculator', que
               siempre existe y engloba todos los botones.
       FIX #2: Ya no leemos textContent sino los atributos
               data-num / data-op / data-action / data-sci,
               que son los que usa el HTML.
    ───────────────────────────────────────────── */
    _bindEventos() {
        document.querySelector('.calculator').addEventListener('click', e => {
            const btn = e.target.closest('button');
            if (!btn) return;
            this._procesarBoton(btn);
        });

        document.addEventListener('keydown', e => this._procesarTecla(e));
    }

    /* Lee los data-attributes del botón pulsado */
    _procesarBoton(btn) {
        const num    = btn.dataset.num;    // '0'–'9' o '.'
        const op     = btn.dataset.op;     // '+' '-' '*' '/'
        const action = btn.dataset.action; // 'clear' | 'back' | 'equals'
        const sci    = btn.dataset.sci;    // 'sin' | 'pi' | 'sqrt' …

        if (num    !== undefined) { this.ingresarDigito(num);      return; }
        if (op     !== undefined) { this.ingresarOperador(op);     return; }
        if (sci    !== undefined) { this.ingresarCientifico(sci);  return; }

        if (action === 'clear')  { this.limpiar();  return; }
        if (action === 'back')   { this.borrar();   return; }
        if (action === 'equals') { this.calcular(); return; }
    }

    /* Teclado físico */
    _procesarTecla(e) {
        const k = e.key;
        if (/^[0-9]$/.test(k) || k === '.')             this.ingresarDigito(k);
        else if (['+', '-', '*', '/'].includes(k))       this.ingresarOperador(k);
        else if (k === '^')                              this.ingresarOperador('^');
        else if (k === 'Enter' || k === '=')             this.calcular();
        else if (k === 'Backspace')                      this.borrar();
        else if (k === 'Escape')                         this.limpiar();
    }

    /* ─────────────────────────────────────────────
       ENTRADA DE DÍGITOS
    ───────────────────────────────────────────── */
    ingresarDigito(digito) {
        if (this.errorActivo) this.limpiar();

        if (this.nuevaEntrada) {
            this.expresion    = digito === '.' ? '0.' : digito;
            this.nuevaEntrada = false;
        } else {
            if (digito === '.' && this._ultimoNumero().includes('.')) return;
            this.expresion += digito;
        }

        this._actualizarDisplay(this.expresion);
    }

    /* ─────────────────────────────────────────────
       OPERADORES  + - * / ^
    ───────────────────────────────────────────── */
    ingresarOperador(op) {
        if (this.errorActivo) return;

        // Número negativo al inicio
        if (this.expresion === '' && op === '-') {
            this.expresion    = '-';
            this.nuevaEntrada = false;
            this._actualizarDisplay(this.expresion);
            return;
        }

        // Si no hay nada escrito, partir del último resultado
        if (this.expresion === '') this.expresion = this.resultado;

        // Sustituir operador si el anterior no se completó
        if (this._terminaEnOperador()) {
            this.expresion = this.expresion.slice(0, -1) + op;
        } else {
            this.expresion += op;
        }

        this.nuevaEntrada = false;
        this._actualizarDisplay(this.expresion);
    }

    /* ─────────────────────────────────────────────
       FUNCIONES CIENTÍFICAS
       ─────────────────────────────────────────────
       FIX #3: El HTML usa data-sci con valores como
               'pi', 'sqrt', 'pow', 'pct', 'ln', 'e'
               que antes no estaban contemplados.
    ───────────────────────────────────────────── */
    ingresarCientifico(tipo) {
        if (this.errorActivo) this.limpiar();

        switch (tipo) {
            // Constantes
            case 'pi':
                this.expresion   += this._hayNumeroAntes() ? '*π' : 'π';
                this.nuevaEntrada = false;
                break;

            case 'e':
                this.expresion   += this._hayNumeroAntes() ? '*ℯ' : 'ℯ';
                this.nuevaEntrada = false;
                break;

            // Potencia: inserta el operador ^
            case 'pow':
                if (this.expresion === '') this.expresion = this.resultado;
                if (!this._terminaEnOperador()) this.expresion += '^';
                this.nuevaEntrada = false;
                break;

            // Porcentaje
            case 'pct':
                if (this.expresion !== '') {
                    this.expresion   += '%';
                    this.nuevaEntrada = false;
                }
                break;

            // Paréntesis
            case '(':
                this.expresion   += '(';
                this.nuevaEntrada = false;
                break;

            case ')':
                this.expresion   += ')';
                this.nuevaEntrada = false;
                break;

            // Raíz cuadrada
            case 'sqrt':
                this.expresion   += '√(';
                this.nuevaEntrada = false;
                break;

            // Funciones trigonométricas y logarítmicas
            // data-sci="sin" → sin(   data-sci="ln" → ln(   etc.
            default:
                this.expresion   += `${tipo}(`;
                this.nuevaEntrada = false;
                break;
        }

        this._actualizarDisplay(this.expresion);
    }

    /* ─────────────────────────────────────────────
       CALCULAR  =
       ─────────────────────────────────────────────
       FIX #4: Añadidas las traducciones que faltaban:
               asin, acos, atan, ln, ℯ (constante e)
    ───────────────────────────────────────────── */
    calcular() {
        if (this.expresion === '' || this.errorActivo) return;

        // Guardar la expresión visible antes de sobreescribirla
        this.exprEl.textContent = this._bonito(this.expresion) + ' =';

        try {
            let expr = this.expresion
                .replace(/π/g,     'Math.PI')
                .replace(/ℯ/g,     'Math.E')
                .replace(/asin\(/g,'Math.asin(')
                .replace(/acos\(/g,'Math.acos(')
                .replace(/atan\(/g,'Math.atan(')
                .replace(/sin\(/g, 'Math.sin(')
                .replace(/cos\(/g, 'Math.cos(')
                .replace(/tan\(/g, 'Math.tan(')
                .replace(/log\(/g, 'Math.log10(')
                .replace(/ln\(/g,  'Math.log(')
                .replace(/√\(/g,   'Math.sqrt(')
                .replace(/\^/g,    '**')
                .replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');

            // Cerrar paréntesis sin cerrar
            const abiertos = (expr.match(/\(/g) || []).length;
            const cerrados = (expr.match(/\)/g) || []).length;
            expr += ')'.repeat(Math.max(0, abiertos - cerrados));

            // eslint-disable-next-line no-new-func
            const res = Function('"use strict"; return (' + expr + ')')();

            if (!isFinite(res)) throw new Error('División entre cero');

            this.resultado    = this._formatearResultado(res);
            this.expresion    = this.resultado;
            this.nuevaEntrada = true;
            this.errorActivo  = false;

        } catch {
            this.resultado    = 'Error';
            this.expresion    = '';
            this.nuevaEntrada = true;
            this.errorActivo  = true;
            this.exprEl.textContent = '';
        }

        this._actualizarDisplay(this.resultado);
    }

    /* ─────────────────────────────────────────────
       LIMPIAR  C
    ───────────────────────────────────────────── */
    limpiar() {
        this.expresion    = '';
        this.resultado    = '0';
        this.nuevaEntrada = true;
        this.errorActivo  = false;
        this.exprEl.textContent = '';
        this._actualizarDisplay('0');
    }

    /* Borrar último carácter  ⌫ */
    borrar() {
        if (this.nuevaEntrada || this.errorActivo) { this.limpiar(); return; }
        this.expresion = this.expresion.slice(0, -1);
        this._actualizarDisplay(this.expresion || '0');
    }

    /* ─────────────────────────────────────────────
       HELPERS
    ───────────────────────────────────────────── */
    _terminaEnOperador() {
        return /[+\-*/^]$/.test(this.expresion);
    }

    _hayNumeroAntes() {
        return this.expresion !== '' && !this._terminaEnOperador();
    }

    _ultimoNumero() {
        const m = this.expresion.match(/[0-9.]+$/);
        return m ? m[0] : '';
    }

    _formatearResultado(n) {
        if (n === 0) return '0';
        if (Math.abs(n) >= 1e-10 && Math.abs(n) < 1e15) {
            return parseFloat(n.toFixed(10)).toString();
        }
        return n.toExponential(6);
    }

    /* Sustituye operadores internos por símbolos legibles para el display */
    _bonito(valor) {
        return (valor || '0')
            .replace(/\*/g, '×')
            .replace(/\//g, '÷')
            .replace(/-/g,  '−');
    }

    _actualizarDisplay(valor) {
        this.displayEl.textContent = this._bonito(valor);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const calc = new Calculadora();
});