// Configurazione statica NPGW. I risultati effettivi provengono solo dal CSV.
export const GUILDS = {
  Valore: { color: '#BFA451', leader: 'Noble', official: 'Visione e Arbitrio', sideQuest: 'Onniscienza' },
  Bastione: { color: '#A17D52', leader: 'Copter', official: 'Stabilità e Longevità', sideQuest: 'Indistruttibilità' },
  Cobra: { color: '#6F8D48', leader: 'Colt', official: 'Inganno e Potere', sideQuest: 'Tuono' },
  Sciabola: { color: '#E2A366', leader: 'Karmic', official: 'Ira e Lealtà', sideQuest: 'Incenerimento' },
  Ade: { color: '#887BB8', leader: 'Swine', official: 'Isolamento e Tempesta', sideQuest: 'Necromanzia' },
  Aquila: { color: '#3C89C6', leader: 'Baudo', official: 'Espansione e Forza', sideQuest: 'Boato' },
  Valchiria: { color: '#94DDDF', leader: 'Drius', official: 'Precisione e Onore', sideQuest: 'Percezione' },
  Pericolo: { color: '#C16A6A', leader: 'Puffo', official: 'Gloria e Astuzia', sideQuest: 'Terrore' },
};

// Ordine di visualizzazione concordato, indipendente dall'ordine delle partite nel CSV.
export const OFFICIAL_WARS = [
  ['Fondatori', ['Bastione'], ['Valore']],
  ['LAN', ['Aquila'], ['Valchiria']],
  ['The Great LAN pt.1', ['Ade'], ['Sciabola']],
  ['The Great LAN pt.2', ['Cobra'], ['Pericolo']],
  ['Ribellione Fuoco', ['Ade', 'Sciabola'], ['Valchiria', 'Pericolo']],
  ['Ribellione Inganno', ['Aquila', 'Cobra'], ['Bastione', 'Valore']],
  ['Ribellione Amici', ['Pericolo', 'Cobra'], ['Bastione', 'Valore']],
  ['Ribellione Veleno', ['Ade', 'Sciabola'], ['Valchiria', 'Aquila']],
  ['Nuovo Potere', ['Valore', 'Sciabola'], ['Valchiria', 'Cobra']],
  ['Vecchio Potere', ['Ade', 'Bastione'], ['Pericolo', 'Aquila']],
  ['Guerra Finale', ['Ade', 'Sciabola', 'Pericolo', 'Valore'], ['Aquila', 'Bastione', 'Cobra', 'Valchiria']],
].map(([chapter, army1, army2], index) => ({ chapter, order: index + 1, armies: [army1, army2] }));

export const SIDE_QUEST_SLOTS = Object.freeze([
  { number: 1, guildsPerArmy: 1 },
  { number: 2, guildsPerArmy: 1 },
  { number: 3, guildsPerArmy: 2 },
  { number: 4, guildsPerArmy: 2 },
  { number: 5, guildsPerArmy: 3 },
]);

export const MATCH_CATEGORIES = ['Sketch', 'Standard', 'Social', 'Champions'];
export const MODES = ['TS', 'FFA', 'MTS'];
export const CLASSES = ['Leader', 'Mercenario'];
export const ACCESS = Object.freeze({ Sketch: 4, Standard: 6, Social: 6, guild: 4 });

// Normalizzazioni note dei dati; le etichette pubbliche restano accentate.
export const CAMPAIGN_ALIASES = {
  'Stabilita e Longevita': 'Stabilità e Longevità',
  'Ira e Lealta': 'Ira e Lealtà',
  Onniscenza: 'Onniscienza', // Solo per il campione provvisorio già fornito.
};
