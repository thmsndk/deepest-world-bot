import { TASK_STATE, TaskTuple, taskRegistry } from ".";
import { config } from "../config";

const TASK_NAME = "inventory_ledger";

export function inventory_ledger(): TaskTuple {
  return [TASK_NAME];
}

type Ledger = { [key: string]: number };
export const ledger: Ledger = {};

taskRegistry[TASK_NAME] = {
  run: async () => {
    if (dw.character.l !== dw.character.spawn.l) {
      return TASK_STATE.DONE;
    }

    const spawnDistance = dw.distance(dw.character, dw.character.spawn);
    if (spawnDistance > 5) {
      return TASK_STATE.DONE;
    }

    // clear object for a new tally
    for (const key in ledger) {
      delete ledger[key];
    }

    const boxes = dw.entities.filter((entity) => entity && entity.md.startsWith("box") && entity.owner);

    for (const box of boxes) {
      for (const item of box.storage) {
        if (!item) continue;
        if (item.r > 0) continue; // only count white items

        if (!ledger[item.md]) {
          ledger[item.md] = 0;
        }
        ledger[item.md] += item.n ?? 1;
      }
    }

    for (const key in ledger) {
      const value = ledger[key];
      // Toggle features on / off based on tally
      switch (key) {
        case "wood":
        case "rock":
        case "iron":
          const missing = 1000 - value;
          const configValue = Number(config[`collect_${key}_low_threshold`]);
          if (missing > 0 && configValue !== missing) {
            config[`collect_${key}_low_threshold`] = missing;
          } else if (missing < 0 && configValue > 0) {
            config[`collect_${key}_low_threshold`] = 0;
          }
          break;
        // TODO: what about raw gems? they have different names.
      }
    }

    return TASK_STATE.DONE;
  },
};

declare global {
  interface Window {
    ledger: Ledger;
  }
}
top!.ledger = ledger;
