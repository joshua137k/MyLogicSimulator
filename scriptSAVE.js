// Método de serialização para CompositeGate
CompositeGate.prototype.toJSON = function() {
    return {
      type: "CompositeGate",
      x: this.x,
      y: this.y,
      label: this.label,
      numInputs: this.numInputs,
      numOutputs: this.numOutputs,
      // Serializa o subcircuito usando o método toJSON do Circuit
      subCircuit: this.subCircuit.toJSON(),
      // Para os mapeamentos, salvamos os índices das peças dentro do subcircuito
      subInputsMappingIndices: this.subInputsMapping.map(piece => this.subCircuit.pieces.indexOf(piece)),
      subOutputsMappingIndices: this.subOutputsMapping.map(piece => this.subCircuit.pieces.indexOf(piece))
    };
  };
  
// Método estático para recriar um CompositeGate a partir dos dados serializados
CompositeGate.fromJSON = function(data) {
const subCircuit = Circuit.fromJSON(data.subCircuit);
const compositeGate = new CompositeGate(
    data.x,
    data.y,
    subCircuit,
    data.label,
    data.numInputs,
    data.numOutputs
);
// Reconstrói os mapeamentos utilizando os índices salvos
compositeGate.subInputsMapping = data.subInputsMappingIndices.map(index => subCircuit.pieces[index]);
compositeGate.subOutputsMapping = data.subOutputsMappingIndices.map(index => subCircuit.pieces[index]);
return compositeGate;
};
  
// Serialização do Circuit permanece igual:
Circuit.prototype.toJSON = function() {
    return {
      pieces: this.pieces.map(piece => {
        if (piece.type === "CompositeGate") {
          return piece.toJSON();
        } else {
          // Para outros tipos, salve os dados básicos.
          return {
            type: piece.type || "",  // se type não existir, ficará como string vazia
            x: piece.x,
            y: piece.y,
            label: piece.label || "",
            numInputs: piece.numInputs || 0,
            numOutputs: piece.numOutputs || 0
          };
        }
      }),
      connections: this.connections.map(conn => ({
        startPieceIndex: this.pieces.indexOf(conn.start.piece),
        startIndex: conn.start.index,
        endPieceIndex: this.pieces.indexOf(conn.end.piece),
        endIndex: conn.end.index,
        intermediatePoints: conn.intermediatePoints
      }))
    };
  };
  
  // Método estático atualizado para recriar um Circuit a partir do JSON salvo:
  Circuit.fromJSON = function(data) {
    const circuit = new Circuit();
  
    data.pieces.forEach(pieceData => {
      let piece;
      // Verifica o type salvo para recriar a classe correta.
      switch (pieceData.type) {
        case "BUTTON":
          piece = new Button(pieceData.x, pieceData.y);
          break;
        case "LIGHT":
          piece = new Light(pieceData.x, pieceData.y);
          break;
        case "CompositeGate":
          // Se for um CompositeGate, use o método fromJSON dele.
          piece = CompositeGate.fromJSON(pieceData);
          break;
        default:
          // Se não houver type definido, podemos usar o rótulo para inferir.
          // Por exemplo, se o rótulo for "NOT" e os parâmetros indicarem 1 entrada e 1 saída,
          // recria um NOT gate com a função lógica adequada.
          if (
            pieceData.label === "NOT" &&
            pieceData.numInputs === 1 &&
            pieceData.numOutputs === 1
          ) {
            piece = new LogicGate(
              pieceData.x,
              pieceData.y,
              (input) => !input, // função NOT
              "NOT",
              pieceData.numInputs,
              pieceData.numOutputs
            );
          } else {
            // Se não identificamos o tipo, criamos uma porta lógica genérica.
            piece = new LogicGate(
              pieceData.x,
              pieceData.y,
              () => false,
              pieceData.label,
              pieceData.numInputs,
              pieceData.numOutputs
            );
          }
          break;
      }
      circuit.pieces.push(piece);
    });
  
    data.connections.forEach(connData => {
      const startPiece = circuit.pieces[connData.startPieceIndex];
      const endPiece = circuit.pieces[connData.endPieceIndex];
      if (startPiece && endPiece) {
        // Obter o pino de saída do startPiece:
        let startPin;
        if (
          startPiece.type === "BUTTON" ||
          startPiece.type === "MOMENTARY" ||
          startPiece.type === "CLOCK"
        ) {
          startPin = startPiece.output;
        } else if (startPiece.outputs && startPiece.outputs.length > connData.startIndex) {
          startPin = startPiece.outputs[connData.startIndex];
        } else {
          // Fallback: usa a posição da peça
          startPin = { x: startPiece.x, y: startPiece.y };
        }
  
        // Obter o pino de entrada do endPiece:
        let endPin;
        if (endPiece.inputs && endPiece.inputs.length > connData.endIndex) {
          endPin = endPiece.inputs[connData.endIndex];
        } else {
          endPin = { x: endPiece.x, y: endPiece.y };
        }
  
        circuit.connections.push({
          start: {
            piece: startPiece,
            index: connData.startIndex,
            x: startPin.x,
            y: startPin.y
          },
          end: {
            piece: endPiece,
            index: connData.endIndex,
            x: endPin.x,
            y: endPin.y
          },
          intermediatePoints: connData.intermediatePoints || []
        });
      }
    });
  
    return circuit;
  };
  

  
  // Função para exportar (fazer o download) de um CompositeGate
function exportCompositeGate(compositeGate) {
    const dataStr = JSON.stringify(compositeGate.toJSON(), null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = compositeGate.label + ".json"; // O nome do arquivo será o rótulo do módulo
    a.click();
    URL.revokeObjectURL(url);
    console.log("CompositeGate exportado:", dataStr);
  }
  
  // Função para importar um CompositeGate a partir de um arquivo selecionado (por exemplo, via <input type="file">)
  function importCompositeGate(file, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        const compositeGate = CompositeGate.fromJSON(data);
        callback(compositeGate);
      } catch (err) {
        console.error("Erro ao importar CompositeGate:", err);
      }
    };
    reader.readAsText(file);
  }

  

  // Supondo que você tenha uma referência ao seu CompositeGate (por exemplo, o módulo atual do circuito)
document.getElementById("importCompositeGate").addEventListener("click", () => {
  document.getElementById("importModule").click(); 
});
// Exporta quando o botão for clicado
document.getElementById("exportCompositeGate").addEventListener("click", () => {
  if (circuit.circuit.pieces[0]) {
    exportCompositeGate(circuit.circuit.pieces[0]);
  } else {
    alert("Nenhum CompositeGate para exportar!");
  }
});

// Importa quando um arquivo for selecionado
document.getElementById("importModule").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    importCompositeGate(file, (compositeGate) => {
      // Por exemplo, adicione o módulo importado ao seu circuito atual:
      circuit.circuit.pieces.push(compositeGate);
      circuit.draw();
      alert("CompositeGate importado com sucesso!");
    });
  }
});
