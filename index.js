let canvas = document.getElementById("canvas"),
    context = canvas.getContext("2d"),
    eraseAllButton = document.getElementById("eraseAllButton"),
    strokeStyleSelect = document.getElementById("strokeStyleSelect"),
    fillStyleSelect = document.getElementById("fillStyleSelect"),
    lineWidthSelect = document.getElementById("lineWidthSelect"),
    guideWireCheckBox = document.getElementById("guideWireCheckBox"),
    fillCheckBox = document.getElementById("fillCheckBox"),
    drawingSurfaceImageData = null,
    mousedown = {},
    rubberBandRect = {},
    dragging = false,
    guideWires = guideWireCheckBox.checked;

context.strokeStyle = strokeStyleSelect.value;
context.fillStyle = fillStyleSelect.value;
context.lineWidth = lineWidthSelect.value;

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
    console.log(loc.x, mousedown.x);
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

function updateRubberBand(loc) {
    updateRubberBandRectangle(loc);
    drawRubberBandShape(loc);
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
canvas.onmousedown = function (e) {
    let loc = windowToCanvas(e.clientX, e.clientY);
    e.preventDefault();
    saveDrawingSurface();
    mousedown.x = loc.x;
    mousedown.y = loc.y;
    dragging = true;
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
    restoreDrawingSurface();
    updateRubberBand(loc);
    dragging = false;
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
