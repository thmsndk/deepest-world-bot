
  
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
//   "enchant",
//   {
//     "id": 6541,
//     "md": "addRandMod"
//   }
// ]

// [
//   "sortInv",
//   {}
// ]

// merge items in the crafting bag
```json
[
  "merge",
  {}
]
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
    const chunkKey = getChunkKey(entity.l-1, entity.y-1, entity.x);
    const localY = worldCoordToLocalCoord(entity.y-1);
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