
// box searcg
// https://discord.com/channels/1061772817529585775/1061772817529585777/1117638862475370607
function boxSearch() {
    let indexBag = 0;
    while (indexBag < dw.c.bag.length && dw.c.bag[indexBag]) {
      ++indexBag;
    }
    const GEMS = ["amethyst", "ruby", "sapphire", "diamond", "emerald"];
    const capitalize = (str: string) =>
      str.charAt(0).toUpperCase() + str.slice(1);
    const RINGS = GEMS.map((gem) => `t1${capitalize(gem)}Ring`);
    const AMULETS = GEMS.map((gem) => `t1${capitalize(gem)}Amulet`);
    for (let box of dw.entities.filter(
      (e) => e.md === "box" && Math.hypot(e.x - dw.c.x, e.y - dw.c.y) < 2.0
    )) {
      if (indexBag >= dw.c.bag.length) break;
      for (let indexStorage in box.storage) {
        const item = box.storage[indexStorage];
        if (!item) continue;
        if (![...RINGS, ...AMULETS].includes(item.md)) continue;
        console.log(
          `move ${item.md} from box (id=${box.id}, index=${indexStorage}), to inventory slot ${indexBag}`
        );
        dw.moveItem("storage", parseInt(indexStorage), "bag", indexBag, box.id);
        ++indexBag;
        while (indexBag < dw.c.bag.length && dw.c.bag[indexBag]) {
          ++indexBag;
        }
        if (indexBag >= dw.c.bag.length) break;
      }
    }
  }