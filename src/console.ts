import { Item } from "./deepestworld";
import { calculateItemScore, sacItems } from "./disenchant";
import { sleep } from "./utility";

declare global {
  interface Window {
    goHome: () => void;
    setSpawn: () => void;
    sacItems: () => void;
    merge: () => void;
    scoreBag: () => void;
  }
}

export function registerConsoleCommands() {
  // Add to console as our character runs in an iframe
  top!.goHome = goHome;
  top!.setSpawn = setSpawn;
  top!.sacItems = sacItems;
  top!.merge = merge;

  top!.scoreBag = () => {
    const bagScores = dw.character.bag
      .map((bagItem, bIndex) => {
        // TODO: certain things gives an item a higher score, if we score the item too low, we sacrifice it
        const score = bagItem ? calculateItemScore(bagItem) : 0;

        return { item: bagItem, bIndex: bIndex, score };
      })
      .filter((x) => x.item)
      .sort((a, b) => a.score - b.score);
    console.log("bagScores", bagScores);
  };
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
