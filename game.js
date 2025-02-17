class Game {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.resizeCanvas();
  
      // Cria a instância do circuito (modelo lógico)
      this.circuit = new Circuit();
  
      // Variáveis de controle para interação
      this.draggingPiece = null;
      this.offsetX = 0;
      this.offsetY = 0;
      this.connecting = false;
      this.connectionStart = null;
      this.highlighted = null;
      this.activeMomentary = null;
      this.draggingIntermediate = null;
      this.save = 0;
      this.frame=0;
      this.fps=100;
      // Inicializa os eventos e inicia o desenho
      this.initEvents();
      this.simulationInterval = setInterval(() => {
        this.draw();
      }, 1000/this.fps);
     
    }
  
    // Ajusta o tamanho do canvas para ocupar a janela
    resizeCanvas() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  
    initEvents() {
          // Registra os eventos do canvas e da janela
      this.canvas.addEventListener("mousedown", e => this.handleMouseDown(e));
      this.canvas.addEventListener("mousemove", e => this.handleMouseMove(e));
      this.canvas.addEventListener("mouseup", () => this.handleMouseUp());
      this.canvas.addEventListener("contextmenu", e => this.handleContextMenu(e));
      this.canvas.addEventListener("dblclick", e => this.handleDbClick(e));
      window.addEventListener("resize", () => {
        this.resizeCanvas();
      });
    }
  
    drawGrid(gridSize = 20) {
      // Desenha um grid no canvas para facilitar o alinhamento dos elementos
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
  
    // Método principal de desenho, que atualiza a simulação e redesenha tudo no canvas
    draw() {

      if(this.save >= 100){
        const circuitJSON = circuit.circuit.toJSON(); // serializa o circuito atual
        localStorage.setItem("savedCircuit", JSON.stringify(circuitJSON));
        this.save = 0;
      }
      this.save++;
      // Executa a simulação do circuito (atualiza os estados lógicos)
      if (this.frame >= 60) {
        this.frame = 0;
        this.circuit.simulate();
      }
      this.frame++;  
      // Limpa o canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  
      // Desenha o grid de fundo
      this.drawGrid();
  
      // Atualiza as posições das conexões com base nos pinos de saída e entrada
      this.circuit.connections.forEach(conn => {
        // Atualiza a posição de saída
        if (conn.start.piece.output) {
          conn.start.x = conn.start.piece.output.x;
          conn.start.y = conn.start.piece.output.y;
        } else if (conn.start.piece.outputs) {
          let idx = conn.start.index || 0;
          conn.start.x = conn.start.piece.outputs[idx].x;
          conn.start.y = conn.start.piece.outputs[idx].y;
        }
        // Atualiza a posição de entrada
        const targetInput = conn.end.piece.inputs[conn.end.index];
        conn.end.x = targetInput.x;
        conn.end.y = targetInput.y;
      });
  
      // Desenha as conexões
      this.circuit.connections.forEach(conn => {
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
        } else if (
          conn.start.piece.outputState ||
          (conn.start.piece.outputStates && conn.start.piece.outputStates[0])
        ) {
          color = "#ffff00";
        }
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = conn.highlight ? HIGHLIGHT_BORDER_WIDTH : BORDER_WIDTH;
        this.ctx.stroke();
      });
  
      // Desenha as peças do circuito
      this.circuit.pieces.forEach(piece => piece.draw(this.ctx, this.highlighted));
    }
  
    // Evento de clique (mousedown)
    handleMouseDown(e) {
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;
  
      // Verifica se o clique ocorreu sobre um ponto intermediário de alguma conexão
      for (const conn of this.circuit.connections) {
        for (let i = 0; i < conn.intermediatePoints.length; i++) {
          const point = conn.intermediatePoints[i];
          if (Math.hypot(point.x - mouseX, point.y - mouseY) <= PIN_RADIUS + 2) {
            this.draggingIntermediate = { conn, index: i };
            console.log("Arrastando ponto intermediário.");
            return;
          }
        }
      }
  
      // Verifica se o clique ocorreu sobre um pino de saída para iniciar uma conexão
      for (const piece of this.circuit.pieces) {
        if (piece.isOutputClicked && piece.isOutputClicked(mouseX, mouseY)) {
          this.connectionStart = piece.isOutputClicked(mouseX, mouseY);
          this.connecting = true;
          this.highlighted = this.connectionStart;
          return;
        }
      }
  
      // Se já está conectando, verifica se clicou em um pino de entrada para finalizar a conexão
      if (this.connecting) {
        for (const piece of this.circuit.pieces) {
          if (piece.isInputClicked && piece.isInputClicked(mouseX, mouseY)) {
            const input = piece.isInputClicked(mouseX, mouseY);
            const exists = this.circuit.connections.some(conn =>
              conn.start.piece === this.connectionStart.piece &&
              conn.end.piece === piece &&
              conn.end.index === piece.inputs.indexOf(input)
            );
            if (!exists) {
              this.circuit.connections.push({
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
            return;
          }
        }
      }
  
      // Se o clique ocorreu sobre uma peça para movê-la ou interagir com ela
      for (const piece of this.circuit.pieces) {
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
  
      // Se nenhum dos casos anteriores se aplicar, reseta a conexão e redesenha
      this.resetConnection();
    }
  
    // Evento de movimento do mouse (mousemove)
    handleMouseMove(e) {
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;
  
      // Se estiver arrastando um ponto intermediário, atualiza sua posição
      if (this.draggingIntermediate) {
        this.draggingIntermediate.conn.intermediatePoints[this.draggingIntermediate.index] = { x: mouseX, y: mouseY };
      }
      // Se estiver arrastando uma peça, atualiza sua posição
      if (this.draggingPiece) {
        this.draggingPiece.x = mouseX - this.offsetX;
        this.draggingPiece.y = mouseY - this.offsetY;
        if (this.draggingPiece.updateInputs) this.draggingPiece.updateInputs();
        if (this.draggingPiece.updateOutput) this.draggingPiece.updateOutput();
      }
    }
  
    // Evento de duplo clique (dblclick)
    handleDbClick(e) {
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;
      this.addIntermediatePoint(mouseX, mouseY);
    }
  
    addIntermediatePoint(mouseX, mouseY) {
          // Adiciona um ponto intermediário em uma conexão próxima do clique
      const connection = this.getConnectionAt(mouseX, mouseY);
      if (connection) {
        connection.intermediatePoints.push({ x: mouseX, y: mouseY });
      }
    }
  
    // Evento de liberação do botão do mouse (mouseup)
    handleMouseUp() {
      if (this.activeMomentary) {
        this.activeMomentary.release();
        this.activeMomentary = null;
      }
      this.draggingPiece = null;
      this.draggingIntermediate = null;
    }
  
    handleContextMenu(e) {
          // Evento de clique com o botão direito (contextmenu)

      e.preventDefault();
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;
  
      // Se o clique ocorrer sobre uma peça, remove a peça e suas conexões associadas
      const clickedPiece = this.circuit.pieces.find(piece => piece.contains(mouseX, mouseY));
      if (clickedPiece) {
        this.circuit.connections = this.circuit.connections.filter(conn =>
          conn.start.piece !== clickedPiece && conn.end.piece !== clickedPiece
        );
        this.circuit.pieces = this.circuit.pieces.filter(piece => piece !== clickedPiece);
        return;
      }
  
      // Se o clique ocorrer sobre uma conexão, remove-a
      const connection = this.getConnectionAt(mouseX, mouseY);
      if (connection) {
        this.circuit.connections = this.circuit.connections.filter(conn => conn !== connection);
      }
    }
  
    // Reseta as variáveis de conexão
    resetConnection() {
      this.connecting = false;
      this.connectionStart = null;
      this.highlighted = null;
    }
  
      // Retorna uma conexão próxima ao ponto (x, y) se houver
      getConnectionAt(x, y) {
        for (const conn of this.circuit.connections) {
          // Cria um array de pontos: [início, ...pontos intermediários, fim]
          const points = [conn.start, ...conn.intermediatePoints, conn.end];
          for (let i = 0; i < points.length - 1; i++) {
            if (distanceFromSegment(x, y, points[i], points[i + 1]) < 5) {
              return conn;
            }
          }
        }
        return null;
      }

      addLogicGate(width,height,logicFunction, label, numInputs = 2, numOutputs = 1) {
        this.circuit.addLogicGate(width,height,logicFunction, label, numInputs, numOutputs);
      }
      addButton() { this.circuit.addButton();}
      addClock(timer) {this.circuit.addClock(timer);}
      addMomentary() {this.circuit.addMomentary();}
      addLight() {this.circuit.addLight();this.draw(); }
      addDigit() {this.circuit.addDigit();}
      combine() {this.circuit.combine();}
      combineCompositeGame(game) {this.circuit.combineCompositeGame(game);}
  }
  