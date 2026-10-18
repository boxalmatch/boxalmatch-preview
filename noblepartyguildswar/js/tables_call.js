document.addEventListener("DOMContentLoaded", function () {

///////////////////////////////
/// CSV DATA
///////////////////////////////

const CSV_ACCESSO = `
Giocatore,Ad,Aq,B,C,P,S,Vk,Va,Standard,Social,Sketch,Guerre,Cham Win.,Champions,Giocatore
Apocal,,,4,,,,,,2,1,1,NA,,,Apocal
Baudo,,16,7,7,,4,,3,12,14,9,OK,,2,Baudo
Bibobio,,,,,,,,,,,,,,,Bibobio
Clavuss,,4,4,12,,4,2,4,9,12,9,OK,,,Clavuss
Colt,3,6,4,11,2,3,4,,10,12,9,OK,,2,Colt
Copter,,2,11,3,1,,,4,7,6,7,OK,,1,Copter
Deadrick,,,,,,,,,,,,,,,Deadrick
Drius,,,3,3,3,,12,4,8,9,7,OK,,1,Drius
Gigatzu,,4,,4,,4,,,3,4,5,NA,,,Gigatzu
Glimpse,2,5,4,12,2,,5,6,14,11,10,OK,,1,Glimpse
Ifrid,1,6,,8,2,4,1,,4,11,7,NA,,,Ifrid
Joemoo,,,,,,,,4,,2,2,NA,,,Joemoo
Karmic,,5,,6,4,11,1,7,10,14,8,OK,,2,Karmic
Khan,,,,,6,,,4,2,4,3,NA,0,1,Khan
Noble,5,1,,,5,3,1,15,10,11,8,OK,,1,Noble
Patrifu,4,4,,,,,4,4,4,6,5,NA,1,1,Patrifu
Penny,,,,,4,,,4,1,4,3,NA,,,Penny
Pino,3,4,8,4,7,4,4,2,13,13,9,OK,0,1,Pino
Puffo,4,1,3,,12,,1,7,10,10,7,OK,,1,Puffo
Skate,,,4,11,4,,,4,7,9,6,OK,,1,Skate
SoCrem,,,,,,,,,,,,,,,SoCrem
Sootz,6,4,8,4,,4,,2,10,8,9,OK,,1,Sootz
Spartan,,,4,4,,4,3,4,5,7,6,NA,0,1,Spartan
Stokes,4,4,,,,4,,8,6,8,5,OK,,1,Stokes
Svezio,,,4,,,4,,,3,2,3,NA,,,Svezio
Swine,12,1,7,3,2,3,5,,12,10,9,OK,,2,Swine
Tigrozzo,4,4,,4,6,4,5,4,9,13,8,OK,1,1,Tigrozzo
Trimrex,,,,,,,,,,,,,,,Trimrex
WC,4,,8,,4,4,3,2,9,9,6,OK,,1,WC
`;

// Dati CSV
const CSV_PLAY_WITH = `
"",Baudo,Colt,Copter,Deadrick,Drius,Karmic,Noble,Puffo,Swine,Trimrex,Apocal,Bibobio,Clavuss,Gigatzu,Glimpse,Ifrid,Joemoo,Khan,Patrifu,Penny,Pino,Skate,SoCrem,Sootz,Spartan,Stokes,Svezio,Tigrozzo,WC
Baudo,x,20,12,0,9,19,7,9,7,0,3,0,14,5,17,10,3,3,9,3,19,13,0,11,11,9,0,14,8
Colt,20,x,9,0,9,14,8,5,14,0,0,0,18,9,15,15,1,1,8,3,14,12,0,10,6,8,3,15,5
Copter,12,9,x,0,8,8,6,7,11,0,3,0,11,3,8,3,1,1,3,2,13,8,0,15,8,6,4,4,11
Deadrick,0,0,0,x,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Drius,9,9,8,0,x,8,9,14,8,0,3,0,9,6,17,6,1,4,6,1,14,12,0,8,6,2,0,11,11
Karmic,19,14,8,0,8,x,11,10,9,0,0,0,23,4,13,9,3,4,4,3,6,14,0,7,12,11,6,15,6
Noble,7,8,6,0,9,11,x,17,12,0,0,0,9,4,9,6,3,5,9,6,13,6,0,10,4,13,3,12,9
Puffo,9,5,7,0,14,10,17,x,10,0,3,0,7,1,13,4,3,8,8,7,16,11,0,10,7,8,0,9,14
Swine,7,14,11,0,8,9,12,10,x,0,0,0,12,6,9,9,1,1,6,3,13,6,0,16,5,9,6,10,12
Trimrex,0,0,0,0,0,0,0,0,0,x,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Apocal,3,0,3,0,3,0,0,3,0,0,x,0,0,0,4,0,0,0,0,0,4,4,0,4,4,0,0,0,4
Bibobio,0,0,0,0,0,0,0,0,0,0,0,x,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Clavuss,14,18,11,0,9,23,9,7,12,0,0,0,x,8,17,13,1,1,2,1,5,17,0,9,9,10,8,14,5
Gigatzu,5,9,3,0,6,4,4,1,6,0,0,0,8,x,8,11,1,1,4,1,7,4,0,4,1,5,4,7,0
Glimpse,17,15,8,0,17,13,9,13,9,0,4,0,17,8,x,12,1,1,4,3,15,20,0,9,10,1,0,8,6
Ifrid,10,15,3,0,6,9,6,4,9,0,0,0,13,11,12,x,1,1,4,3,10,7,0,5,1,7,4,7,1
Joemoo,3,1,1,0,1,3,3,3,1,0,0,0,1,1,1,1,x,4,4,4,1,1,0,1,4,4,0,4,0
Khan,3,1,1,0,4,4,5,8,1,0,0,0,1,1,1,1,4,x,4,4,4,2,0,1,4,4,0,8,4
Patrifu,9,8,3,0,6,4,9,8,6,0,0,0,2,4,4,4,4,4,x,4,9,2,0,8,5,10,0,8,5
Penny,3,3,2,0,1,3,6,7,3,0,0,0,1,1,3,3,4,4,4,x,5,1,0,1,4,4,0,4,0
Pino,19,14,13,0,14,6,13,16,13,0,4,0,5,7,15,10,1,4,9,5,x,9,0,16,5,6,0,8,14
Skate,13,12,8,0,12,14,6,11,6,0,4,0,17,4,20,7,1,2,2,1,9,x,0,10,10,2,0,7,6
SoCrem,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,x,0,0,0,0,0,0
Sootz,11,10,15,0,8,7,10,10,16,0,4,0,9,4,9,5,1,1,8,1,16,10,0,x,10,7,3,2,17
Spartan,11,6,8,0,6,12,4,7,5,0,4,0,9,1,10,1,4,4,5,4,5,10,0,10,x,5,3,9,9
Stokes,9,8,6,0,2,11,13,8,9,0,0,0,10,5,1,7,4,4,10,4,6,2,0,7,5,x,4,12,5
Svezio,0,3,4,0,0,6,3,0,6,0,0,0,8,4,0,4,0,0,0,0,0,0,0,3,3,4,x,4,3
Tigrozzo,14,15,4,0,11,15,12,9,10,0,0,0,14,7,8,7,4,8,8,4,8,7,0,2,9,12,4,x,7
WC,8,5,11,0,11,6,9,14,12,0,4,0,5,0,6,1,0,4,5,0,14,6,0,17,9,5,3,7,x
`;

// Dati CSV
const CSV_PLAY_AGAINST = `
"",Baudo,Colt,Copter,Deadrick,Drius,Karmic,Noble,Puffo,Swine,Trimrex,Apocal,Bibobio,Clavuss,Gigatzu,Glimpse,Ifrid,Joemoo,Khan,Patrifu,Penny,Pino,Skate,SoCrem,Sootz,Spartan,Stokes,Svezio,Tigrozzo,WC
Baudo,x,10,8,0,15,13,19,17,19,0,0,0,13,5,11,9,0,4,5,4,14,7,0,10,5,8,7,13,14
Colt,10,x,11,0,11,15,14,20,10,0,3,0,10,1,11,2,2,7,6,4,14,8,0,11,10,9,4,9,15
Copter,8,11,x,0,9,12,9,9,6,0,0,0,8,7,9,8,2,3,7,4,6,5,0,2,4,6,3,10,1
Deadrick,0,0,0,x,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Drius,15,11,9,0,x,13,8,4,10,0,0,0,10,4,5,9,2,3,4,2,9,4,0,9,6,7,7,6,7
Karmic,13,15,12,0,13,x,14,13,16,0,3,0,3,6,12,8,0,2,10,4,24,5,0,14,4,6,1,10,13
Noble,19,14,9,0,8,14,x,5,11,0,3,0,12,2,16,7,0,1,1,0,10,13,0,11,8,3,0,7,6
Puffo,17,20,9,0,4,13,5,x,11,0,0,0,17,5,11,11,0,0,2,0,8,9,0,7,5,9,3,11,4
Swine,19,10,6,0,10,16,11,11,x,0,3,0,9,3,17,4,2,3,7,2,12,11,0,8,10,6,0,10,5
Trimrex,0,0,0,0,0,0,0,0,0,x,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Apocal,0,3,0,0,0,3,3,0,3,0,x,0,4,4,0,4,0,0,0,0,0,0,0,0,0,4,4,4,0
Bibobio,0,0,0,0,0,0,0,0,0,0,0,x,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Clavuss,13,10,8,0,10,3,12,17,9,0,4,0,x,4,10,6,3,7,12,7,22,4,0,13,8,8,0,10,16
Gigatzu,5,1,7,0,4,6,2,5,3,0,4,0,4,x,4,0,3,3,4,3,5,4,0,8,11,3,4,4,8
Glimpse,11,11,9,0,5,12,16,11,17,0,0,0,10,4,x,7,3,8,10,3,14,1,0,17,7,15,8,15,16
Ifrid,9,2,8,0,9,8,7,11,4,0,4,0,6,0,7,x,3,7,4,4,10,5,0,7,11,5,3,13,13
Joemoo,0,2,2,0,2,0,0,0,2,0,0,0,3,3,3,3,x,0,0,0,3,3,0,3,0,0,0,0,0
Khan,4,7,3,0,3,2,1,0,3,0,0,0,7,3,8,7,0,x,2,0,4,6,0,4,2,1,0,0,1
Patrifu,5,6,7,0,4,10,1,2,7,0,0,0,12,4,10,4,0,2,x,0,4,9,0,7,10,1,4,5,5
Penny,4,4,4,0,2,4,0,0,2,0,0,0,7,3,3,4,0,0,0,x,3,3,0,3,0,4,0,3,0
Pino,14,14,6,0,9,24,10,8,12,0,0,0,22,5,14,10,3,4,4,3,x,11,0,5,11,11,8,20,7
Skate,7,8,5,0,4,5,13,9,11,0,0,0,4,4,1,5,3,6,9,3,11,x,0,9,4,13,4,10,10
SoCrem,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,x,0,0,0,0,0,0
Sootz,10,11,2,0,9,14,11,7,8,0,0,0,13,8,17,7,3,4,7,3,5,9,0,x,8,8,5,15,0
Spartan,5,10,4,0,6,4,8,5,10,0,0,0,8,11,7,11,0,2,10,0,11,4,0,8,x,9,5,7,5
Stokes,8,9,6,0,7,6,3,9,6,0,4,0,8,3,15,5,0,1,1,4,11,13,0,8,9,x,0,5,4
Svezio,7,4,3,0,7,1,0,3,0,0,4,0,0,4,8,3,0,0,4,0,8,4,0,5,5,0,x,3,5
Tigrozzo,13,9,10,0,6,10,7,11,10,0,4,0,10,4,15,13,0,0,5,3,20,10,0,15,7,5,3,x,11
WC,14,15,1,0,7,13,6,4,5,0,0,0,16,8,16,13,0,1,5,0,7,10,0,0,5,4,5,11,x
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

// Display-only IT/EN labels; the raw header string `h` still drives all the
// column-type logic below, so matching on it stays intact.
const HEADER_LABELS = { "Guerre": "Wars", "Giocatore": "Player" };

headers.forEach(h => {
    const th = document.createElement("th");
    if (HEADER_LABELS[h.trim()]) {
        th.innerHTML = '<span lang="it">' + h.trim() + '</span>'
                     + '<span lang="en">' + HEADER_LABELS[h.trim()] + '</span>';
    } else {
        th.textContent = h;
    }

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
