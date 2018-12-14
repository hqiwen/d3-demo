let canvas = document.getElementById("canvas"),
    context = canvas.getContext("2d"),
    eraseAllButton = document.getElementById("eraseAllButton"),
    strokeStyleSelect = document.getElementById("strokeStyleSelect"),
    fillStyleSelect = document.getElementById("fillStyleSelect"),
    lineWidthSelect = document.getElementById("lineWidthSelect"),
    startAngleSelect = document.getElementById("startAngleSelect"),
    sidesSelect = document.getElementById("sidesSelect"),
    eraserShapeSelect = document.getElementById("eraserShapeSelect"),
    eraserWidthSelect = document.getElementById("eraserWidthSelect"),
    drawRadio = document.getElementById("drawRadio"),
    eraserRadio = document.getElementById("eraserRadio"),
    guideWireCheckBox = document.getElementById("guideWireCheckBox"),
    fillCheckBox = document.getElementById("fillCheckBox"),
    editCheckBox = document.getElementById("editCheckBox"),
    drawingSurfaceImageData = null,
    mousedown = {},
    rubberBandRect = {},
    dragging = false,
    editing = false,
    guideWires = true,
    sides = 8,
    startAngle = 0,
    polygons = [],
    ERASER_LINE_WIDTH = 1,
    ERASER_SHADOW_COLOR = "rgb(0, 0, 0)",
    ERASER_SHADOW_STYLE = "blue",
    ERASER_STROKE_STYLE = 'rgb(0,0,225)',
    ERASER_SHADOW_OFFSET = -5,
    ERASER_SHADOW_BLUR = 20,
    GRID_HORIZONTAL_SPACING = 10,
    GRID_VERTICAL_SPACING = 10,
    GRID_LINE_COLOR = 'lightblue',
    draggingOffsetX = null,
    draggingOffsetY = null;

context.strokeStyle = strokeStyleSelect.value;
context.fillStyle = fillStyleSelect.value;
context.lineWidth = lineWidthSelect.value;

const Point = function (x, y) {
    this.x = x;
    this.y = y;
}
const Polygon = function (centerX, centerY, radius, sides, startAngle, strokeStyle, fillStyle, filled) {
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = radius;
    this.sides = sides;
    this.startAngle = startAngle;
    this.strokeStyle = strokeStyle;
    this.fillStyle = fillStyle;
    this.filled = filled;
}
Polygon.prototype = {
    getPoints: function() {
        let points = [],
            angle = this.startAngle || 0;
        for (let i = 0; i < this.sides; ++i) {
            points.push(
                new Point(
                    this.centerX + this.radius * Math.sin(angle),
                    this.centerY + this.radius * Math.cos(angle)
                )
            );
            angle += (2 * Math.PI) / this.sides;
        }
        return points;
    },
    createPath: function(context) {
        let points = this.getPoints();
        context.beginPath();
        context.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < this.sides; ++i) {
            context.lineTo(points[i].x, points[i].y);
        }
        context.closePath();
    },
    stroke: function (context) {
        context.save();
        this.createPath(context);
        context.strokeStyle = this.strokeStyle;
        context.stroke();
        context.restore();
    },
    fill: function (context) {
        context.save();
        this.createPath(context);
        context.fillStyle = this.fillStyle;
        context.fill();
        context.restore();
    },
    move: function (x, y) {
        this.centerX = x;
        this.centerY = y;
    }
};
function drawGrid(color, stepx, stepy) {
    context.save()
    context.strokeStyle = color;
    context.fillStyle = '#ffffff';
    context.lineWidth = 0.5;
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    for (let i = stepx + 0.5; i < context.canvas.width; i += stepx) {
        context.beginPath();
        context.moveTo(i, 0);
        context.lineTo(i, context.canvas.height);
        context.stroke();
    };
    for (let i = stepy + 0.5; i < context.canvas.height; i += stepy) {
        context.beginPath();
        context.moveTo(0, i);
        context.lineTo(context.canvas.width, i);
        context.stroke();
    }
    context.restore();
}

drawGrid(GRID_LINE_COLOR, GRID_HORIZONTAL_SPACING, GRID_VERTICAL_SPACING);

function windowToCanvas(x, y) {
    let bbox = canvas.getBoundingClientRect();
    return {
        x: x - bbox.left * (canvas.width / bbox.width),
        y: y - bbox.top * (canvas.height / bbox.height)
    }
}

function saveDrawingSurface() {
    drawingSurfaceImageData = context.getImageData(0, 0, canvas.width, canvas.height);
}
function restoreDrawingSurface() {
    context.putImageData(drawingSurfaceImageData, 0, 0);
}

function updateRubberBandRectangle(loc) {
    rubberBandRect.width = Math.abs(loc.x - mousedown.x);
    rubberBandRect.height = Math.abs(loc.y - mousedown.y);
    if (loc.x > mousedown.x) rubberBandRect.left = mousedown.x;
    else rubberBandRect.left = loc.x;
    if (loc.y > mousedown.y) rubberBandRect.top = mousedown.y;
    else rubberBandRect.left = loc.y;
}

function drawRubberBandPolygonShape(loc, sides, startAngle) {
    let polygon = new Polygon(mousedown.x, mousedown.y, rubberBandRect.width, parseInt(sides), (Math.PI / 180) * parseInt(startAngle), context.strokeStyle, context.fillStyle, fillCheckBox.checked);
    drawPolygon(polygon);
    if (!dragging) {
        polygons.push(polygon);
    }
}

function drawRubberBandShape(loc) {
    let angle = Math.atan(rubberBandRect.height / rubberBandRect.width), radius = rubberBandRect.height / Math.sin(angle);
    if (mousedown.y === loc.y) {
        radius = Math.abs(loc.x - mousedown.x);
    }
    context.beginPath();
    context.arc(mousedown.x, mousedown.y, radius, 0, Math.PI *2, false);
    context.stroke();
    context.fill();
}

function updateRubberBand(loc) {
    updateRubberBandRectangle(loc);
    drawRubberBandShape(loc);
}

function drawPolygon(polygon, angle) {
    let tx = polygon.centerX,ty = polygon.centerY;
    context.save();
    context.translate(tx, ty);
    if (angle) {
        context.rotate(angle);
    }
    polygon.centerX = 0;
    polygon.centerY = 0;
    context.beginPath();
    polygon.createPath(context);
    polygon.stroke(context);

    if (fillCheckBox.checked) {
        polygon.fill(context);
    }
    context.restore();
    polygon.centerX = tx;
    polygon.centerY = ty;
}
function drawPolygons() {
    polygons.forEach(function (polygon) {
        drawPolygon(polygon);
    })
}

function drawHorizontalLine(y) {
    context.beginPath();
    context.moveTo(0, y + 0.5);
    context.lineTo(context.canvas.width, y + 0.5);
    context.stroke();
}
function drawVerticalLine(x) {
    context.beginPath();
    context.moveTo(x+0.5, 0);
    context.lineTo(x+0.5, context.canvas.height);
    context.stroke();
}
function drawGuideWires(x, y) {
    context.save();
    context.strokeStyle='rgba(0, 0, 230, 0.4)';
    context.lineWidth=0.5;
    drawHorizontalLine(y);
    drawVerticalLine(x);
    context.restore();
}

function setDrawPathForEraser(loc) {
    let eraserWidth = parseFloat(eraserWidthSelect.value);

    context.beginPath();

    if (eraserShapeSelect.value === 'circle') {
        context.arc(loc.x, loc.y,
            eraserWidth / 2,
            0, Math.PI * 2, false);
    }
    else {
        context.rect(loc.x - eraserWidth / 2,
            loc.y - eraserWidth / 2,
            eraserWidth, eraserWidth);
    }
    context.clip();
}

function setErasePathForEraser() {
    var eraserWidth = parseFloat(eraserWidthSelect.value);

    context.beginPath();

    if (eraserShapeSelect.value === 'circle') {
        context.arc(lastX, lastY,
            eraserWidth / 2 + ERASER_LINE_WIDTH,
            0, Math.PI * 2, false);
    }
    else {
        context.rect(lastX - eraserWidth / 2 - ERASER_LINE_WIDTH,
            lastY - eraserWidth / 2 - ERASER_LINE_WIDTH,
            eraserWidth + ERASER_LINE_WIDTH * 2,
            eraserWidth + ERASER_LINE_WIDTH * 2);
    }
    context.clip();
}
function setEraserAttributes() {
    context.lineWidth = ERASER_LINE_WIDTH;
    context.shadowColor = ERASER_SHADOW_STYLE;
    context.shadowOffsetX = ERASER_SHADOW_OFFSET;
    context.shadowOffsetY = ERASER_SHADOW_OFFSET;
    context.shadowBlur = ERASER_SHADOW_BLUR;
    context.strokeStyle = ERASER_STROKE_STYLE;
}
function eraseLast() {
    context.save();
    setErasePathForEraser();
    drawGrid(GRID_LINE_COLOR, GRID_HORIZONTAL_SPACING, GRID_VERTICAL_SPACING);
    context.restore();
}
function drawEraser(loc) {
    context.save();
    setEraserAttributes();
    setDrawPathForEraser(loc);
    context.stroke();
    context.restore();
}
function startDragging(loc) {
    if (drawRadio.checked) {
        saveDrawingSurface();
    }
    mousedown.x = loc.x;
    mousedown.y = loc.y;

    lastX = loc.x;
    lastY = loc.y;
}
function startEditing() {
    canvas.style.cursor = 'pointer';
    editing = true;
}
function stopEditing() {
    canvas.style.cursor = 'crosshair';
    editing = false;
}
canvas.onmousedown = function (e) {
    let loc = windowToCanvas(e.clientX, e.clientY);
    e.preventDefault();
    if (editing) {
        polygons.forEach(function (polygon) {
            polygon.createPath(context);
            if (context.isPointInPath(loc.x, loc.y)) {
                startDragging(loc);
                dragging = polygon;
                draggingOffsetX = loc.x - polygon.centerX;
                draggingOffsetY = loc.y - polygon.centerY;
                return;
            }
        })
    } else {
        startDragging(loc);
        dragging = true;
        console.log("mousedown", drawRadio.checked);
    }
}
canvas.onmousemove = function (e) {
    let loc = windowToCanvas(e.clientX, e.clientY);
    e.preventDefault();
    if (dragging && editing) {
        dragging.centerX = loc.x - draggingOffsetX;
        dragging.centerY = loc.y - draggingOffsetY;
        context.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid('lightgray', 10, 10);
        drawPolygons();
    } else {
        if (dragging) {
            if (drawRadio.checked) {
                restoreDrawingSurface();
                updateRubberBand(loc);
                if (guideWires) {
                    drawGuideWires(mousedown.x, mousedown.y);
                }
            } else {
                eraseLast();
                drawEraser(loc);
            }
            lastX = loc.x;
            lastY = loc.y;
            console.log("mousemove", lastX, lastY);
        }
    }
}
canvas.onmouseup = function (e) {
    let loc = windowToCanvas(e.clientX, e.clientY);
 
    if (editing) {

    } else {
        if (drawRadio.checked) {
            restoreDrawingSurface();
            updateRubberBand(loc);
        }
        if (eraserRadio.checked) {
            eraseLast();
        }
    }
    dragging = false;
    console.log("mouseup");
}
eraseAllButton.onclick = function (e) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid('lightgray', 10, 10);
    saveDrawingSurface();
}
strokeStyleSelect.onchange = function (e) {
    context.strokeStyle = strokeStyleSelect.value;
}
fillStyleSelect.onchange = function(e) {
    context.fillStyle = fillStyleSelect.value;
};
lineWidthSelect.onchange = function(e) {
    context.lineWidth = lineWidthSelect.value;
};
startAngleSelect.onchange = function(e) {
    startAngle = startAngleSelect.value;
};
sidesSelect.onchange = function(e) {
    sides = sidesSelect.value;
};
guideWireCheckBox.onchange = function (e) {
    guideWires = guideWireCheckBox.checked;
}
editCheckBox.onchange = function(e) {
    if (editCheckBox.checked) {
        startEditing();
    } else {
        stopEditing();
    }
};
