// move mission to enchanting device

```json
[
  "moveItem",
  {
    "a": {
      "name": "bag",
      "i": 11
    },
    "b": {
      "name": "storage",
      "i": 0,
      "id": 6541
    }
  }
]
```

// enchant it
// [
// "enchant",
// {
// "id": 6541,
// "md": "addRandMod"
// }
// ]

// [
// "sortInv",
// {}
// ]

// merge items in the crafting bag

```json
["merge", {}]
```

```json
[
  "craft",
  {
    "id": 365,
    "md": "workbench",
    "max": 1
  }
]
```

// ["placeItem", { i: 6, x: 57.06254644358234, y: 69.46362541032049 }];

// ["skill", { md: "fastheal1", i: 2, id: 9814 }];

```ts
function getTerrainUnder(entity) {
  const chunkKey = getChunkKey(entity.l - 1, entity.y - 1, entity.x);
  const localY = worldCoordToLocalCoord(entity.y - 1);
  const localX = worldCoordToLocalCoord(entity.x);
  return dw.chunks[chunkKey][0][localY][localX];
}
```

```js
// const oldSpawn = {
//   l: 0,
//   x: 58.76395570727661,
//   y: 70.55810452118975,
// };

// new spawn
// {
//     "l": 0,
//     "x": 34.791152779344785,
//     "y": 130.06244399528052
// }
```

hitboxes
https://discord.com/channels/1061772817529585775/1061772817529585777/1127705977479761941
width and height respectively
human 0.5625 0.09375
rock 0.4375 0.125
wood 0.40625 0.15625
mailbox 0.25 0.125
box0 0.3125 0.1875
box1x2 0.375 0.3125
box 0.4375 0.28125
box1 0.4375 0.28125
box2 0.4375 0.28125
box3 0.4375 0.28125
box4 0.4375 0.28125
box26 0.625 0.34375
missionBoard 0.71875 0.0625
missionTable 0.5 0.34375
tradingPost 0.5 0.34375
workbench 1.0625 0.34375
gcTable 0.5 0.34375
enchantingDevice1 0.5 0.21875
enchantingDevice2 0.5 0.21875
enchantingDevice3 0.5 0.21875
enchantingDevice4 0.5 0.21875
stoneAnvil 0.4375 0.15625
vessel2 0.1875 0.125
vessel3 0.1875 0.125
vessel4 0.1875 0.125
vessel7 0.1875 0.125
vessel43 0.3125 0.25
boxFinder1 0.5 0.21875
boxFinder2 0.5 0.21875
boxFinder3 0.5 0.21875
boxFinder4 0.5 0.21875
vesselFinder1 0.5 0.21875
vesselFinder2 0.5 0.21875
vesselFinder3 0.5 0.21875
vesselFinder4 0.5 0.21875
furnace 0.5 0.25
vfence1 0.3125 1.125
hfence1 1.71875 0.09375
vMagicFence1 0.3125 1.125
hMagicFence1 1.71875 0.09375

```js
dw.moveItem = (bagFrom, indexFrom, bagTo, indexTo, idFrom, idTo) => {
  const data = {
    a: {
      name: bagFrom,
      i: indexFrom,
    },
    b: {
      i: indexTo,
    },
  };

  if (bagTo) {
    data.b.name = bagTo;
  }

  if (idFrom) {
    data.a.id = idFrom;
  }
  if (idTo) {
    data.b.id = idTo;
  }

  dw.emit("moveItem", data);
};
```

```js
const minTreeLevel = Math.max(1, Math.min(dw.c.professions.woodcutting.level, dw.c.professions.woodworking.level) - 4);
const minStoneLevel = Math.max(1, Math.min(dw.c.professions.stoneworking.level, dw.c.professions.mining.level) - 4);
```
