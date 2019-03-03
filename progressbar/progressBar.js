COREHTML5 = COREHTML5 || {};

COREHTML5.ProgressBar = function (strokeStyle, fillStyle, horizontalSizePercent, verticalSizePercent) {
    this.trough = new COREHTML5.RoundedRectangle(strokeStyle, fillStyle, horizontalSizePercent, verticalSizePercent);

    this.SHADOW_COLOR = 'rgba(100, 100, 100, 0.8)';
    this.SHADOW_OFFSET_X = 3;
    this.SHADOW_OFFSET_Y = 3;
    this.SHADOW_BLUR = 3;

    this.percentComplete = 0;
    this.createCanvas();
    this.createDomElement();

    return this;
}

COREHTML5.ProgressBar.prototype = {
    createCanvas: function () {
        this.context = document.createElement("canvas").getContext('2d');
        this.offScreen = document.createElement("canvas").getContext('2d');
    },
    createDomElement: function () {
        this.domElement = document.createElement('div');
        this.domElement.appendChild(this.context.canvas);
    },
    appendTo: function (element) {
        element.appendChild(this.domElement);
        this.domElement.style.width = element.offsetWidth + 'px'
        this.domElement.style.height = element.offsetHeight + 'px';
        this.resize();
        this.trough.resize(element.offsetWidth, element.offsetHeight);
        this.trough.draw(this.offScreen);
    },
    resize: function () {
        let domElementParent = this.domElement.parentNode, w = domElementParent.offsetWidth, h = domElementParent.offsetHeight;
        this.setCanvasSize;
        this.context.canvas.width = w;
        this.context.canvas.height = h;
        this.offScreen.canvas.width = w;
        this.offScreen.canvas.height = h;
    },
    setCanvasSize: function () {
        let domElementParent = this.domElement.parentNode;
        this.context.canvas.width = domElementParent.offsetWidth;
        this.context.canvas.height = domElementParent.offsetHeight;
    },
    //draw
    draw: function (percentComplete) {
        if (percentComplete > 0) {
            this.context.drawImage(this.offScreen.canvas, 0, 0, this.offScreen.canvas.width * (percentComplete / 100), this.offScreen.canvas.height, 0, 0, this.offScreen.canvas.width * (percentComplete / 100), this.offScreen.canvas.height);
        }
    },

    erase: function () {
        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
    }
}