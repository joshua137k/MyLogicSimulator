// ===================
// Classe Circuit
// Gerencia peças, conexões e interação com o canvas
// ===================
class Circuit {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.resizeCanvas();
      this.pieces = [];
      this.connections = [];
      this.draggingPiece = null;
      this.offsetX = 0;
      this.offsetY = 0;
      this.connecting = false;
      this.connectionStart = null;
      this.highlighted = null;
      this.activeMomentary = null;
      this.draggingIntermediate = null;
  
      
      this.initEvents();
      this.draw();
    }
    
    resizeCanvas() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
    
    initEvents() {
      this.canvas.addEventListener("mousedown", e => this.handleMouseDown(e));
      this.canvas.addEventListener("mousemove", e => this.handleMouseMove(e));
      this.canvas.addEventListener("mouseup", () => this.handleMouseUp());
      this.canvas.addEventListener("contextmenu", e => this.handleContextMenu(e));
      this.canvas.addEventListener("dblclick", e => this.handleDbClick(e));
      window.addEventListener("resize", () => {
        this.resizeCanvas();
        this.draw();
      });
    }
    
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
  
         // conn.end.piece.inputStates[conn.end.index] = sourceVal;  -> Alteração para permitir múltiplas conexões
         conn.end.piece.inputStates[conn.end.index] =
        conn.end.piece.inputStates[conn.end.index] || sourceVal;
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
    
    draw() {
      this.simulate();
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.drawGrid();
      // Atualiza as posições das conexões
      this.connections.forEach(conn => {
        if (conn.start.piece.output) {
          conn.start.x = conn.start.piece.output.x;
          conn.start.y = conn.start.piece.output.y;
        } else if (conn.start.piece.outputs) {
          let idx = conn.start.index || 0;
          conn.start.x = conn.start.piece.outputs[idx].x;
          conn.start.y = conn.start.piece.outputs[idx].y;
        }
        const targetInput = conn.end.piece.inputs[conn.end.index];
        conn.end.x = targetInput.x;
        conn.end.y = targetInput.y;
      });
      
      // Desenha as conexões
      this.connections.forEach(conn => {
        this.ctx.beginPath();
        this.ctx.moveTo(conn.start.x, conn.start.y);
        if (conn.intermediatePoints.length === 1) {
          const cp = conn.intermediatePoints[0];
          this.ctx.quadraticCurveTo(cp.x, cp.y, conn.end.x, conn.end.y);
        } else if (conn.intermediatePoints.length > 1) {
  
          conn.intermediatePoints.forEach(point => {
            this.ctx.lineTo(point.x, point.y);
          });
          this.ctx.lineTo(conn.end.x, conn.end.y);
        } else {
          this.ctx.lineTo(conn.end.x, conn.end.y);
        }
        let color = "#00ff00";
        if (conn.highlight) {
          color = "#ff0000";
        } else if (conn.start.piece.outputState ||
                  (conn.start.piece.outputStates && conn.start.piece.outputStates[0])) {
          color = "#ffff00";
        }
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = conn.highlight ? HIGHLIGHT_BORDER_WIDTH : BORDER_WIDTH;
        this.ctx.stroke();
      });
      
      // Desenha as peças
      this.pieces.forEach(piece => piece.draw(this.ctx, this.highlighted));
    }
  
    drawGrid(gridSize = 20) {
      const { width, height } = this.canvas;
      this.ctx.save();
      this.ctx.strokeStyle = "#333";
      this.ctx.lineWidth = 1;
  
      for (let x = 0; x < width; x += gridSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, height);
        this.ctx.stroke();
      }
  
      for (let y = 0; y < height; y += gridSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(width, y);
        this.ctx.stroke();
      }
  
      this.ctx.restore();
    }
    
    addLogicGate(logicFunction, label, numInputs = 2,numOutputs = 1) {
      const x = Math.random() * (this.canvas.width - 100) + 50;
      const y = Math.random() * (this.canvas.height - 100) + 50;
      const newPiece = new LogicGate(x, y, logicFunction, label, numInputs,numOutputs);
      this.pieces.push(newPiece);
      this.draw();
    }
    
    addButton() {
      const x = Math.random() * (this.canvas.width - 100) + 50;
      const y = Math.random() * (this.canvas.height - 100) + 50;
      const newPiece = new Button(x, y);
      this.pieces.push(newPiece);
      this.draw();
    }
  
    addClock() {
      const timerInput = prompt("Digite o intervalo do timer do clock (em milissegundos):", "100");
      
      const timer = parseInt(timerInput, 10);
      if (isNaN(timer) || timer <= 0) {
        alert("Por favor, insira um valor numérico válido maior que 0.");
        return; 
      }
    
      const x = Math.random() * (this.canvas.width - 100) + 50;
      const y = Math.random() * (this.canvas.height - 100) + 50;
      const newPiece = new Clock(x, y, timer);
      this.pieces.push(newPiece);
      this.draw();
    }
    
    addMomentary() {
      const x = Math.random() * (this.canvas.width - 100) + 50;
      const y = Math.random() * (this.canvas.height - 100) + 50;
      const newPiece = new MomentaryButton(x, y);
      this.pieces.push(newPiece);
      this.draw();
    }
    
    addLight() {
      const x = Math.random() * (this.canvas.width - 100) + 50;
      const y = Math.random() * (this.canvas.height - 100) + 50;
      const newPiece = new Light(x, y);
      this.pieces.push(newPiece);
      this.draw();
    }
  
  
    addDigit() {
      const x = Math.random() * (this.canvas.width - 100) + 50;
      const y = Math.random() * (this.canvas.height - 100) + 50;
      const newPiece = new DigitDisplay(x, y);
      this.pieces.push(newPiece);
      this.draw();
    }
  
  
    getConnectionAt(x, y) {
      for (const conn of this.connections) {
        // Se você estiver usando apenas segmentos (start -> intermediários -> end):
        // Monte um array de pontos: [start, ...intermediatePoints, end]
        const points = [conn.start, ...conn.intermediatePoints, conn.end];
    
        // Caso você tenha curvas e um ponto de controle, transforme a curva em vários segmentos.
        // Exemplo: se conn tiver {start, cp, end}, gere ~20 pontos no array points.
    
        for (let i = 0; i < points.length - 1; i++) {
          if (distanceFromSegment(x, y, points[i], points[i+1]) < 5) {
            return conn;  
          }
        }
      }
      return null; // Não encontrou
    }
    
    
    handleMouseDown(e) {
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;
  
  
      for (const conn of this.connections) {
        for (let i = 0; i < conn.intermediatePoints.length; i++) {
          const point = conn.intermediatePoints[i];
          if (Math.hypot(point.x - mouseX, point.y - mouseY) <= PIN_RADIUS + 2) {
            this.draggingIntermediate = { conn, index: i };
            console.log("Arrastando ponto intermediário.");
            return;
          }
        }
      }
      
      for (const piece of this.pieces) {
        if (piece.isOutputClicked && piece.isOutputClicked(mouseX, mouseY)) {
          this.connectionStart = piece.isOutputClicked(mouseX, mouseY);
          this.connecting = true;
          this.highlighted = this.connectionStart;
          this.draw();
          return;
        }
      }
      
      // Se já está conectando, verifica se clicou em um pino de entrada
      if (this.connecting) {
  
  
      
        for (const piece of this.pieces) {
          if (piece.isInputClicked && piece.isInputClicked(mouseX, mouseY)) {
            const input = piece.isInputClicked(mouseX, mouseY);
            const exists = this.connections.some(conn =>
              conn.start.piece === this.connectionStart.piece &&
              conn.end.piece === piece &&
              conn.end.index === piece.inputs.indexOf(input)
            );
            if (!exists) {
              this.connections.push({
                  start: {
                    piece: this.connectionStart.piece,
                    index: this.connectionStart.index, 
                    x: this.connectionStart.x,
                    y: this.connectionStart.y
                  },
                  end: {
                    piece: piece,
                    index: piece.inputs.indexOf(input),
                    x: input.x,
                    y: input.y
                  },
                  highlight: false,
                  intermediatePoints: []
                });
                
            }
            this.resetConnection();
            this.draw();
            return;
          }
  
  
  
        }
  
  
  
  
      }
      
      // Se clicou em alguma peça para mover ou acionar botões
      for (const piece of this.pieces) {
        if (piece.contains(mouseX, mouseY)) {
          if (piece.type === "MOMENTARY") {
            if (e.button === 0) {
              this.draggingPiece = piece;
              this.offsetX = mouseX - piece.x;
              this.offsetY = mouseY - piece.y;
              return;
            } else if (e.button === 1) {
              piece.press();
              this.activeMomentary = piece;
              this.draw();
              return;
            }
          } else if (piece.type === "BUTTON") {
            if (e.button === 0) {
              this.draggingPiece = piece;
              this.offsetX = mouseX - piece.x;
              this.offsetY = mouseY - piece.y;
              return;
            } else if (e.button === 1) {
              piece.toggleState();
              this.draw();
              return;
            }
          } else {
            if (e.button === 0) {
              this.draggingPiece = piece;
              this.offsetX = mouseX - piece.x;
              this.offsetY = mouseY - piece.y;
              return;
            }
          }
        }
      }
      
      this.resetConnection();
      this.draw();
    }
    
    handleMouseMove(e) {
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;
      
      const connection = this.getConnectionAt(mouseX, mouseY);
      if (connection) {
        connection.highlight = true;
      } else {
        this.connections.forEach(conn => conn.highlight = false);
      }
      if (this.draggingIntermediate) {
        this.draggingIntermediate.conn.intermediatePoints[this.draggingIntermediate.index] = { x: mouseX, y: mouseY };
        this.draw();
      }
      if (this.draggingPiece) {
        this.draggingPiece.x = mouseX - this.offsetX;
        this.draggingPiece.y = mouseY - this.offsetY;
        if (this.draggingPiece.updateInputs) this.draggingPiece.updateInputs();
        if (this.draggingPiece.updateOutput) this.draggingPiece.updateOutput();
      }
      this.draw();
    }
  
  
    handleDbClick(e) {
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;
      this.addIntermediatePoint(mouseX, mouseY);
    }
  
    addIntermediatePoint(mouseX, mouseY) {
      // Procura uma conexão próxima do clique
      const connection = circuit.getConnectionAt(mouseX, mouseY);
      if (connection) {
     
        connection.intermediatePoints.push({ x: mouseX, y: mouseY });
        circuit.draw();
      }
    }
    
    handleMouseUp() {
      if (this.activeMomentary) {
        this.activeMomentary.release();
        this.activeMomentary = null;
      }
      this.draggingPiece = null;
      this.draggingIntermediate = null;
    }
    
    handleContextMenu(e) {
      e.preventDefault();
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;
      
      const clickedPiece = this.pieces.find(piece => piece.contains(mouseX, mouseY));
      if (clickedPiece) {
        this.connections = this.connections.filter(conn =>
          conn.start.piece !== clickedPiece && conn.end.piece !== clickedPiece
        );
        this.pieces = this.pieces.filter(piece => piece !== clickedPiece);
        this.draw();
        return;
      }
      
      const connection = this.getConnectionAt(mouseX, mouseY);
      if (connection) {
        this.connections = this.connections.filter(conn => conn !== connection);
        this.draw();
      }
    }
    
    resetConnection() {
      this.connecting = false;
      this.connectionStart = null;
      this.highlighted = null;
    }
  
  
    
    
    combine() {
      // 1. Identifica os nós de entrada (botões e momentários) de forma única
  
      const inputPiecesSet = new Set(
        this.connections
          .filter(conn => conn.start.piece instanceof Button || conn.start.piece instanceof MomentaryButton)
          .map(conn => conn.start.piece)
      );
  
          // 2. Identifica os nós de saída (luzes) de forma única
  
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
    
      // 3. Monta a tabela verdade simulando cada combinação de entradas
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
    
      // 4. Cria a função lógica combinada
      const newLogicFunction = function(...inputs) {
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
      const gateHeight = Math.max(NODE_HEIGHT, Math.max(numInputs, numOutputs) * 10);
      const gateWidth = Math.max(NODE_WIDTH, Math.max(numInputs, numOutputs) * 10);
      // 5. Cria o novo módulo (um único LogicGate) com a função combinada
      const newModule = new LogicGate(100, 100, newLogicFunction, "Module", numInputs, numOutputs);
      newModule.width = gateWidth;
      newModule.height = gateHeight;
    
      // Pergunta ao usuário o nome para o módulo
      const moduleName = prompt("Digite o nome para este módulo combinado:");
      if (moduleName) {
        newModule.label = moduleName;
        // Salva os dados do módulo (truthTable e parâmetros) para uso posterior
        const moduleData = {
          name: moduleName,
          truthTable,
          numInputs,
          numOutputs,
          label: moduleName
        };
        saveModule(moduleData);
      }
    
      // Limpa o circuito atual e adiciona apenas o novo módulo
      this.pieces = [newModule];
      this.connections = [];
      this.draw();
    
      console.log("Circuito combinado. Tabela verdade:", truthTable);
    }
    
    
    
    
  }