import { Item } from "./deepestworld";
import { sleep } from "./utility";

type ScoringModifiers = [basePoints: number, scalingFactor: number];

function scoreModifier(basePoints: number, scalingFactor: number, value: number): number {
  const points = basePoints + scalingFactor * value;
  return points;
}

export function calculateItemScore(item: Item): number {
  if (!item) return -100;

  const modifiers: Record<string, ScoringModifiers> = {
    Dmg: [5, 0.5],
    moveSpeed: [10, 0.5],
    mpRegen: [10, 0.5],
    mpInc: [5, 0.5],
  };

  let score = 0;
  for (const modKey in item.mods) {
    const modValue = item.mods[modKey];
    for (const modifier in modifiers) {
      if (modKey.endsWith(modifier)) {
        const [basePoints, scalingFactor] = modifiers[modifier];
        score += scoreModifier(basePoints, scalingFactor, modValue);
      }
    }

    // TODO: Reduce the score the higher level difference there is between item and character level.
  }

  return score;
}

// TODO: ability to not sac specific types if items, with certain enchants.
export async function sacItems(level?: number, maxRarity = 2) {
  const maxLevel = level ?? dw.character.level - 1;

  const altar = dw.entities.find(
    (entity) => entity && entity.md === "enchantingDevice1" && entity.owner
  );

  if (!altar) {
    console.warn("No altar nearby.");
    return;
  }

  // keep things that has a lot of mods with *Dmg with large values
  // moveSpeed mod is important
  // mpInc is a % mana increase
  // mpRegen is mana regen %

  dw.character.bag
    .map((bagItem, bIndex) => {
      // TODO: certain things gives an item a higher score, if we score the item too low, we sacrifice it
      const score = bagItem ? calculateItemScore(bagItem) : 0;

      return { item: bagItem, bIndex: bIndex, score };
    })
    .filter((x) => {
      if (!x.item) return false;
      if (x.item.md === "monsterMission") return false;

      return (
        x.item &&
        x.item.qual <= maxLevel &&
        x.item.r <= maxRarity &&
        !x.item.n &&
        x.item.md !== "monsterMission" &&
        x.score < 20
      );
    })
    .forEach(async (x) => {
      if (altar) {
        const inSacRange = dw.distance(dw.c, altar) < 2;

        if (!inSacRange) {
          console.log("out of range for sac, moving to ", altar);
          dw.move(altar.x, altar.y - 0.5);
          await sleep(5000);
        }

        console.log("sacItem", { id: altar.id, i: x.bIndex });
        dw.emit("sacItem", { id: altar.id, i: x.bIndex });
      }
    });
}
