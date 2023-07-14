/**
 * DRAW STUFF v0.0.2
 */

// TODO: might need to store a reference to what we push into drawings so we can "destroy" them
// TODO: How do we make sure that the drawing exists in between renders?

// const camOffsetX = Math.round(cx * 96 - Math.floor(ctx.canvas.width / 2));
// const camOffsetY = Math.round(cy * 96 - Math.floor(ctx.canvas.width / 2));

// Drawing groups lets you clear the groups in another loop thus gaining control over when it resets
let drawingGroups = {};
// Define the drawings collection
let drawings = [];
// Event handler for the "drawEnd" event
dw.on("drawEnd", (ctx, cx, cy) => {
  // using the client position makes the rendering less jittery
  dw.character.x = cx;
  dw.character.y = cy;

  for (const key in drawingGroups) {
    drawStuff(ctx, drawingGroups[key]);
  }
  drawStuff(ctx, drawings);
  // Clear drawings for next render cycle
  drawings = [];
  // addDrawExamples();
});

function drawStuff(ctx, drawings) {
  // Iterate over the drawings collection
  drawings.forEach((drawing) => {
    // Use utility functions to render the shape based on the drawing type
    if (drawing.type === "circle") {
      const canvasCirclePoint = mapPointToCanvas(ctx.canvas.width, ctx.canvas.height, drawing.point);
      drawCircle(ctx, canvasCirclePoint.x, canvasCirclePoint.y, drawing.radius, drawing.color, drawing.strokeWidth);
    } else if (drawing.type === "rectangle") {
      const canvasRectanglePoint = mapPointToCanvas(ctx.canvas.width, ctx.canvas.height, drawing.point);
      drawRectangle(
        ctx,
        canvasRectanglePoint.x,
        canvasRectanglePoint.y,
        drawing.width,
        drawing.height,
        drawing.color,
        drawing.strokeWidth
      );
    } else if (drawing.type === "line") {
      const canvasStartPoint = mapPointToCanvas(ctx.canvas.width, ctx.canvas.height, drawing.startPoint);
      const canvasEndPoint = mapPointToCanvas(ctx.canvas.width, ctx.canvas.height, drawing.endPoint);
      drawLine(
        ctx,
        canvasStartPoint.x,
        canvasStartPoint.y,
        canvasEndPoint.x,
        canvasEndPoint.y,
        drawing.color,
        drawing.strokeWidth
      );
    } else if (drawing.type === "path") {
      const canvasPoints = drawing.points.map((point) => mapPointToCanvas(ctx.canvas.width, ctx.canvas.height, point));
      drawPath(ctx, canvasPoints, drawing.color, drawing.strokeWidth);
    }
  });
}

function addDrawExamples() {
  // Example usage:
  // Render circle at player
  drawings.push({
    type: "circle",
    point: { x: dw.character.x, y: dw.character.y },
    radius: 5,
    color: "blue",
  });
  // Render rectangle at ai entities, rendering it for all makes the ui lag
  drawings.push(
    ...dw.entities
      .filter((x) => x.ai)
      .slice(0, 10)
      .map((entity) => ({
        type: "rectangle",
        point: { x: entity.x, y: entity.y },
        width: 50,
        height: 50,
        color: "red",
      }))
  );
  // draw a line below character
  drawings.push({
    type: "line",
    startPoint: { x: dw.character.x - 10, y: dw.character.y - 10 },
    endPoint: { x: dw.character.x + 10, y: dw.character.y - 10 },
    color: "green",
  });
  // draw a path somewhere random
  drawings.push({
    type: "path",
    points: [
      { x: dw.character.x, y: dw.character.y },
      { x: dw.character.x + 10, y: dw.character.y + 10 },
      { x: dw.character.x + 20, y: dw.character.y + 20 },
      { x: dw.character.x + 30, y: dw.character.y + 30 },
    ],
    color: "purple",
  });
}

// Function to map a point to the canvas
function mapPointToCanvas(canvasWidth, canvasHeight, point) {
  const canvasX = (point.x - dw.character.x) * 96 /* scaling? */ + canvasWidth / 2;
  const canvasY = (point.y - dw.character.y) * 96 /* scaling? */ + canvasHeight / 2;
  return { x: canvasX, y: canvasY };
}

// https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D

// Utility function to draw a circle on the canvas
function drawCircle(context, x, y, radius, borderColor, borderWidth = 2, fillColor = null, fillAlpha = null) {
  context.beginPath();
  context.arc(x, y, radius * 96 /* scaling is 96 apparently */, 0, 2 * Math.PI);

  if (fillColor) {
    context.globalAlpha = fillAlpha;
    context.fillStyle = fillColor;
    context.fill();
    context.globalAlpha = 1;
  }

  if (borderColor && borderWidth > 0) {
    context.strokeStyle = borderColor;
    context.lineWidth = borderWidth;
    context.stroke();
  }
}

// Utility function to draw a rectangle on the canvas
function drawRectangle(context, x, y, width, height, borderColor, borderWidth = 2, fillColor = null, fillAlpha = null) {
  // make x and y the center of the rectangle
  const adjustedX = x - width / 2;
  const adjustedY = y - height / 2;

  if (fillColor) {
    context.globalAlpha = fillAlpha;
    context.fillStyle = fillColor;
    context.fillRect(adjustedX, adjustedY, width, height);
    context.globalAlpha = 1;
  }

  if (borderColor && borderWidth > 0) {
    context.strokeStyle = borderColor;
    context.lineWidth = borderWidth;
    context.strokeRect(adjustedX, adjustedY, width, height);
  }
}

// Utility function to draw a line between two points on the canvas
function drawLine(context, x1, y1, x2, y2, color, lineWidth = 2, strokeType) {
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);

  context.strokeStyle = color;
  context.lineWidth = lineWidth;
  // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setLineDash
  //   context.setLineDash(strokeType);
  context.stroke();
}

// Utility function to draw a path on the canvas
function drawPath(context, points, color, lineWidth = 2, strokeType) {
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    context.lineTo(points[i].x, points[i].y);
  }

  context.strokeStyle = color;
  context.lineWidth = lineWidth;
  // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setLineDash
  //   context.setLineDash(strokeType);
  context.stroke();
}

function drawText() {
  ctx.font = "18px arial";
  ctx.textAlign = "center";
  const name = `${monster.md} ${monster.level}${"+".repeat(monster.r ?? 0)} ${Number(dist).toFixed(2)}`;
  ctx.strokeText(name, x, y - 8);
  ctx.fillText(name, x, y - 8);
}

function drawProgressBar() {
  ctx.fillStyle = `rgb(0, 0, 0, 0.5)`;

  ctx.beginPath();
  ctx.rect(x - 96 / 2, y, 96, 8);
  ctx.fill();

  ctx.strokeStyle = "black";
  ctx.fillStyle = "red";

  ctx.beginPath();
  ctx.rect(x - 96 / 2, y, (96 * monster.hp) / monster.hpMax, 8);
  ctx.fill();

  ctx.fillStyle = `rgb(255, 255, 255, 0.3)`;

  ctx.beginPath();
  ctx.rect(x - 96 / 2, y, 96, 4);
  ctx.fill();

  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.rect(x - 96 / 2, y, 96, 8);
  ctx.stroke();

  ctx.strokeStyle = "black";
  ctx.fillStyle = "white";

  ctx.lineWidth = 4;

  ctx.font = "18px arial";
  ctx.textAlign = "center";
  const name = `${monster.md} ${monster.level}${"+".repeat(monster.r ?? 0)} ${Number(dist).toFixed(2)}`;
  ctx.strokeText(name, x, y - 8);
  ctx.fillText(name, x, y - 8);

  ctx.lineWidth = 2;
  ctx.font = "12px arial";
  ctx.strokeText(monster.hp, x, y + 8);
  ctx.fillText(monster.hp, x, y + 8);
}
