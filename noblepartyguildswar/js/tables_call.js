document.addEventListener("DOMContentLoaded", function () {

///////////////////////////////
/// CSV DATA
///////////////////////////////

const CSV_ACCESSO = `
Giocatore,Ad,Aq,B,C,P,S,Vk,Va,Standard,Social,Sketch,Guerre,Cham Win.,Champions,Giocatore
Apocal,,,4,,,,,,2,1,1,NA,,,Apocal
Baudo,,16,7,7,4,4,,3,13,16,10,OK,,2,Baudo
Bibobio,,,,,,,,,,,,,,,Bibobio
Clavuss,,4,8,12,,4,2,4,10,14,10,OK,,,Clavuss
Colt,3,6,4,15,2,3,4,,11,14,10,OK,,2,Colt
Copter,,2,15,3,1,,,4,8,8,8,OK,,1,Copter
Deadrick,,,,,,,,,,,,,,,Deadrick
Drius,,,3,3,3,,12,4,8,9,7,OK,,1,Drius
Gigatzu,,4,,4,,4,,,3,4,5,NA,,,Gigatzu
Glimpse,2,5,4,12,6,,5,6,15,13,11,OK,,1,Glimpse
Ifrid,1,6,,8,5,4,1,,5,12,8,NA,,,Ifrid
Joemoo,,,,,,,,4,,2,2,NA,,,Joemoo
Karmic,,5,4,6,4,11,1,7,11,16,9,OK,,2,Karmic
Khan,,,,,6,,,8,3,6,4,NA,0,1,Khan
Noble,5,1,,,5,3,1,19,11,13,9,OK,,1,Noble
Patrifu,4,4,4,,,,4,4,5,8,6,NA,1,1,Patrifu
Penny,,,,4,4,,,4,2,6,4,NA,,,Penny
Pino,3,4,8,4,7,4,4,6,14,15,10,OK,0,1,Pino
Puffo,4,1,3,,16,,1,7,11,12,8,OK,,1,Puffo
Skate,,,4,11,4,,,4,7,9,6,OK,,1,Skate
SoCrem,,,,,,,,,,,,,,,SoCrem
Sootz,6,4,8,4,,4,,6,11,10,10,OK,,1,Sootz
Spartan,,,4,4,4,4,3,4,6,9,7,OK,0,1,Spartan
Stokes,4,4,,,,4,,8,6,8,5,OK,,1,Stokes
Svezio,,,4,4,,4,,,4,4,4,NA,,,Svezio
Swine,12,1,7,3,2,3,5,4,13,12,10,OK,,2,Swine
Tigrozzo,4,4,4,4,6,4,5,4,10,15,9,OK,1,1,Tigrozzo
Trimrex,,,,4,,,,,1,2,1,NA,,,Trimrex
WC,4,,8,4,4,4,3,2,10,11,7,OK,,1,WC
`;

// Dati CSV
const CSV_PLAY_WITH = `
"",Baudo,Colt,Copter,Deadrick,Drius,Karmic,Noble,Puffo,Swine,Trimrex,Apocal,Bibobio,Clavuss,Gigatzu,Glimpse,Ifrid,Joemoo,Khan,Patrifu,Penny,Pino,Skate,SoCrem,Sootz,Spartan,Stokes,Svezio,Tigrozzo,WC
Baudo,x,23,12,0,9,19,7,13,7,3,3,0,14,5,21,13,3,3,9,6,19,13,0,11,15,9,3,14,11
Colt,23,x,9,0,9,14,8,8,14,4,0,0,18,9,18,17,1,1,8,7,14,12,0,10,9,8,7,15,9
Copter,12,9,x,0,8,12,8,7,13,0,3,0,15,3,8,3,1,3,7,2,15,8,0,17,8,6,4,8,11
Deadrick,0,0,0,x,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Drius,9,9,8,0,x,8,9,14,8,0,3,0,9,6,17,6,1,4,6,1,14,12,0,8,6,2,0,11,11
Karmic,19,14,12,0,8,x,13,10,11,0,0,0,27,4,13,9,3,6,8,3,8,14,0,9,12,11,6,19,6
Noble,7,8,8,0,9,13,x,17,16,0,0,0,11,4,9,6,3,9,11,6,17,6,0,14,4,13,3,14,9
Puffo,13,8,7,0,14,10,17,x,10,3,3,0,7,1,17,7,3,8,8,10,16,11,0,10,11,8,3,9,17
Swine,7,14,13,0,8,11,16,10,x,0,0,0,14,6,9,9,1,5,8,3,17,6,0,20,5,9,6,12,12
Trimrex,3,4,0,0,0,0,0,3,0,x,0,0,0,0,3,2,0,0,0,4,0,0,0,0,3,0,4,0,4
Apocal,3,0,3,0,3,0,0,3,0,0,x,0,0,0,4,0,0,0,0,0,4,4,0,4,4,0,0,0,4
Bibobio,0,0,0,0,0,0,0,0,0,0,0,x,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Clavuss,14,18,15,0,9,27,11,7,14,0,0,0,x,8,17,13,1,3,6,1,7,17,0,11,9,10,8,18,5
Gigatzu,5,9,3,0,6,4,4,1,6,0,0,0,8,x,8,11,1,1,4,1,7,4,0,4,1,5,4,7,0
Glimpse,21,18,8,0,17,13,9,17,9,3,4,0,17,8,x,15,1,1,4,6,15,20,0,9,14,1,3,8,9
Ifrid,13,17,3,0,6,9,6,7,9,2,0,0,13,11,15,x,1,1,4,5,10,7,0,5,4,7,6,7,3
Joemoo,3,1,1,0,1,3,3,3,1,0,0,0,1,1,1,1,x,4,4,4,1,1,0,1,4,4,0,4,0
Khan,3,1,3,0,4,6,9,8,5,0,0,0,3,1,1,1,4,x,6,4,8,2,0,5,4,4,0,10,4
Patrifu,9,8,7,0,6,8,11,8,8,0,0,0,6,4,4,4,4,6,x,4,11,2,0,10,5,10,0,12,5
Penny,6,7,2,0,1,3,6,10,3,4,0,0,1,1,6,5,4,4,4,x,5,1,0,1,7,4,4,4,4
Pino,19,14,15,0,14,8,17,16,17,0,4,0,7,7,15,10,1,8,11,5,x,9,0,20,5,6,0,10,14
Skate,13,12,8,0,12,14,6,11,6,0,4,0,17,4,20,7,1,2,2,1,9,x,0,10,10,2,0,7,6
SoCrem,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,x,0,0,0,0,0,0
Sootz,11,10,17,0,8,9,14,10,20,0,4,0,11,4,9,5,1,5,10,1,20,10,0,x,10,7,3,4,17
Spartan,15,9,8,0,6,12,4,11,5,3,4,0,9,1,14,4,4,4,5,7,5,10,0,10,x,5,6,9,12
Stokes,9,8,6,0,2,11,13,8,9,0,0,0,10,5,1,7,4,4,10,4,6,2,0,7,5,x,4,12,5
Svezio,3,7,4,0,0,6,3,3,6,4,0,0,8,4,3,6,0,0,0,4,0,0,0,3,6,4,x,4,7
Tigrozzo,14,15,8,0,11,19,14,9,12,0,0,0,18,7,8,7,4,10,12,4,10,7,0,4,9,12,4,x,7
WC,11,9,11,0,11,6,9,17,12,4,4,0,5,0,9,3,0,4,5,4,14,6,0,17,12,5,7,7,x
`;

// Dati CSV
const CSV_PLAY_AGAINST = `
"",Baudo,Colt,Copter,Deadrick,Drius,Karmic,Noble,Puffo,Swine,Trimrex,Apocal,Bibobio,Clavuss,Gigatzu,Glimpse,Ifrid,Joemoo,Khan,Patrifu,Penny,Pino,Skate,SoCrem,Sootz,Spartan,Stokes,Svezio,Tigrozzo,WC
Baudo,x,11,12,0,15,17,23,17,23,1,0,0,17,5,11,9,0,8,9,5,18,7,0,14,5,8,8,17,15
Colt,11,x,15,0,11,19,18,21,14,0,3,0,14,1,12,3,2,11,10,4,18,8,0,15,11,9,4,13,15
Copter,12,15,x,0,9,12,11,13,8,4,0,0,8,7,13,11,2,5,7,8,8,5,0,4,8,6,7,10,5
Deadrick,0,0,0,x,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Drius,15,11,9,0,x,13,8,4,10,0,0,0,10,4,5,9,2,3,4,2,9,4,0,9,6,7,7,6,7
Karmic,17,19,12,0,13,x,16,17,18,4,3,0,3,6,16,11,0,4,10,8,26,5,0,16,8,6,5,10,17
Noble,23,18,11,0,8,16,x,9,11,4,3,0,14,2,20,10,0,1,3,4,10,13,0,11,12,3,4,9,10
Puffo,17,21,13,0,4,17,9,x,15,1,0,0,21,5,11,11,0,4,6,1,12,9,0,11,5,9,4,15,5
Swine,23,14,8,0,10,18,11,15,x,4,3,0,11,3,21,7,2,3,9,6,12,11,0,8,14,6,4,12,9
Trimrex,1,0,4,0,0,4,4,1,4,x,0,0,4,0,1,1,0,4,4,0,4,0,0,4,1,0,0,4,0
Apocal,0,3,0,0,0,3,3,0,3,0,x,0,4,4,0,4,0,0,0,0,0,0,0,0,0,4,4,4,0
Bibobio,0,0,0,0,0,0,0,0,0,0,0,x,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
Clavuss,17,14,8,0,10,3,14,21,11,4,4,0,x,4,14,9,3,9,12,11,24,4,0,15,12,8,4,10,20
Gigatzu,5,1,7,0,4,6,2,5,3,0,4,0,4,x,4,0,3,3,4,3,5,4,0,8,11,3,4,4,8
Glimpse,11,12,13,0,5,16,20,11,21,1,0,0,14,4,x,7,3,12,14,4,18,1,0,21,7,15,9,19,17
Ifrid,9,3,11,0,9,11,10,11,7,1,4,0,9,0,7,x,3,10,7,5,13,5,0,10,11,5,4,16,14
Joemoo,0,2,2,0,2,0,0,0,2,0,0,0,3,3,3,3,x,0,0,0,3,3,0,3,0,0,0,0,0
Khan,8,11,5,0,3,4,1,4,3,4,0,0,9,3,12,10,0,x,4,4,4,6,0,4,6,1,4,2,5
Patrifu,9,10,7,0,4,10,3,6,9,4,0,0,12,4,14,7,0,4,x,4,6,9,0,9,14,1,8,5,9
Penny,5,4,8,0,2,8,4,1,6,0,0,0,11,3,4,5,0,4,4,x,7,3,0,7,1,4,0,7,0
Pino,18,18,8,0,9,26,10,12,12,4,0,0,24,5,18,13,3,4,6,7,x,11,0,5,15,11,12,22,11
Skate,7,8,5,0,4,5,13,9,11,0,0,0,4,4,1,5,3,6,9,3,11,x,0,9,4,13,4,10,10
SoCrem,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,x,0,0,0,0,0,0
Sootz,14,15,4,0,9,16,11,11,8,4,0,0,15,8,21,10,3,4,9,7,5,9,0,x,12,8,9,17,4
Spartan,5,11,8,0,6,8,12,5,14,1,0,0,12,11,7,11,0,6,14,1,15,4,0,12,x,9,6,11,6
Stokes,8,9,6,0,7,6,3,9,6,0,4,0,8,3,15,5,0,1,1,4,11,13,0,8,9,x,0,5,4
Svezio,8,4,7,0,7,5,4,4,4,0,4,0,4,4,9,4,0,4,8,0,12,4,0,9,6,0,x,7,5
Tigrozzo,17,13,10,0,6,10,9,15,12,4,4,0,10,4,19,16,0,2,5,7,22,10,0,17,11,5,7,x,15
WC,15,15,5,0,7,17,10,5,9,0,0,0,20,8,17,14,0,5,9,0,11,10,0,4,6,4,5,15,x
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
