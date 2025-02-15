



// ===================
// Classe Base Node
// Responsável pela posição, dimensões e detecção de cliques
// ===================
class Node {
    constructor(x, y, width = NODE_WIDTH, height = NODE_HEIGHT) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    }
    
    contains(x, y) {
      return (
        x >= this.x &&
        x <= this.x + this.width &&
        y >= this.y &&
        y <= this.y + this.height
      );
    }
    
    setPosition(x, y) {
      this.x = x;
      this.y = y;
    }
  }

// ===================
// Classe LogicGate
// Porta lógica customizável usando uma função lambda
// ===================
class LogicGate extends Node {
    /**
     * @param {number} x - Posição X da porta.
     * @param {number} y - Posição Y da porta.
     * @param {function} logicFunction - Função lambda que recebe os estados de entrada e retorna o estado de saída (se numOutputs==1)
     *                                   ou um array de estados (se numOutputs > 1).
     * @param {string} label - Rótulo para exibição (ex.: "AND", "OR", "NOT").
     * @param {number} numInputs - Número de entradas (padrão 2).
     * @param {number} numOutputs - Número de saídas (padrão 1).
     */
    constructor(x, y, logicFunction, label = "", numInputs = 2, numOutputs = 1) {
    super(x, y);
    this.logicFunction = logicFunction;
    this.label = label;
    this.numInputs = numInputs;
    this.numOutputs = numOutputs;
    
    // Inicializa os pinos de entrada e saída
    this.updateInputs();
    this.updateOutputs();

    // Zera os estados das entradas
    this.inputStates = new Array(this.inputs.length).fill(false);

    // Avalia a função lógica inicial
    this.evaluate();
    }

    updateInputs() {
    this.inputs = [];
    if (this.numInputs === 1) {
        this.inputs.push({ x: this.x - PIN_OFFSET, y: this.y + this.height / 2 });
    } else {
        const spacing = this.height / (this.numInputs + 1);
        for (let i = 0; i < this.numInputs; i++) {
        this.inputs.push({
            x: this.x - PIN_OFFSET,
            y: this.y + (i + 1) * spacing
        });
        }
    }
    }

    updateOutputs() {
    this.outputs = [];
    if (this.numOutputs === 1) {
        this.outputs.push({ x: this.x + this.width, y: this.y + this.height / 2 });
    } else {
        const spacing = this.height / (this.numOutputs + 1);
        for (let i = 0; i < this.numOutputs; i++) {
        this.outputs.push({
            x: this.x + this.width,
            y: this.y + (i + 1) * spacing
        });
        }
    }
    }

    updateOutput(){
        this.updateOutputs();
    }

    evaluate() {
    // Executa a função lógica com os estados de entrada
    const result = this.logicFunction(...this.inputStates);
    if (this.numOutputs === 1) {
        this.outputState = result;
    } else if (Array.isArray(result) && result.length === this.numOutputs) {
        this.outputStates = result;
    } else {
        console.error("A função lógica deve retornar um array com comprimento igual a numOutputs.");
        this.outputStates = new Array(this.numOutputs).fill(false);
    }
    }

    draw(ctx, highlighted) {
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.fillStyle = "#444";
    ctx.strokeStyle = "#888";
    ctx.lineWidth = BORDER_WIDTH;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.strokeRect(0, 0, this.width, this.height);

    ctx.fillStyle = FONT_COLOR;
    ctx.font = FONT;
    ctx.textAlign = "center";
    ctx.fillText(this.label || "GATE", this.width / 2, this.height / 2 + 5);

    // Desenha os pinos de entrada
    this.inputs.forEach((input) => {
        drawPin(ctx, input.x - this.x, input.y - this.y, highlighted === input);
    });

    // Desenha os pinos de saída
    this.outputs.forEach((output, index) => {
        let isHighlighted = false;
        if (highlighted && highlighted.piece === this && highlighted.index === index) {
        isHighlighted = true;
        }
        drawPin(ctx, output.x - this.x, output.y - this.y, isHighlighted);
    });

    ctx.restore();
    }

    isInputClicked(x, y) {
    return this.inputs.find(
        (input) => Math.hypot(input.x - x, input.y - y) <= PIN_RADIUS
    );
    }

    isOutputClicked(x, y) {
    for (let i = 0; i < this.outputs.length; i++) {
        const output = this.outputs[i];
        if (Math.hypot(output.x - x, output.y - y) <= PIN_RADIUS) {
        return { piece: this, index: i, x: output.x, y: output.y };
        }
    }
    return null;
    }
}


// ===================
// Classe Button
// Botão tradicional que alterna seu estado
// ===================
class Button extends Node {
constructor(x, y) {
    super(x, y);
    this.type = "BUTTON";
    this.state = false;
    this.output = { piece: this, x: this.x + this.width, y: this.y + this.height / 2 };
    this.outputState = this.state;
}

updateOutput() {
    this.output = { piece: this, x: this.x + this.width, y: this.y + this.height / 2 };
}

toggleState() {
    this.state = !this.state;
    this.outputState = this.state;
}

evaluate() {
    this.outputState = this.state;
}

draw(ctx, highlighted) {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    ctx.fillStyle = this.state ? "#00cc00" : "#444";
    ctx.strokeStyle = "#888";
    ctx.lineWidth = BORDER_WIDTH;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.strokeRect(0, 0, this.width, this.height);
    
    ctx.fillStyle = FONT_COLOR;
    ctx.font = FONT;
    ctx.textAlign = "center";
    ctx.fillText("BUTTON", this.width / 2, this.height / 2 + 5);
    
    if (this.output) {
    drawPin(ctx, this.output.x - this.x, this.output.y - this.y, highlighted === this.output);
    }
    
    ctx.restore();
}

isOutputClicked(x, y) {
    return this.output && Math.hypot(this.output.x - x, this.output.y - y) <= PIN_RADIUS
    ? this.output
    : null;
}
}

// ===================
// Classe MomentaryButton
// Botão que permanece ativo enquanto pressionado
// ===================
class MomentaryButton extends Node {
constructor(x, y) {
    super(x, y, 100);
    this.type = "MOMENTARY";
    this.state = false;
    this.output = { piece: this, x: this.x + this.width, y: this.y + this.height / 2 };
    this.outputState = this.state;
}

updateOutput() {
    this.output = { piece: this, x: this.x + this.width, y: this.y + this.height / 2 };
}

press() {
    this.state = true;
    this.outputState = true;
}

release() {
    this.state = false;
    this.outputState = false;
}

evaluate() {
    this.outputState = this.state;
}

draw(ctx, highlighted) {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    ctx.fillStyle = this.state ? "#00cc00" : "#444";
    ctx.strokeStyle = "#888";
    ctx.lineWidth = BORDER_WIDTH;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.strokeRect(0, 0, this.width, this.height);
    
    ctx.fillStyle = FONT_COLOR;
    ctx.font = FONT;
    ctx.textAlign = "center";
    ctx.fillText("MOMENTARY", this.width / 2, this.height / 2 + 5);
    
    if (this.output) {
    drawPin(ctx, this.output.x - this.x, this.output.y - this.y, highlighted === this.output);
    }
    
    ctx.restore();
}

isOutputClicked(x, y) {
    return this.output && Math.hypot(this.output.x - x, this.output.y - y) <= PIN_RADIUS
    ? this.output
    : null;
}
}

// ===================
// Classe Light
// Representa uma luz que acende ou apaga conforme seu sinal de entrada
// ===================
class Light extends Node {
constructor(x, y) {
    super(x, y);
    this.type = "LIGHT";
    this.state = false;
    this.inputs = [{ x: this.x - PIN_OFFSET, y: this.y + this.height / 2 }];
    this.inputStates = [false];
    this.output = null;
}

updateInputs() {
    this.inputs = [{ x: this.x - PIN_OFFSET, y: this.y + this.height / 2 }];
    this.inputStates = [false];
}

evaluate() {
    this.state = Boolean(this.inputStates[0]);
}

draw(ctx, highlighted) {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    ctx.fillStyle = this.state ? "#ffff00" : "#444";
    ctx.strokeStyle = "#888";
    ctx.lineWidth = BORDER_WIDTH;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.strokeRect(0, 0, this.width, this.height);
    
    ctx.fillStyle = FONT_COLOR;
    ctx.font = FONT;
    ctx.textAlign = "center";
    ctx.fillText("LIGHT", this.width / 2, this.height / 2 + 5);
    
    this.inputs.forEach(input => {
    drawPin(ctx, input.x - this.x, input.y - this.y, highlighted === input);
    });
    
    ctx.restore();
}

isInputClicked(x, y) {
    return this.inputs.find(input => Math.hypot(input.x - x, input.y - y) <= PIN_RADIUS);
}
}


class DigitDisplay extends Node {
/**
 * @param {number} x - Posição X no canvas.
 * @param {number} y - Posição Y no canvas.
 */
constructor(x, y) {
    super(x, y);
    this.type = "DIGIT";
    this.width = NODE_WIDTH;
    this.height = NODE_HEIGHT+20;
    
    this.digit = "0";
    
    this.numInputs = 4;
    this.inputs = [];
    this.inputStates = new Array(this.numInputs).fill(false);
    this.updateInputs();
}


updateInputs() {
    this.inputs = [];
    const spacing = this.height / (this.numInputs + 1);
    for (let i = 0; i < this.numInputs; i++) {
    this.inputs.push({
        x: this.x - PIN_OFFSET,
        y: this.y + (i + 1) * spacing
    });
    }
    this.inputStates = new Array(this.numInputs).fill(false);
}

/**
 * Avalia os 4 bits de entrada para formar um número.
 * Considera o bit de índice 0 como o LSB (bit menos significativo).
 * Se o valor estiver entre 0 e 9, exibe esse dígito.
 * Para 10 a 15, exibe uma letra correspondente (A-F).
 */
evaluate() {
    let value = 0;
    // Converte os bits (assumindo que inputStates[0] é o LSB)
    for (let i = 0; i < this.numInputs; i++) {
    if (this.inputStates[i]) {
        value |= (1 << i);
    }
    }
    
    // Se o valor for de 0 a 9, exibe como número.
    // Se for de 10 a 15, converte para letra (A-F)
    if (value >= 0 && value <= 9) {
    this.digit = value.toString();
    } else {
    // Converte 10->A, 11->B, ... 15->F
    this.digit = String.fromCharCode("A".charCodeAt(0) + value - 10);
    }
}

/**
 * Desenha o display no canvas, mostrando o dígito atual.
 * @param {CanvasRenderingContext2D} ctx - Contexto de desenho do canvas.
 * @param {any} highlighted - (Opcional) Elemento a ser destacado.
 */
draw(ctx, highlighted) {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    ctx.fillStyle = "#222"; 
    ctx.strokeStyle = "#888";
    ctx.lineWidth = BORDER_WIDTH;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.strokeRect(0, 0, this.width, this.height);
    
    ctx.fillStyle = FONT_COLOR;
    ctx.font = FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.digit, this.width / 2, this.height / 2);
    
    this.inputs.forEach(input => {
    drawPin(ctx, input.x - this.x, input.y - this.y, highlighted === input);
    });
    
    ctx.restore();
}

contains(x, y) {
    return (
    x >= this.x &&
    x <= this.x + this.width &&
    y >= this.y &&
    y <= this.y + this.height
    );
}


setDigit(value) {
    // Apenas para testes: força um valor se for de 0 a 9 ou de A a F
    if ((typeof value === "number" && value >= 0 && value <= 9) || 
        (typeof value === "string" && /^[A-F]$/.test(value))) {
    this.digit = value.toString();
    }
}


isInputClicked(x, y) {
    return this.inputs.find(input => Math.hypot(input.x - x, input.y - y) <= PIN_RADIUS);
}
}


class Clock extends Node {
/**
 * @param {number} x - Posição X no canvas.
 * @param {number} y - Posição Y no canvas.
 * @param {number} speed - Intervalo em milissegundos entre os ticks do clock.
 */
constructor(x, y, speed = 100) {
    super(x, y);
    this.width = NODE_WIDTH;
    this.height = NODE_HEIGHT;
    this.speed = speed;
    this.output = { piece: this, x: this.x + this.width, y: this.y + this.height / 2 };
    this.outputState = false;
    
    // Para controle do timer auto-corrigido
    this.timer = null;
    this.expectedTime = performance.now() + this.speed;
    this.startAutoTimer();
}

startAutoTimer() {
    if (this.timer) clearTimeout(this.timer);

    const tick = () => {
    const now = performance.now();
    if (now >= this.expectedTime) {
        // Alterna o estado do clock
        this.outputState = !this.outputState;
        // Calcula o drift e atualiza o próximo tempo esperado
        const drift = now - this.expectedTime;
        this.expectedTime += this.speed;
        // Redesenha o circuito se a variável global circuit estiver definida
        if (typeof circuit !== 'undefined') {
        circuit.draw();
        }
        // Agenda o próximo tick, compensando o drift
        this.timer = setTimeout(tick, Math.max(0, this.speed - drift));
    } else {
        this.timer = setTimeout(tick, this.expectedTime - now);
    }
    };

    this.timer = setTimeout(tick, this.speed);
}

setSpeed(newSpeed) {
    this.speed = newSpeed;
    this.expectedTime = performance.now() + this.speed;
    if (this.timer) clearTimeout(this.timer);
    this.startAutoTimer();
}

updateOutput() {
    this.output = { piece: this, x: this.x + this.width, y: this.y + this.height / 2 };
}

evaluate() {
}

draw(ctx, highlighted) {
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.fillStyle = this.outputState ? "#00cc00" : "#444";
    ctx.strokeStyle = "#888";
    ctx.lineWidth = BORDER_WIDTH;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.strokeRect(0, 0, this.width, this.height);

    ctx.fillStyle = FONT_COLOR;
    ctx.font = FONT;
    ctx.textAlign = "center";
    ctx.fillText("CLOCK", this.width / 2, this.height / 2 + 5);

    if (this.output) {
    drawPin(ctx, this.output.x - this.x, this.output.y - this.y, highlighted === this.output);
    }

    ctx.restore();
}

stopClock() {
    if (this.timer) {
    clearTimeout(this.timer);
    this.timer = null;
    }
}


isOutputClicked(x, y) {
    return this.output && Math.hypot(this.output.x - x, this.output.y - y) <= PIN_RADIUS
    ? this.output
    : null;
}
}