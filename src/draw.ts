/**
 * DRAW STUFF v0.0.2
 */
export interface Point {
  x: number;
  y: number;
}

type Drawing = Circle | Rectangle | Line | Path | Text;

export interface Circle {
  type: "circle";
  point: Point;
  radius: number;
  color?: string;
  strokeWidth?: number;
  fillColor?: string;
  fillAlpha?: number;
}

export interface Rectangle {
  type: "rectangle";
  point: Point;
  width: number;
  height: number;
  color?: string; // TODO: rename to strokeColor or whatever the name is
  strokeWidth?: number;
  fillColor?: string;
  fillAlpha?: number;
}

export interface Line {
  type: "line";
  startPoint: Point;
  endPoint: Point;
  color: string;
  strokeWidth?: number;
}

export interface Path {
  type: "path";
  points: Point[];
  color: string;
  strokeWidth?: number;
}

export interface Text {
  type: "text";
  point: Point;
  text: string;
  font?: string;
  textAlign?: CanvasTextAlign;
  strokeStyle?: string;
  fillStyle?: string;
  lineWidth?: number;
}

// TODO: might need to store a reference to what we push into drawings so we can "destroy" them
// TODO: How do we make sure that the drawing exists in between renders?
export const MAP_SCALE = 96;
// Drawing groups lets you clear the groups in another loop thus gaining control over when it resets
export const drawingGroups: { [key: string]: Drawing[] } = {};
// Define the drawings collection
// let drawings: Drawing[] = [];
export function onDrawEnd() {
  // Event handler for the "drawEnd" event
  dw.on("drawEnd", (ctx, cx, cy) => {
    // // using the client position makes the rendering less jittery
    // dw.character.x = cx;
    // dw.character.y = cy;

    // const camOffsetX = Math.round(cx * MAP_SCALE - Math.floor(ctx.canvas.width / 2));
    // const camOffsetY = Math.round(cy * MAP_SCALE - Math.floor(ctx.canvas.height / 2));
    const camOffset = {
      x: Math.round(cx * MAP_SCALE - Math.floor(ctx.canvas.width / 2)),
      y: Math.round(cy * MAP_SCALE - Math.floor(ctx.canvas.height / 2)),
    };

    const sortedGroups = Object.entries(drawingGroups).sort(([aKey, aValue], [bKey, bValue]) =>
      aKey.localeCompare(bKey)
    );

    for (const [key, drawings] of sortedGroups) {
      drawStuff(ctx, camOffset, drawings);
    }

    // drawStuff(ctx, camOffset, drawings);
    // Clear drawings for next render cycle
    // drawings = [];
    // addDrawExamples();
  });
}
function drawStuff(ctx: CanvasRenderingContext2D, camOffset: Point, drawings: Drawing[]) {
  // Iterate over the drawings collection
  drawings.forEach((drawing) => {
    // Use utility functions to render the shape based on the drawing type
    switch (drawing.type) {
      case "circle":
        const canvasCirclePoint = mapPointToCamera(camOffset, drawing.point);
        drawCircle(
          ctx,
          canvasCirclePoint.x,
          canvasCirclePoint.y,
          drawing.radius,
          drawing.color,
          drawing.strokeWidth,
          drawing.fillColor,
          drawing.fillAlpha
        );
        break;
      case "rectangle":
        const canvasRectanglePoint = mapPointToCamera(camOffset, drawing.point);
        drawRectangle(
          ctx,
          canvasRectanglePoint.x,
          canvasRectanglePoint.y,
          drawing.width,
          drawing.height,
          drawing.color,
          drawing.strokeWidth,
          drawing.fillColor,
          drawing.fillAlpha
        );
        break;
      case "line":
        const canvasStartPoint = mapPointToCamera(camOffset, drawing.startPoint);
        const canvasEndPoint = mapPointToCamera(camOffset, drawing.endPoint);
        drawLine(
          ctx,
          canvasStartPoint.x,
          canvasStartPoint.y,
          canvasEndPoint.x,
          canvasEndPoint.y,
          drawing.color,
          drawing.strokeWidth
        );
        break;
      case "path":
        const canvasPoints = drawing.points.map((point) => mapPointToCamera(camOffset, point));
        drawPath(ctx, canvasPoints, drawing.color, drawing.strokeWidth);
        break;
      case "text":
        const canvasPoint = mapPointToCamera(camOffset, drawing.point);
        drawText(
          ctx,
          canvasPoint.x,
          canvasPoint.y,
          drawing.text,
          drawing.strokeStyle,
          drawing.fillStyle,
          drawing.lineWidth,
          drawing.textAlign,
          drawing.font
        );
        break;

      default:
        // https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking
        const _exhaustiveCheck: never = drawing;
        return _exhaustiveCheck;
    }
  });
}

// Function to map a point to the canvas
function mapPointToCamera(camOffset: Point, point: Point) {
  // const canvasX = (point.x - dw.character.x) * MAP_SCALE /* scaling? */ + canvasWidth / 2;
  // const canvasY = (point.y - dw.character.y) * MAP_SCALE /* scaling? */ + canvasHeight / 2;
  return { x: point.x * MAP_SCALE - camOffset.x, y: point.y * MAP_SCALE - camOffset.y };
}

// https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D

// Utility function to draw a circle on the canvas
function drawCircle(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  borderColor?: string,
  borderWidth = 2,
  fillColor?: string,
  fillAlpha?: number
) {
  context.beginPath();
  context.arc(x, y, radius * MAP_SCALE /* scaling is 96 apparently */, 0, 2 * Math.PI);

  if (fillColor) {
    context.globalAlpha = fillAlpha ?? 1;
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
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  borderColor?: string,
  borderWidth = 2,
  fillColor?: string,
  fillAlpha?: number
) {
  // make x and y the center of the rectangle
  const adjustedX = x - width / 2;
  const adjustedY = y - height / 2;

  if (fillColor) {
    context.globalAlpha = fillAlpha ?? 1;
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
function drawLine(
  context: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  lineWidth = 2
) {
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
function drawPath(context: CanvasRenderingContext2D, points: Point[], color: string, lineWidth = 2) {
  if (points.length === 0) return;
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

function drawText(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  strokeStyle: string = "black",
  fillStyle: string = "white",
  lineWidth: number = 4,
  textAlign: CanvasTextAlign = "center",
  font = "18px arial"
) {
  context.strokeStyle = strokeStyle;
  context.fillStyle = fillStyle;
  context.lineWidth = lineWidth;

  context.font = font;
  context.textAlign = textAlign;

  var lineHeight = context.measureText("M").width * 1.2;
  const lines = text.split("\n");
  // offset lines upwards compared to original positions.
  y -= lineHeight * (lines.length - 1);
  for (var i = 0; i < lines.length; ++i) {
    context.strokeText(lines[i], x, y);
    context.fillText(lines[i], x, y);
    y += lineHeight;
  }

  // context.strokeText(text, x, y);
  // context.fillText(text, x, y);
}

// function drawProgressBar() {
//   ctx.fillStyle = `rgb(0, 0, 0, 0.5)`;

//   ctx.beginPath();
//   ctx.rect(x - 96 / 2, y, 96, 8);
//   ctx.fill();

//   ctx.strokeStyle = "black";
//   ctx.fillStyle = "red";

//   ctx.beginPath();
//   ctx.rect(x - 96 / 2, y, (96 * monster.hp) / monster.hpMax, 8);
//   ctx.fill();

//   ctx.fillStyle = `rgb(255, 255, 255, 0.3)`;

//   ctx.beginPath();
//   ctx.rect(x - 96 / 2, y, 96, 4);
//   ctx.fill();

//   ctx.lineWidth = 2;

//   ctx.beginPath();
//   ctx.rect(x - 96 / 2, y, 96, 8);
//   ctx.stroke();

//   ctx.strokeStyle = "black";
//   ctx.fillStyle = "white";

//   ctx.lineWidth = 4;

//   ctx.font = "18px arial";
//   ctx.textAlign = "center";
//   const name = `${monster.md} ${monster.level}${"+".repeat(monster.r ?? 0)} ${Number(dist).toFixed(2)}`;
//   ctx.strokeText(name, x, y - 8);
//   ctx.fillText(name, x, y - 8);

//   ctx.lineWidth = 2;
//   ctx.font = "12px arial";
//   ctx.strokeText(monster.hp, x, y + 8);
//   ctx.fillText(monster.hp, x, y + 8);
// }
