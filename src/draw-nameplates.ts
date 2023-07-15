import { drawingGroups } from "./draw";

export function drawNameplates() {
  const monsters = dw.entities.filter((e) => e.ai);

  drawingGroups["nameplates"] = [];

  for (let monster of monsters) {
    // let text = ctx.measureText(monster.md);

    // let x = monster.x * 96 - camOffset.x;
    // let y = monster.y * 96 - camOffset.y - 60;

    const x = monster.x;
    const y = monster.y - 0.5; // Offset it above the monster

    const width = 96;
    const height = 8;

    // Render a black background with 0.5 alpha
    drawingGroups["nameplates"].push({
      type: "rectangle",
      point: { x, y },
      width: width,
      height: height,
      color: "rgb(0, 0, 0, 0.5)",
    });

    // ctx.fillStyle = `rgb(0, 0, 0, 0.5)`;
    // ctx.beginPath();
    // ctx.rect(x - 96 / 2, y, 96, 8);
    // ctx.fill();

    // Render red health bar with black stroke
    const healthPercentage = monster.hp / monster.hpMax;
    const healthWidth = width * healthPercentage;
    const healthbarOffsetX = (width - healthWidth) / width / 2;
    drawingGroups["nameplates"].push({
      type: "rectangle",
      // move healthbar to the left
      point: { x: x - healthbarOffsetX, y },
      width: healthWidth,
      height: height,
      color: "black",
      fillColor: "red",
    });

    // ctx.strokeStyle = "black";
    // ctx.fillStyle = "red";
    // ctx.beginPath();
    // ctx.rect(x - 96 / 2, y, (96 * monster.hp) / monster.hpMax, 8);
    // ctx.fill();

    // Unsure what this is, it's a rectangle
    // ctx.fillStyle = `rgb(255, 255, 255, 0.3)`;
    // ctx.beginPath();
    // ctx.rect(x - 96 / 2, y, 96, 4);
    // ctx.fill();

    // Border rectangle
    // ctx.lineWidth = 2;
    // ctx.beginPath();
    // ctx.rect(x - 96 / 2, y, 96, 8);
    // ctx.stroke();

    // ctx.strokeStyle = "black";
    // ctx.fillStyle = "white";

    // ctx.lineWidth = 4;

    // add name, level, skulls and distance
    let dist = dw.distance(dw.c, monster);
    const skulls = monster.r > 0 ? `\n${"💀".repeat(monster.r ?? 0)}` : "";
    let color = "white";
    if (monster.hostile) {
      color = "orange";
    }
    if (monster.targetId === dw.character.id) {
      color = "red";
    }

    drawingGroups["nameplates"].push({
      type: "text",
      point: { x, y: y - 0.3 },
      text: `📏${Number(dist).toFixed(2)}${skulls}\n${monster.md} ${monster.level}`,
      fillStyle: color,
    });

    // Render current health on healthbar
    drawingGroups["nameplates"].push({
      type: "text",
      point: { x, y: y },
      text: `${monster.hp} / ${monster.hpMax}`,
      lineWidth: 2,
      font: "11px arial",
    });
    // ctx.lineWidth = 2;
    // ctx.font = "12px arial";
    // ctx.strokeText(monster.hp, x, y + 8);
    // ctx.fillText(monster.hp, x, y + 8);
  }
}
