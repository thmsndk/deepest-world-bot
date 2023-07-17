import { Item } from "./deepestworld";
import { sleep } from "./utility";

type ScoringModifiers = [basePoints: number, scalingFactor: number];

function scoreModifier(basePoints: number, scalingFactor: number, value: number): number {
  const points = basePoints + scalingFactor * value;
  return points;
}
const mdScore: Record<string, ScoringModifiers> = {
  attack: [1, 0.1],
  taunt: [1, 0.1],
  frostbolt: [1, 0.1],
  firebolt: [1, 0.1],
  fastheal1: [1, 0.1],
  heal: [1, 0.1],
  slowheal: [1, 0.1],
  elecbolt: [1, 0.1],
  physbolt: [1, 0.1],
  axe1: [1, 0.1],
  bow1: [1, 0.1],
  wand1: [1, 0.1],
  dagger1: [1, 0.1],
  helmet1: [1, 0.1],
  gloves1: [1, 0.1],
  chest1: [1, 0.1],
  boots1: [1, 0.1],
  boots2: [1, 0.1],
  ruby: [1, 0.1],
  sapphire: [1, 0.1],
  amethyst: [1, 0.1],
};

export function calculateItemScore(item: Item): number {
  if (!item) return -100;
  if (item.n) return -100; // stackable items can't be disenchanted.

  const modScore: Record<string, ScoringModifiers> = {
    Dmg: [5, 0.5],
    DmgLocal: [5, 0.5],

    DmgInc: [5, 0.25],
    DmgIncLocal: [2, 0.25],

    dmgInc: [5, 0.25],

    hpRegen: [2, 0.5],

    moveSpeed: [10, 0.5],
    mp: [5, 0.5],
    mpRegen: [10, 0.5],
    mpInc: [2, 0.5],
    crit: [1, 0.1],
    critMult: [1, 0.1],
    spellEffectInc: [1, 0.1],

    acidRes: [2, 1],
    Res: [1, 1],
    threatMore: [1, 0.1],
    armorLocal: [1, 0.1],
    armorInc: [1, 0.1],
    armorIncLocal: [1, 0.1],

    debuffEffectInc: [1, 0.1],

    rangeIncLocal: [1, 0.1],
  };

  let score = 0;
  for (const modKey in item.mods) {
    const modValue = item.mods[modKey];

    let mappedScore = false;
    for (const modifier in modScore) {
      if (modKey.endsWith(modifier)) {
        mappedScore = true;
        const [basePoints, scalingFactor] = modScore[modifier];
        score += scoreModifier(basePoints, scalingFactor, modValue);
      }
    }

    if (!mappedScore) {
      // modifier is not scored we make it important
      console.warn(`${item.md} has a ${modKey}:${modValue} modifier that is not weighted`);
      score += 50;
    }

    // TODO: Reduce the score the higher level difference there is between item and character level.

    mdScore;
  }

  // we need to score known spells / items, so we can give unknown items a higher score.
  let mappedScore = false;
  for (const itemName in mdScore) {
    if (item.md.endsWith(itemName)) {
      mappedScore = true;
      const [basePoints, scalingFactor] = mdScore[itemName];
      score += scoreModifier(basePoints, scalingFactor, 1);
    }
  }

  if (!mappedScore) {
    console.warn(`${item.md} is not weighted`);
    score += 50;
  }

  return score;
}

// TODO: ability to not sac specific types if items, with certain enchants.
export async function sacItems(level?: number, maxRarity = 2) {
  const maxLevel = level ?? dw.character.level - 1;

  const altar = dw.entities.find((entity) => entity && entity.md === "enchantingDevice1" && entity.owner);

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
