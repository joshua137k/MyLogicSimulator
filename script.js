



// ===================
// Inicialização e configuração
// ===================
const canvas = document.getElementById("circuitCanvas");

const circuit = new Circuit(canvas);

document.getElementById("addAnd").addEventListener("click", () =>
  circuit.addLogicGate((a, b) => a && b, "AND", 2)
);
document.getElementById("addNot").addEventListener("click", () =>
  circuit.addLogicGate(a => !a, "NOT", 1)
);
document.getElementById("addOr").addEventListener("click", () =>
  circuit.addLogicGate((a, b) => a || b, "OR", 2)
);


document.getElementById("loadModule").addEventListener("click", () => {
    const select = document.getElementById("savedModules");
    const moduleName = select.value.trim().toLowerCase();
    
    const modData = modules.find(m => m.name.trim().toLowerCase() === moduleName);
    console.log("moduleName:", moduleName);
    console.log("Módulos disponíveis:", modules);
    if (modData) {
      insertModule(modData, circuit);
    } else {
      alert("Módulo não encontrado.");
    }
  });
  
  document.querySelectorAll('.submenu').forEach(submenu => {
    const toggleButton = submenu.querySelector('.submenuToggle');
    const content = submenu.querySelector('.submenuContent');
  
    toggleButton.addEventListener('click', () => {
      const isVisible = content.style.display === 'block';
      content.style.display = isVisible ? 'none' : 'block';
    });
  
    document.addEventListener('click', (event) => {
      if (!submenu.contains(event.target)) {
        content.style.display = 'none';
      }
    });
  });
  
    
   
document.getElementById("addButton").addEventListener("click", () => circuit.addButton());
document.getElementById("addLight").addEventListener("click", () => circuit.addLight());
document.getElementById("addMomentary").addEventListener("click", () => circuit.addMomentary());
document.getElementById("addDigit").addEventListener("click", () => circuit.addDigit());
document.getElementById("addClock").addEventListener("click", () => circuit.addClock());
document.getElementById("combine").addEventListener("click", () => circuit.combine());
document.getElementById("exportModules").addEventListener("click", exportModules);
document.getElementById("importModules").addEventListener("click", () => {
  document.getElementById("fileInput").click(); 
});
document.getElementById("fileInput").addEventListener("change", importModules);

