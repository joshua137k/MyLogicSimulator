
let modules = loadSavedModules();

// Função utilitária para desenhar pinos
function drawPin(ctx, localX, localY, isHighlighted) {
    ctx.beginPath();
    ctx.arc(localX, localY, PIN_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = isHighlighted ? "#ff0000" : FONT_COLOR;
    ctx.fill();
}
  
  
function saveModule(moduleData) {
  let savedModules = JSON.parse(localStorage.getItem("savedModules") || "[]");
  savedModules.push(moduleData);
  localStorage.setItem("savedModules", JSON.stringify(savedModules));
  console.log("Módulo salvo:", moduleData);
  modules = loadSavedModules();
  
}

function loadSavedModules() {
  let savedModules = JSON.parse(localStorage.getItem("savedModules") || "[]");
  console.log("Módulos salvos:", savedModules);
  return savedModules;
}

function insertModule(moduleData, circuit) {
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
  const gateHeight = Math.max(NODE_HEIGHT, Math.max(numInputs, numOutputs) * 25);
  const gateWidth = Math.max(NODE_WIDTH, Math.max(numInputs, numOutputs) * 25);
  circuit.addLogicGate(gateWidth, gateHeight, newLogicFunction, label, numInputs, numOutputs, gateWidth, gateHeight);
  circuit.draw();
}

function populateSavedModules() {
  const select = document.getElementById("savedModules");
  select.innerHTML = ""; 
  modules.forEach(mod => {
    const option = document.createElement("option");
    const moduleName = mod.name || mod.label;
    option.value = moduleName;
    option.textContent = moduleName;
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


function deleteModule(moduleName) {
  let savedModules = JSON.parse(localStorage.getItem("savedModules") || "[]");
  savedModules = savedModules.filter(mod => {
    const name = mod.name || mod.label;
    return name.trim().toLowerCase() !== moduleName.trim().toLowerCase();
  });
  localStorage.setItem("savedModules", JSON.stringify(savedModules));
  modules = savedModules;
  populateSavedModules();
  console.log(`Módulo "${moduleName}" removido com sucesso.`);
}



  
populateSavedModules(); 
  