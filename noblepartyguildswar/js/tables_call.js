document.addEventListener("DOMContentLoaded", function () {

///////////////////////////////
/// CSV DATA
///////////////////////////////

const CSV_ACCESSO = `
Giocatore,Ad,Aq,B,C,P,S,Vk,Va,Standard,Social,Sketch,Guerre,Cham Win.,Champions,Giocatore
Apocal,,,4,,,,,,2,1,1,NA,,,Apocal
Baudo,,12,7,7,,4,,3,11,13,7,OK,,2,Baudo
Bibobio,,,,,,,,,,,,,,,Bibobio
Clavuss,,4,,12,,4,2,4,8,11,7,OK,,,Clavuss
Colt,3,6,4,11,2,3,,,9,11,7,OK,,2,Colt
Copter,,2,7,3,1,,,4,6,5,5,NA,,1,Copter
Deadrick,,,,,,,,,,,,,,,Deadrick
Drius,,,3,3,3,,8,4,7,8,5,OK,,1,Drius
Gigatzu,,,,4,,4,,,2,3,3,NA,,,Gigatzu
Glimpse,2,1,4,12,2,,5,6,13,10,8,OK,,1,Glimpse
Ifrid,1,3,,8,2,4,1,,4,10,5,NA,,,Ifrid
Joemoo,,,,,,,,4,,2,2,NA,,,Joemoo
Karmic,,5,,6,4,7,1,7,9,13,6,OK,,2,Karmic
Khan,,,,,6,,,4,2,4,3,NA,0,1,Khan
Noble,5,1,,,5,3,1,15,10,11,8,OK,,1,Noble
Patrifu,4,4,,,,,,4,3,5,3,NA,1,1,Patrifu
Penny,,,,,4,,,4,1,4,3,NA,,,Penny
Pino,3,4,8,4,7,4,,2,12,12,7,OK,0,1,Pino
Puffo,4,1,3,,12,,1,7,10,10,7,OK,,1,Puffo
Skate,,,4,11,4,,,4,7,9,6,OK,,1,Skate
SoCrem,,,,,,,,,,,,,,,SoCrem
Sootz,6,4,8,4,,,,2,9,7,7,OK,,1,Sootz
Spartan,,,4,4,,,3,4,4,6,4,NA,0,1,Spartan
Stokes,4,4,,,,4,,8,6,8,5,OK,,1,Stokes
Svezio,,,,,,4,,,2,1,1,NA,,,Svezio
Swine,12,1,4,3,2,3,5,,12,9,7,OK,,2,Swine
Tigrozzo,4,4,,4,6,4,2,4,9,12,6,OK,1,1,Tigrozzo
Trimrex,,,,,,,,,,,,,,,Trimrex
WC,4,,8,,4,,3,2,8,8,4,OK,,1,WC
`;

// Dati CSV
const CSV_PLAY_WITH = `
"",Baudo,Colt,Copter,Deadrick,Drius,Karmic,Noble,Puffo,Swine,Trimrex,Apocal,Bibobio,Clavuss,Gigatzu,Glimpse,Ifrid,Joemoo,Khan,Patrifu,Penny,Pino,Skate,SoCrem,Sootz,Spartan,Stokes,Svezio,Tigrozzo,WC
Baudo,x,17,9,0,3,18,4,7,5,0,3,0,11,0,11,6,3,3,7,3,15,10,0,11,10,7,0,11,7
Colt,17,x,7,0,3,11,4,2,14,0,0,0,16,6,11,13,0,0,4,2,9,10,0,11,4,5,3,11,4
Copter,9,7,x,0,6,2,5,4,7,0,3,0,5,3,7,3,0,0,0,1,13,6,0,10,3,6,0,2,9
Deadrick,0,0,0,x,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Drius,3,3,6,0,x,5,7,11,8,0,3,0,9,3,15,4,0,3,0,0,9,10,0,6,6,0,0,5,9
Karmic,18,11,2,0,5,x,10,11,3,0,0,0,17,3,11,8,3,5,3,3,5,14,0,0,7,10,3,15,0
Noble,4,4,5,0,7,10,x,16,9,0,0,0,7,3,8,5,3,5,7,6,11,4,0,6,3,14,3,11,9
Puffo,7,2,4,0,11,11,16,x,6,0,3,0,4,0,11,3,3,9,7,7,14,11,0,7,6,7,0,9,12
Swine,5,14,7,0,8,3,9,6,x,0,0,0,8,6,9,9,0,0,4,2,13,3,0,13,3,7,3,8,9
Trimrex,0,0,0,0,0,0,0,0,0,x,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Apocal,3,0,3,0,3,0,0,3,0,0,x,0,0,0,4,0,0,0,0,0,4,4,0,4,4,0,0,0,4
Bibobio,0,0,0,0,0,0,0,0,0,0,0,x,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Clavuss,11,16,5,0,9,17,7,4,8,0,0,0,x,8,17,13,0,0,0,0,4,15,0,4,5,8,4,11,0
Gigatzu,0,6,3,0,3,3,3,0,6,0,0,0,8,x,4,8,0,0,0,0,4,4,0,4,0,4,4,4,0
Glimpse,11,11,7,0,15,11,8,11,9,0,4,0,17,4,x,9,0,0,0,2,11,19,0,8,10,0,0,4,5
Ifrid,6,13,3,0,4,8,5,3,9,0,0,0,13,8,9,x,0,0,1,2,8,7,0,5,0,6,4,4,1
Joemoo,3,0,0,0,0,3,3,3,0,0,0,0,0,0,0,0,x,4,4,4,0,0,0,0,4,4,0,4,0
Khan,3,0,0,0,3,5,5,9,0,0,0,0,0,0,0,0,4,x,4,4,3,2,0,0,4,4,0,8,4
Patrifu,7,4,0,0,0,3,7,7,4,0,0,0,0,0,0,1,4,4,x,4,3,0,0,8,4,8,0,4,4
Penny,3,2,1,0,0,3,6,7,2,0,0,0,0,0,2,2,4,4,4,x,4,0,0,0,4,4,0,4,0
Pino,15,9,13,0,9,5,11,14,13,0,4,0,4,4,11,8,0,3,3,4,x,8,0,15,4,5,0,4,14
Skate,10,10,6,0,10,14,4,11,3,0,4,0,15,4,19,7,0,2,0,0,8,x,0,8,8,0,0,6,4
SoCrem,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,x,0,0,0,0,0,0
Sootz,11,11,10,0,6,0,6,7,13,0,4,0,4,4,8,5,0,0,8,0,15,8,0,x,4,4,0,0,12
Spartan,10,4,3,0,6,7,3,6,3,0,4,0,5,0,10,0,4,4,4,4,4,8,0,4,x,4,0,8,4
Stokes,7,5,6,0,0,10,14,7,7,0,0,0,8,4,0,6,4,4,8,4,5,0,0,4,4,x,4,11,6
Svezio,0,3,0,0,0,3,3,0,3,0,0,0,4,4,0,4,0,0,0,0,0,0,0,0,0,4,x,4,0
Tigrozzo,11,11,2,0,5,15,11,9,8,0,0,0,11,4,4,4,4,8,4,4,4,6,0,0,8,11,4,x,6
WC,7,4,9,0,9,0,9,12,9,0,4,0,0,0,5,1,0,4,4,0,14,4,0,12,4,6,0,6,x
`;

// Dati CSV
const CSV_PLAY_AGAINST = `
"",Baudo,Colt,Copter,Deadrick,Drius,Karmic,Noble,Puffo,Swine,Trimrex,Apocal,Bibobio,Clavuss,Gigatzu,Glimpse,Ifrid,Joemoo,Khan,Patrifu,Penny,Pino,Skate,SoCrem,Sootz,Spartan,Stokes,Svezio,Tigrozzo,WC
Baudo,x,11,8,0,18,12,23,20,20,0,0,0,12,6,14,10,0,5,4,4,15,11,0,7,3,11,3,14,12
Colt,11,x,10,0,14,16,19,24,9,0,3,0,8,0,12,1,3,9,7,5,16,11,0,7,9,13,0,11,13
Copter,8,10,x,0,8,15,11,13,8,0,0,0,10,3,7,5,3,5,7,5,2,8,0,4,6,7,3,9,0
Deadrick,0,0,0,x,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Drius,18,14,8,0,x,13,11,8,8,0,0,0,6,3,4,8,3,5,7,3,10,7,0,8,3,10,3,9,6
Karmic,12,16,15,0,13,x,16,13,21,0,3,0,5,3,11,6,0,2,8,4,22,6,0,18,6,8,0,8,16
Noble,23,19,11,0,11,16,x,7,15,0,3,0,14,3,18,8,0,2,4,0,12,16,0,16,10,3,0,8,7
Puffo,20,24,13,0,8,13,7,x,16,0,0,0,20,6,14,12,0,0,4,0,10,10,0,11,7,11,3,11,7
Swine,20,9,8,0,8,21,15,16,x,0,3,0,10,0,15,1,3,5,7,3,10,15,0,9,10,9,0,10,6
Trimrex,0,0,0,0,0,0,0,0,0,x,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Apocal,0,3,0,0,0,3,3,0,3,0,x,0,4,4,0,4,0,0,0,0,0,0,0,0,0,4,4,4,0
Bibobio,0,0,0,0,0,0,0,0,0,0,0,x,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Clavuss,12,8,10,0,6,5,14,20,10,0,4,0,x,0,6,3,4,8,10,8,19,6,0,14,8,10,0,10,17
Gigatzu,6,0,3,0,3,3,3,6,0,0,4,0,0,x,4,0,4,4,4,4,4,4,0,4,8,4,0,4,4
Glimpse,14,12,7,0,4,11,18,14,15,0,0,0,6,4,x,7,4,10,11,4,14,3,0,15,4,17,4,16,14
Ifrid,10,1,5,0,8,6,8,12,1,0,4,0,3,0,7,x,4,8,4,5,9,5,0,4,9,6,0,13,10
Joemoo,0,3,3,0,3,0,0,0,3,0,0,0,4,4,4,4,x,0,0,0,4,4,0,4,0,0,0,0,0
Khan,5,9,5,0,5,2,2,0,5,0,0,0,8,4,10,8,0,x,2,0,5,7,0,6,2,2,0,0,1
Patrifu,4,7,7,0,7,8,4,4,7,0,0,0,10,4,11,4,0,2,x,0,6,12,0,4,7,4,0,6,2
Penny,4,5,5,0,3,4,0,0,3,0,0,0,8,4,4,5,0,0,0,x,4,4,0,4,0,4,0,3,0
Pino,15,16,2,0,10,22,12,10,10,0,0,0,19,4,14,9,4,5,6,4,x,12,0,2,8,12,4,21,3
Skate,11,11,8,0,7,6,16,10,15,0,0,0,6,4,3,5,4,7,12,4,12,x,0,12,7,16,4,11,13
SoCrem,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,x,0,0,0,0,0,0
Sootz,7,7,4,0,8,18,16,11,9,0,0,0,14,4,15,4,4,6,4,4,2,12,0,x,11,12,4,14,2
Spartan,3,9,6,0,3,6,10,7,10,0,0,0,8,8,4,9,0,2,7,0,8,7,0,11,x,11,4,5,6
Stokes,11,13,7,0,10,8,3,11,9,0,4,0,10,4,17,6,0,2,4,4,12,16,0,12,11,x,0,6,4
Svezio,3,0,3,0,3,0,0,3,0,0,4,0,0,0,4,0,0,0,0,0,4,4,0,4,4,0,x,0,4
Tigrozzo,14,11,9,0,9,8,8,11,10,0,4,0,10,4,16,13,0,0,6,3,21,11,0,14,5,6,0,x,9
WC,12,13,0,0,6,16,7,7,6,0,0,0,17,4,14,10,0,1,2,0,3,13,0,2,6,4,4,9,x
`;

//////////////////////////////////////////////////////
/// ACCESSO AWARDS
//////////////////////////////////////////////////////


function createAccessoTable(csv){

const table=document.getElementById("new-guild-table");
if(!table) return;


// ===== CREA THEAD =====
const lines = csv.trim().split("\n");
const headers = lines[0].split(",");

const thead = document.createElement("thead");
const headerRow = document.createElement("tr");
headerRow.classList.add("sub-header");

headers.forEach(h => {
    const th = document.createElement("th");
    th.textContent = h;

    // dataset.type per la logica colori
    const guildColumns = ["Ad","Aq","B","C","P","S","Vk","Va"];
    const standardColumns = ["Standard"];
    const socialColumns = ["Social"];
    const sketchColumns = ["Sketch"];
    const guerreColumns = ["Guerre"];
    const chamColumns = ["Cham Win"];
    
    if (guildColumns.includes(h)) th.dataset.type = "guild";
    if (standardColumns.includes(h)) th.dataset.type = "standard";
    if (socialColumns.includes(h)) th.dataset.type = "social";
    if (sketchColumns.includes(h)) th.dataset.type = "sketch";
    if (guerreColumns.includes(h)) th.dataset.type = "guerre";
    if (chamColumns.includes(h)) th.dataset.type = "cham";

    // ===== Applica colori gilde solo a celle con titolo guild =====
    if (guildColumns.includes(h)) {
        th.classList.add(h.toLowerCase());
    }

    headerRow.appendChild(th);
});

thead.appendChild(headerRow);
table.appendChild(thead);

// ===== CREA TBODY =====
const tbody = document.createElement("tbody");

// Giocatori con classi “speciali” CSS
const normalPlayers = ["baudo","colt","copter","drius","karmic","noble","puffo","swine"];
const leaderPlayers = [];
const specialPlayers = ["socrem","bibobio","trimrex","deadrick"];

// Celle che rappresentano i titoli gilde
const GUILD_TITLES = ["Ad","Aq","B","C","P","S","Vk","Va"];

lines.slice(1).forEach(line => {
    const row = document.createElement("tr");
    const cells = line.split(",");

    // Mappa colonna → tipo
    const columnMap = headers.map(h => {
        if (["Ad","Aq","B","C","P","S","Vk","Va"].includes(h)) return "guild";
        if (h === "Standard") return "standard";
        if (h === "Social") return "social";
        if (h === "Sketch") return "sketch";
        if (h === "Guerre") return "guerre";
        // if (h === "Cham Win") return "cham";
		if (h.trim().startsWith("Cham Win")) return "cham";
        return null;
    });

    let values = { standard:null, social:null, sketch:null };
    const playerName = cells[0].trim();
    const playerClass = playerName.toLowerCase();

    cells.forEach((cellText, index) => {
        const td = document.createElement("td");
        const type = columnMap[index];
        td.textContent = cellText.trim();

        // ===== Applica colori gilde SOLO alle celle con i titoli Ad, Aq, ... Va =====
        if (GUILD_TITLES.includes(td.textContent.trim())) {
            td.classList.add(td.textContent.trim().toLowerCase()); // es: .ad, .b, .p ...
        }

        // ===== Applica classe giocatore (solo prima e ultima colonna) =====
        if(index === 0 || index === cells.length-1){
            if(normalPlayers.includes(playerClass)){
                td.classList.add(playerClass);
            } else if(leaderPlayers.includes(playerClass)){
                td.classList.add("leader");
            } else if(specialPlayers.includes(playerClass)){
                td.classList.add(playerClass);
            } else {
                td.classList.add("mercenario");
            }
        }

        // ===== Logica colori per colonne numeriche =====
        if (!GUILD_TITLES.includes(td.textContent.trim())) { // escludi celle titoli gilde
            const value = parseInt(td.textContent.trim());
            switch(type){
                case "guild":
                    if (!isNaN(value)) {
                        if (value >= 4) td.classList.add("value-green");
                        else if (value === 3) td.classList.add("value-yellow");
                    }
                    break;
                case "standard":
                    if (!isNaN(value)) {
                        values.standard = value;
                        if (value >= 6) td.classList.add("value-green");
                        else if (value === 5) td.classList.add("value-yellow");
                    }
                    break;
                case "social":
                    if (!isNaN(value)) {
                        values.social = value;
                        if (value >= 6) td.classList.add("value-green");
                        else if (value === 5) td.classList.add("value-yellow");
                    }
                    break;
                case "sketch":
                    if (!isNaN(value)) {
                        values.sketch = value;
                        if (value >= 4) td.classList.add("value-green");
                        else if (value === 3) td.classList.add("value-yellow");
                    }
                    break;
				case "cham":
					// Se la cella non è vuota, applica il verde
					if (td.textContent.trim() !== "") td.classList.add("value-green");
					break;
            }
        }

        row.appendChild(td);
    });

    // ===== Calcola guerre =====
    const guerreIndex = columnMap.indexOf("guerre");
    if(guerreIndex !== -1){
        const guerreCell = row.cells[guerreIndex];
        if(values.standard >=6 && values.social >=6 && values.sketch >=4){
            guerreCell.textContent = "OK";
            guerreCell.classList.add("value-green");
        } else {
            guerreCell.textContent = "NA";
        }
    }

    tbody.appendChild(row);
});

table.appendChild(tbody);

}

//////////////////////////////////////////////////////
/// GIOCATO CON
//////////////////////////////////////////////////////

function createPlayWithTable(csv) {
  const table = document.getElementById("giocatoTable");
  table.innerHTML = ""; // reset tabella

  const specialNamesBlack = ["Baudo","Colt","Copter","Deadrick","Drius","Karmic","Noble","Puffo","Swine","Trimrex"];
  const colorRules = [
    { min: -Infinity, max: 0, className: "value-0" },
    { min: 1, max: 4, className: "value-1-9" },
    { min: 5, max: 10, className: "value-5-10" },
    { min: 11, max: Infinity, className: "value-11plus" }
  ];

  csv.trim().split("\n").forEach((line, rowIndex) => {
    const tr = document.createElement("tr");
    const cells = line.split(",");

    cells.forEach((cell, colIndex) => {
      const td = document.createElement(rowIndex === 0 ? "th" : "td");
      const value = cell.replace(/"/g,"").trim();

      // ==== INTESTAZIONI ====
      if (rowIndex === 0) {
        if (colIndex === 0) {
          td.textContent = ""; // prima cella vuota
        } else {
          td.textContent = value;
          td.classList.add("vertical-text");
          if (specialNamesBlack.includes(value)) td.classList.add("header-special");
          else td.classList.add("header-normal");
        }
      } else if (colIndex === 0) {
        // prima colonna dei nomi
        td.textContent = value;
        if (specialNamesBlack.includes(value)) td.classList.add("header-special");
        else td.classList.add("header-normal");
      } else {
        // ==== CELLE INTERNE ====
        td.textContent = value;

        // tutte le celle numeriche e "x" avranno testo nero
        td.style.color = "black";

        if (value.toLowerCase() === "x") td.classList.add("value-x");
        else {
          const num = parseInt(value);
          if (!isNaN(num)) {
            for (const rule of colorRules) {
              if (num >= rule.min && num <= rule.max) {
                td.classList.add(rule.className);
                break;
              }
            }
          }
        }
      }

      tr.appendChild(td);
    });

    table.appendChild(tr);
  });
}

//////////////////////////////////////////////////////
/// GIOCATO CONTRO
//////////////////////////////////////////////////////

function createPlayAgainstTable(csv) {
  const table = document.getElementById("giocatoCONTROTable");
  if (!table) return; // esci se non esiste
  table.innerHTML = "";

  const specialNamesBlack = ["Baudo","Colt","Copter","Deadrick","Drius","Karmic","Noble","Puffo","Swine","Trimrex"];
  const colorRules = [
    { min: -Infinity, max: 0, className: "value-0" },
    { min: 1, max: 9, className: "value-1-9" },
    { min: 5, max: 10, className: "value-5-10" },
    { min: 11, max: 20, className: "value-11plus" },
    { min: 21, max: Infinity, className: "value-21plus" }
  ];

  csv.trim().split("\n").forEach((line, rowIndex) => {
    const tr = document.createElement("tr");
    const cells = line.split(",");

    cells.forEach((cell, colIndex) => {
      const td = document.createElement(rowIndex === 0 ? "th" : "td");
      const value = cell.replace(/"/g,"").trim();

      // ==== INTESTAZIONI ====
      if (rowIndex === 0) {
        if (colIndex === 0) {
          td.textContent = ""; // prima cella vuota
        } else {
          td.textContent = value;
          td.classList.add("vertical-text");
          if (specialNamesBlack.includes(value)) td.classList.add("header-special");
          else td.classList.add("header-normal");
        }
      } else if (colIndex === 0) {
        // prima colonna dei nomi
        td.textContent = value;
        if (specialNamesBlack.includes(value)) td.classList.add("header-special");
        else td.classList.add("header-normal");
      } else {
        // ==== CELLE INTERNE ====
        td.textContent = value;

        // tutte le celle numeriche e "x" avranno testo nero
        td.style.color = "black";

        if (value.toLowerCase() === "x") td.classList.add("value-x");
        else {
          const num = parseInt(value);
          if (!isNaN(num)) {
            for (const rule of colorRules) {
              if (num >= rule.min && num <= rule.max) {
                td.classList.add(rule.className);
                break;
              }
            }
          }
        }
      }

      tr.appendChild(td);
    });

    table.appendChild(tr);
  });
}


//////////////////////////////////////////////////////
///// RUN
//////////////////////////////////////////////////////

createAccessoTable(CSV_ACCESSO);
createPlayWithTable(CSV_PLAY_WITH);
createPlayAgainstTable(CSV_PLAY_AGAINST);

});
