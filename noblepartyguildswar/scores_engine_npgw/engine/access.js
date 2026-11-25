import { ACCESS, GUILDS } from '../config/config.js';
import { buildBwa } from './bwa.js';

const REQUIRED_CATEGORIES = ['Sketch', 'Standard', 'Social'];

function progress(performance, required) {
  const played = performance.appearances;
  return {
    eligible: played >= required,
    played,
    required,
    remaining: Math.max(0, required - played),
  };
}

/**
 * Requisiti e avanzamento degli Award, senza ricalcolare punti o BWA.
 * Accetta sia il risultato di buildBwa sia direttamente readResults(csv).
 * Per Viaggiatore, fino allo sblocco di Guerre si mostra solo Guerre;
 * successivamente si mostrano i nomi delle Gilde ancora mancanti, senza
 * indicare quante partite servono per ognuna.
 */
export function buildAccess(source) {
  const bwa = source?.parameters && source?.players ? source : buildBwa(source);
  const players = {};

  for (const p of Object.values(bwa.players)) {
    const categories = Object.fromEntries(REQUIRED_CATEGORIES.map(category =>
      [category, progress(p.categories[category], ACCESS[category])]
    ));
    categories.Champions = progress(p.categories.Champions, 1);

    const guilds = Object.fromEntries(Object.keys(GUILDS).map(guild =>
      [guild, progress(p.guilds[guild], ACCESS.guild)]
    ));

    const missingCategories = REQUIRED_CATEGORIES.filter(category => !categories[category].eligible);
    const missingGuilds = Object.keys(GUILDS).filter(guild => !guilds[guild].eligible);
    const guerreEligible = missingCategories.length === 0;
    const viaggiatoreEligible = guerreEligible && missingGuilds.length === 0;

    const guerre = {
      eligible: guerreEligible,
      missingCategories,
      remainingByCategory: Object.fromEntries(missingCategories.map(category =>
        [category, categories[category].remaining]
      )),
      remainingMatches: missingCategories.reduce((sum, category) => sum + categories[category].remaining, 0),
    };

    const viaggiatore = {
      eligible: viaggiatoreEligible,
      missingGuerre: !guerreEligible,
      // L'ordine di sblocco stabilito nasconde le Gilde fino all'accesso a Guerre.
      missingGuilds: guerreEligible ? missingGuilds : [],
      nextRequirement: !guerreEligible ? 'Guerre' : missingGuilds.length ? 'Gilde' : null,
    };

    players[p.player] = {
      player: p.player,
      class: p.class,
      categories,
      guilds,
      guerre,
      viaggiatore,
      // Etichetta da mostrare anche nella classifica Guerre provvisoria.
      viaggiatoreLabel: viaggiatoreEligible ? 'Accesso a Viaggiatore' : null,
    };
  }

  return { players };
}
