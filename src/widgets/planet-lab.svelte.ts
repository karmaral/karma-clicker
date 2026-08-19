import planetVisuals from '$data/planet-visuals';
import { cloneVisual, printVisual, type PlanetVisual } from './planet';

/**
 * The lab's working copy. Edits live here, never in `$data/planet-visuals` —
 * the panel emits a literal you paste back, so nothing is authored by accident.
 */
function createPlanetLab() {
  const ids = Object.keys(planetVisuals);
  const drafts = $state<Record<string, PlanetVisual>>(
    Object.fromEntries(ids.map((id) => [id, cloneVisual(planetVisuals[id])])),
  );

  let selected = $state(ids[0]);

  function select(id: string) {
    if (drafts[id]) selected = id;
  }

  function set(key: keyof PlanetVisual, value: number) {
    if (!Number.isFinite(value)) return;

    drafts[selected][key] = value;
  }

  /** One slider's worth of `revert` — what a double-click on it undoes. */
  function reset(key: keyof PlanetVisual) {
    drafts[selected][key] = planetVisuals[selected][key];
  }

  function reseed() {
    drafts[selected].seed = Math.floor(Math.random() * 100_000);
  }

  function revert() {
    drafts[selected] = cloneVisual(planetVisuals[selected]);
  }

  /** The selected record alone, ready to replace its entry in the data file. */
  function print() {
    return printVisual(selected, drafts[selected]);
  }

  return {
    ids,
    get selected() { return selected; },
    get current() { return drafts[selected]; },
    get drafts() { return drafts; },
    select,
    set,
    reset,
    reseed,
    revert,
    print,
  };
}

export const planetLab = createPlanetLab();
