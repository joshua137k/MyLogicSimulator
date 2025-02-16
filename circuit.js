// Classe Circuit: gerencia as peças, conexões e simulação do circuito.
class Circuit {
  constructor() {
    this.pieces = [];
    this.connections = [];
  }

  // Executa a simulação do circuito atual, propagando sinais e avaliando as peças.
  simulate() {
    let iterations = 0;
    let changed;
    do {
      changed = false;
  
      for (const piece of this.pieces) {
        if (piece.inputStates && piece.inputStates.length) {
          piece.inputStates.fill(false);
        }
      }
  
      this.connections.forEach(conn => {
        const sourceVal = conn.start.piece.outputState !== undefined
          ? conn.start.piece.outputState
          : (conn.start.piece.outputStates ? conn.start.piece.outputStates[conn.start.index] : false);
  
        if (!conn.end.piece.inputStates[conn.end.index]) {
          conn.end.piece.inputStates[conn.end.index] = false;
        }
  
        conn.end.piece.inputStates[conn.end.index] = conn.end.piece.inputStates[conn.end.index] || sourceVal;
      });
  
      for (const piece of this.pieces) {
        if (typeof piece.evaluate === "function") {
          const oldVal = piece.outputState !== undefined
            ? piece.outputState
            : (piece.outputStates ? [...piece.outputStates] : null);
          piece.evaluate();
          const newVal = piece.outputState !== undefined
            ? piece.outputState
            : (piece.outputStates ? piece.outputStates : null);
          if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            changed = true;
          }
        }
      }
  
      iterations++;
    } while (changed && iterations < 10);
  }
  

  // Métodos para adicionar peças ao circuito:

  
  addLogicGate(width=50,height=50,logicFunction, label, numInputs = 2, numOutputs = 1) {
    // Define uma posição inicial padrão (a UI poderá reposicionar posteriormente).
    const x = Math.random() * 500 + 50;
    const y = Math.random() * 300 + 50;
    const newPiece = new LogicGate(x, y, logicFunction, label, numInputs, numOutputs);
    newPiece.width=  width;
    newPiece.height = height;
    newPiece.updateInputs();
    newPiece.updateOutputs();
    this.pieces.push(newPiece);
    
  }

  addButton() {
      const x = Math.random() * 500 + 50;
      const y = Math.random() * 300 + 50;
      const newPiece = new Button(x, y);
      this.pieces.push(newPiece);
    }

  addClock(timer) {
    const x = Math.random() * 500 + 50;
    const y = Math.random() * 300 + 50;
    const newPiece = new Clock(x, y, timer);
    this.pieces.push(newPiece);
  }

  addMomentary() {
    const x = Math.random() * 500 + 50;
    const y = Math.random() * 300 + 50;
    const newPiece = new MomentaryButton(x, y);
    this.pieces.push(newPiece);
  }

  addLight() {
    const x = Math.random() * 500 + 50;
    const y = Math.random() * 300 + 50;
    const newPiece = new Light(x, y);
    this.pieces.push(newPiece);
  }

  addDigit() {
    const x = Math.random() * 500 + 50;
    const y = Math.random() * 300 + 50;
    const newPiece = new DigitDisplay(x, y);
    this.pieces.push(newPiece);
  }


  // Combina o circuito atual em um único módulo (novo LogicGate) com base na tabela-verdade.
  combine() {
    // 1. Identifica os nós de entrada (por exemplo, Button e MomentaryButton) de forma única.
    const inputPiecesSet = new Set(
      this.connections
        .filter(conn => conn.start.piece instanceof Button || conn.start.piece instanceof MomentaryButton)
        .map(conn => conn.start.piece)
    );

    // 2. Identifica os nós de saída (por exemplo, Light) de forma única.
    const outputPiecesSet = new Set(
      this.connections
        .filter(conn => conn.end.piece instanceof Light)
        .map(conn => conn.end.piece)
    );

    const inputPieces = Array.from(inputPiecesSet).sort((a, b) => a.y - b.y);
    const outputPieces = Array.from(outputPiecesSet).sort((a, b) => a.y - b.y);

    if (inputPieces.length === 0 || outputPieces.length === 0) {
      console.log("O circuito precisa ter pelo menos uma entrada e uma saída para combinar.");
      return;
    }

    const numInputs = inputPieces.length;
    const numOutputs = outputPieces.length;
    const truthTable = [];
    const totalCombinations = 1 << numInputs; // 2^numInputs

    // 3. Constrói a tabela-verdade simulando cada combinação de entradas.
    for (let i = 0; i < totalCombinations; i++) {
      inputPieces.forEach((piece, index) => {
        const state = Boolean((i >> index) & 1);
        piece.state = state;
        piece.outputState = state;
      });
      this.simulate();
      if (numOutputs === 1) {
        truthTable[i] = outputPieces[0].state;
        console.log(`Combinação ${i.toString(2).padStart(numInputs, '0')}: Saída = ${truthTable[i]}`);
      } else {
        truthTable[i] = outputPieces.map(piece => piece.state);
        console.log(`Combinação ${i.toString(2).padStart(numInputs, '0')}: Saídas = ${truthTable[i]}`);
      }
    }

    // 4. Cria a nova função lógica combinada com base na tabela-verdade.
    const newLogicFunction = function (...inputs) {
      if (inputs.length !== numInputs) {
        return numOutputs === 1 ? false : new Array(numOutputs).fill(false);
      }
      let index = 0;
      for (let i = 0; i < numInputs; i++) {
        if (inputs[i]) {
          index |= (1 << i);
        }
      }
      return truthTable[index];
    };

    // Define dimensões padrão para o novo módulo.
    const gateHeight = Math.max(NODE_HEIGHT, Math.max(numInputs, numOutputs) * 10);
    const gateWidth = Math.max(NODE_WIDTH, Math.max(numInputs, numOutputs) * 10);
    const newModule = new LogicGate(100, 100, newLogicFunction, "Module", numInputs, numOutputs);
    newModule.width = gateWidth;
    newModule.height = gateHeight;

    // Pergunta ao usuário o nome para o módulo combinado.
    const moduleName = prompt("Digite o nome para este módulo combinado:");
    if (moduleName) {
      newModule.label = moduleName;
      // Salva os dados do módulo (por exemplo, em armazenamento local ou base de dados)
      const moduleData = {
        name: moduleName,
        truthTable,
        numInputs,
        numOutputs,
        label: moduleName
      };
      saveModule(moduleData);
    }

    // Substitui o circuito atual pelo novo módulo combinado.
    this.pieces = [newModule];
    this.connections = [];
    console.log("Circuito combinado. Tabela verdade:", truthTable);
  }


  combineCompositeGame(game) {
    console.log(game);
    const currentCircuit = game.circuit;
  
    // 2. Cria um subcircuito clonando as peças e conexões atuais.
    const subCircuit = new Circuit();
    subCircuit.pieces = currentCircuit.pieces.slice();
    subCircuit.connections = currentCircuit.connections.slice();
  
    // 3. (Opcional) Identifica quais peças serão as entradas e saídas do subcircuito.
    //    Neste exemplo, usamos os Botões (Button ou MomentaryButton) como entradas
    //    e as Luzes (Light) como saídas.
    const inputPiecesSet = new Set(
      subCircuit.connections
        .filter(conn => conn.start.piece instanceof Button || conn.start.piece instanceof MomentaryButton)
        .map(conn => conn.start.piece)
    );

    // 2. Identifica os nós de saída (por exemplo, Light) de forma única.
    const outputPiecesSet = new Set(
      subCircuit.connections
        .filter(conn => conn.end.piece instanceof Light)
        .map(conn => conn.end.piece)
    );

    const inputPieces = Array.from(inputPiecesSet).sort((a, b) => a.y - b.y);
    const outputPieces = Array.from(outputPiecesSet).sort((a, b) => a.y - b.y);

  
    // 4. Solicita o nome do módulo composto ao usuário.
    const moduleName = prompt("Digite o nome para o módulo composto:");
    if (!moduleName) {
      console.log("Nome não informado. Operação abortada.");
      return;
    }
  
    // 5. Cria o CompositeGate encapsulando o subcircuito.
    //    Se não identificar entradas/saídas, garante ao menos 1 em cada lado.
    const compositeGate = new CompositeGate(
      100,                // Posição X para o novo bloco
      100,                // Posição Y para o novo bloco
      subCircuit,         // Circuito encapsulado
      moduleName,         // Rótulo do módulo
      inputPieces.length || 1,  // Número de entradas
      outputPieces.length || 1, // Número de saídas
      inputPieces,              // Mapeamento das entradas
      outputPieces              // Mapeamento das saídas
    );
    
    compositeGate.width = NODE_WIDTH;
    compositeGate.height = NODE_HEIGHT;
  
    // 6. Cria um novo circuito limpo para o game e insere o CompositeGate nele.
    game.circuit = new Circuit();
    game.circuit.pieces.push(compositeGate);

    // 7. Redesenha o game para atualizar a interface.
    game.draw();
  
    console.log("Circuito atual encapsulado em CompositeGate:", compositeGate);
  }
  
}



class CompositeGate extends LogicGate {
  /**
   * @param {number} x - Posição X do bloco.
   * @param {number} y - Posição Y do bloco.
   * @param {Circuit} subCircuit - O circuito interno que define a lógica.
   * @param {string} label - Rótulo do bloco.
   * @param {number} numInputs - Número de entradas do bloco.
   * @param {number} numOutputs - Número de saídas do bloco.
   * @param {Array} subInputsMapping - (Opcional) Mapeamento dos pinos de entrada para os nós do subcircuito.
   * @param {Array} subOutputsMapping - (Opcional) Mapeamento dos pinos de saída para os nós do subcircuito.
   */
  constructor(x, y, subCircuit, label = "SubCircuit", numInputs = 2, numOutputs = 1, subInputsMapping = [], subOutputsMapping = []) {
    // Passamos uma função dummy, pois iremos sobrescrever evaluate()
    
    super(x, y, () => false, label, numInputs, numOutputs);
    this.subCircuit = subCircuit;
    // Se não for informado um mapeamento, assumimos que os nós de entrada e saída do subcircuito 
    // já foram definidos (por exemplo, via combine()).
    this.subInputsMapping = subInputsMapping ;
    this.subOutputsMapping = subOutputsMapping ;
    
  }
  
  evaluate() {
    if (!this.subInputsMapping || !this.subOutputsMapping) {
      return;
    }
  
    // Garante que as entradas mapeadas existam e propaga os valores
    for (let i = 0; i < this.numInputs; i++) {
      if (this.subInputsMapping[i]) {
        this.subInputsMapping[i].state = this.inputStates[i];
        this.subInputsMapping[i].outputState = this.inputStates[i];
      } else {
        console.warn(`Entrada ${i} não mapeada no subcircuito.`);
      }
    }

    // Simula o subcircuito
    this.subCircuit.simulate();

    // Atualiza as saídas do CompositeGate
    if (this.numOutputs === 1) {
      if (this.subOutputsMapping[0]) {
        this.outputState = this.subOutputsMapping[0].state;
      } else {
        console.warn("Saída 0 não mapeada no subcircuito.");
        this.outputState = false;
      }
    } else {
      this.outputStates = this.subOutputsMapping.map((node, index) => {
        if (node) return node.state;
        console.warn(`Saída ${index} não mapeada no subcircuito.`);
        return false;
      });
    }
  
  }
  
  draw(ctx, highlighted) {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    // Desenha o retângulo principal
    ctx.fillStyle = "#555";
    ctx.strokeStyle = "#aaa";
    ctx.lineWidth = BORDER_WIDTH;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.strokeRect(0, 0, this.width, this.height);
  
    // Rótulo centralizado
    ctx.fillStyle = FONT_COLOR;
    ctx.font = FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.label, this.width / 2, this.height / 2);
  
    // Desenhar os pinos de entrada
    this.inputs.forEach((input) => {
      drawPin(ctx, input.x - this.x, input.y - this.y, highlighted === input);
    });
  

    this.outputs.forEach((output, index) => {
      let isHighlighted = false;
        if (highlighted && highlighted.piece === this && highlighted.index === index) {
        isHighlighted = true;
        }
      // Mesma ideia: subtraia this.x e this.y se output.x for absoluto
      drawPin(ctx, output.x - this.x, output.y - this.y, isHighlighted);
    });
    
  
    ctx.restore();
  }
  
}
