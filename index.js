let canvas = document.getElementById("canvas"),
    context = canvas.getContext("2d"),
    eraseAllButton = document.getElementById("eraseAllButton"),
    strokeStyleSelect = document.getElementById("strokeStyleSelect"),
    fillStyleSelect = document.getElementById("fillStyleSelect"),
    lineWidthSelect = document.getElementById("lineWidthSelect"),
    startAngleSelect = document.getElementById("startAngleSelect"),
    sidesSelect = document.getElementById("sidesSelect"),
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
        for (let i = 1; i < this.sides; ++i) {
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
        for (let i = 0; i < sides; ++i) {
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
    context.strokeStyle = color;
    context.lineWidth = 0.5;
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
}

drawGrid('lightgray', 10, 10);

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

function drawRubberBandShape(loc) {
    let angle,radius;
    if(mousedown.y === loc.y){
        return radius = Math.abs(loc.x - mousedown.x);
    } else {
        angle = Math.atan(rubberBandRect.height / rubberBandRect.width);
        radius = rubberBandRect.height / Math.sin(angle);
    }
    context.beginPath();
    context.arc(mousedown.x, mousedown.y, radius, 0, Math.PI * 2, false);
    context.stroke();

    if(fillCheckBox.checked) context.fill();
}

function drawRubberBandPolygonShape(loc, sides, startAngle) {
    let polygon = new Polygon(mousedown.x, mousedown.y, rubberBandRect.width, parseInt(sidesSelect.value), (Math.PI / 180) * parseInt(startAngleSelect.value), context.strokeStyle, context.fillStyle, fillCheckBox.checked);
    drawPolygon(polygon);
    if (!dragging) {
        polygons.push(polygon);
    }
}

function updateRubberBand(loc) {
    updateRubberBandRectangle(loc);
    drawRubberBandShape(loc);
}

function drawPolygon(polygon) {
    context.beginPath();
    polygon.createPath(context);
    polygon.stroke(context);

    if (fillCheckBox.checked) {
        polygon.fill(context);
    }
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

function startDragging(loc) {
    saveDrawingSurface();
    mousedown.x = loc.x;
    mousedown.y = loc.y;
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
                draggingOffsetX = loc.x - polygon.x;
                draggingOffsetY = loc.y - polygon.y;
                return;
            }
        })
    } else {
        startDragging(loc);
        dragging = true;
    }
}
canvas.onmousemove = function (e) {
    let loc;
    if (dragging) {
        e.preventDefault();
        loc = windowToCanvas(e.clientX, e.clientY);
        restoreDrawingSurface();
        updateRubberBand(loc);
        if (guideWires) {
            drawGuideWires(loc.x, loc.y);
        }
    }
}
canvas.onmouseup = function (e) {
    loc = windowToCanvas(e.clientX, e.clientY);
    dragging = false;
    if (editing) { } else {
        restoreDrawingSurface();
        updateRubberBand(loc);
    }
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
