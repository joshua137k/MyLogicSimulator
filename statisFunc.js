
let modules = loadSavedModules();

// Função utilitária para desenhar pinos
function drawPin(ctx, localX, localY, isHighlighted) {
    ctx.beginPath();
    ctx.arc(localX, localY, PIN_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = isHighlighted ? "#ff0000" : FONT_COLOR;
    ctx.fill();
  }
  
  
  // Função para salvar o módulo combinado no localStorage
  function saveModule(moduleData) {
  // Recupera os módulos salvos (se houver)
  let savedModules = JSON.parse(localStorage.getItem("savedModules") || "[]");
  savedModules.push(moduleData);
  localStorage.setItem("savedModules", JSON.stringify(savedModules));
  console.log("Módulo salvo:", moduleData);
  modules = loadSavedModules();
  
  }
  
  // Função para carregar os módulos salvos e exibi-los (exemplo: no console ou numa lista na página)
  function loadSavedModules() {
  let savedModules = JSON.parse(localStorage.getItem("savedModules") || "[]");
  // Aqui você pode, por exemplo, preencher uma lista <select> ou simplesmente logar no console
  console.log("Módulos salvos:", savedModules);
  return savedModules;
  }
  
  // Função para inserir um módulo salvo no circuito
  function insertModule(moduleData, circuit) {
  // Recria a função lógica a partir da tabela verdade salva
  const { truthTable, numInputs, numOutputs, label } = moduleData;
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
  // Cria o novo módulo (LogicGate) com os parâmetros salvos
  const gateHeight = Math.max(NODE_HEIGHT, Math.max(numInputs, numOutputs) * 25);
    const gateWidth = Math.max(NODE_WIDTH, Math.max(numInputs, numOutputs) * 25);
  const newModule = new LogicGate(100, 100, newLogicFunction, label, numInputs, numOutputs);
  newModule.width = gateWidth;
  newModule.height = gateHeight;
  newModule.updateInputs();
  newModule.updateOutputs();
  circuit.pieces.push(newModule);
  circuit.draw();
  }
  
  function populateSavedModules() {
      const select = document.getElementById("savedModules");
      select.innerHTML = ""; // Limpa o conteúdo atual
      modules.forEach(mod => {
        const option = document.createElement("option");
        option.value = mod.name; // Certifique-se de que esse valor seja consistente
        option.textContent = mod.name;
        select.appendChild(option);
      });
    }
  
  function exportModules() {
    const dataStr = JSON.stringify(modules, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
  
    const a = document.createElement("a");
    a.href = url;
    a.download = "modules.json";
    a.click();
  
    URL.revokeObjectURL(url);
    console.log("Módulos exportados.");
  }
  
    
  function importModules(event) {
    const file = event.target.files[0];
    if (!file) {
      return;
    }
  
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedModules = JSON.parse(e.target.result);
        if (Array.isArray(importedModules)) {
          // Filtra os módulos que já existem
          const uniqueModules = importedModules.filter((importedModule) => {
            return !modules.some(
              (existingModule) => existingModule.name === importedModule.name
            );
          });
  
          if (uniqueModules.length > 0) {
            modules = [...modules, ...uniqueModules];
            localStorage.setItem("savedModules", JSON.stringify(modules));
            populateSavedModules(); // Atualiza a lista de módulos salvos
            console.log("Módulos importados:", uniqueModules);
          } else {
            alert("Todos os módulos já foram importados.");
          }
        } else {
          alert("O arquivo não contém módulos válidos.");
        }
      } catch (err) {
        alert("Erro ao importar módulos: " + err.message);
      }
    };
    reader.readAsText(file);
  }
  
    
  function distanceFromSegment(mx, my, p1, p2) {
    // p1 e p2 são { x, y }
    const vx = p2.x - p1.x;
    const vy = p2.y - p1.y;
    const wx = mx - p1.x;
    const wy = my - p1.y;
  
    const c1 = vx*wx + vy*wy;
    if (c1 <= 0) {
      // mais perto de p1
      return Math.hypot(mx - p1.x, my - p1.y);
    }
  
    const c2 = vx*vx + vy*vy;
    if (c2 <= c1) {
      // mais perto de p2
      return Math.hypot(mx - p2.x, my - p2.y);
    }
  
    // projeção está no meio do segmento
    const b = c1 / c2;
    const projx = p1.x + b * vx;
    const projy = p1.y + b * vy;
    return Math.hypot(mx - projx, my - projy);
  }
  
  
  
  populateSavedModules(); 
  