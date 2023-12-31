/**
 * DRAW STUFF v0.0.1 by thmsn
 */

// Define the drawings collection
let drawings = [];

// Event handler for the "drawEnd" event
dw.on("drawEnd", (ctx) => {
  // Iterate over the drawings collection
  drawings.forEach((drawing) => {
    // Use utility functions to render the shape based on the drawing type
    if (drawing.type === "circle") {
      const canvasCirclePoint = mapPointToCanvas(
        ctx.canvas.width,
        ctx.canvas.height,
        drawing.point
      );

      drawCircle(
        ctx,
        canvasCirclePoint.x,
        canvasCirclePoint.y,
        drawing.radius,
        drawing.color
      );
    } else if (drawing.type === "rectangle") {
      const canvasRectanglePoint = mapPointToCanvas(
        ctx.canvas.width,
        ctx.canvas.height,
        drawing.point
      );
      drawRectangle(
        ctx,
        canvasRectanglePoint.x,
        canvasRectanglePoint.y,
        drawing.width,
        drawing.height,
        drawing.color
      );
    } else if (drawing.type === "line") {
      const canvasStartPoint = mapPointToCanvas(
        ctx.canvas.width,
        ctx.canvas.height,
        drawing.startPoint
      );
      const canvasEndPoint = mapPointToCanvas(
        ctx.canvas.width,
        ctx.canvas.height,
        drawing.endPoint
      );
      drawLine(
        ctx,
        canvasStartPoint.x,
        canvasStartPoint.y,
        canvasEndPoint.x,
        canvasEndPoint.y,
        drawing.color
      );
    } else if (drawing.type === "path") {
      const canvasPoints = drawing.points.map((point) =>
        mapPointToCanvas(ctx.canvas.width, ctx.canvas.height, point)
      );
      drawPath(ctx, canvasPoints, drawing.color);
    }
  });

  // Clear drawings for next render cycle
  drawings = [];

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
});

// Function to map a point to the canvas
function mapPointToCanvas(canvasWidth, canvasHeight, point) {
  const canvasX =
    (point.x - dw.character.x) * 96 /* scaling? */ + canvasWidth / 2;
  const canvasY =
    (point.y - dw.character.y) * 96 /* scaling? */ + canvasHeight / 2;
  return { x: canvasX, y: canvasY };
}

// https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D

// Utility function to draw a circle on the canvas
function drawCircle(
  context,
  x,
  y,
  radius,
  borderColor,
  borderWidth = 2,
  fillColor = null,
  fillAlpha = null
) {
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
function drawRectangle(
  context,
  x,
  y,
  width,
  height,
  borderColor,
  borderWidth = 2,
  fillColor = null,
  fillAlpha = null
) {
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
