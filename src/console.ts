import { Item } from "./deepestworld";
import { sleep } from "./utility";

declare global {
  interface Window {
    goHome: () => void;
    setSpawn: () => void;
    sacItems: () => void;
    merge: () => void;
  }
}

export function registerConsoleCommands() {
  // Add to console as our character runs in an iframe
  top!.goHome = goHome;
  top!.setSpawn = setSpawn;
  top!.sacItems = sacItems;
  top!.merge = merge;
}
// go to spawn
function goHome() {
  dw.move(dw.character.spawn.x, dw.character.spawn.y);
}

// go to spawn
function setSpawn() {
  const spawns = dw.get("spawns") ?? [];
  spawns.push(dw.character.spawn);
  dw.emit("setSpawn");
  dw.set("spawns", spawns);
}

// TODO: ability to not sac specific types if items, with certain enchants.
export async function sacItems(maxLevel = 5, maxRarity = 2) {
  const altar = dw.entities.find(
    (entity) => entity && entity.md === "enchantingDevice1" && entity.ownerDbId === dw.character.dbId
  );

  if (!altar) {
    console.warn("No altar nearby.");
    return;
  }

  // TODO: move in range of altar?

  dw.character.bag
    .map((b, bIndex) => ({ item: b, bIndex: bIndex }))
    .filter(
      (x) => x.item && x.item.qual <= maxLevel && x.item.r <= maxRarity && !x.item.n && x.item.md !== "monsterMission"
    )
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

export function merge(...itemNames: string[]) {
  const itemsByRarity: Record<string, Record<number, Array<{ bagIndex: number; item: Item }>>> = {};

  for (let index = 0; index < dw.character.bag.length; index++) {
    const item = dw.character.bag[index];

    if (!item) continue;
    if (!item.n) continue;
    if (!itemNames.includes(item.md)) continue;

    if (!itemsByRarity[item.md]) {
      itemsByRarity[item.md] = {};
    }

    if (!itemsByRarity[item.md][item.r]) {
      itemsByRarity[item.md][item.r] = [];
    }

    itemsByRarity[item.md][item.r].push({ bagIndex: index, item: item });
  }

  for (const itemName in itemsByRarity) {
    const rarities = itemsByRarity[itemName];
    for (const rarity in rarities) {
      const items = rarities[rarity];
      if (items.length > 1) {
        const freeCraftingIndexes = dw.c.craftIn
          .map((b, bIndex) => ({ item: b, bIndex: bIndex }))
          .filter((x) => !x.item)
          .map((x) => x.bIndex);

        // TODO more logic for detecting stacksize
        for (const { bagIndex, item } of items) {
          const craftingIndex = freeCraftingIndexes.pop();
          if (craftingIndex) {
            console.log(`move ${item.md} r:${rarity} bag index=${bagIndex}, to crafting slot ${craftingIndex}`);
            dw.moveItem("bag", bagIndex, "craftIn", craftingIndex);
          }
        }

        dw.emit("merge");
        // TODO: sleep?
      }
    }
  }
}
