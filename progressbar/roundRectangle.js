let COREHTML5 = {};

COREHTML5.RoundedRectangle = function (strokeStyle, fillStyle, horizontalSizePercent, verticalSizePercent) {
    this.strokeStyle = strokeStyle ? strokeStyle : 'gray';
    this.fillStyle = fillStyle ? fillStyle : 'skyblue';

    horizontalSizePercent = horizontalSizePercent || 100;
    verticalSizePercent = verticalSizePercent || 100;

    this.SHADOW_COLOR = 'rgba(100, 100, 100, 0.8)';
    this.SHADOW_OFFSET_X = 3;
    this.SHADOW_OFFSET_Y = 3;
    this.SHADOW_BLUR = 3;

    this.setSizePercents(horizontalSizePercent, verticalSizePercent);
    this.createCanvas();
    this.createDomElement();

    return this;
}

COREHTML5.RoundedRectangle.prototype = {
    createCanvas: function () {
        let canvas = document.createElement("canvas");
        this.context = canvas.getContext('2d');
        return canvas
    },
    createDomElement: function () {
        this.domElement = document.createElement('div');
        this.domElement.appendChild(this.context.canvas);
    },
    appendTo: function (element) {
        element.appendChild(this.domElement);
        this.domElement.style.width = element.offsetWidth + 'px'
        this.domElement.style.height = element.offsetHeight + 'px';
        this.resize(element.offsetWidth, element.offsetHeight);
    },
    resize: function (width, height) {
        this.HORIZONTAL_MARGIN = (width - width * this.horizontalSizePercent) / 2;
        this.VERTICAL_MARGIN = (height - height * this.verticalSizePercent) / 2;
        this.cornerRadius = (this.context.canvas.height / 2 - 2 * this.VERTICAL_MARGIN) / 2;

        this.top = this.VERTICAL_MARGIN;
        this.left = this.HORIZONTAL_MARGIN;
        this.right = this.left + width - 2 * this.HORIZONTAL_MARGIN;
        this.bottom = this.top + height - 2 * this.VERTICAL_MARGIN;

        this.context.canvas.width = width;
        this.context.canvas.height = height;
    },
    setSizePercents: function (h, v) {
        this.horizontalSizePercent = h > 1 ? h / 100 : h;
        this.verticalSizePercent = v > 1 ? v / 100 : v;
    },
    //draw
    fill: function () {
        let radius = (this.bottom - this.top) / 2, ctx = this.context;
        ctx.save();
        ctx.shadowColor = this.SHADOW_COLOR;
        ctx.shadowOffsetX = this.SHADOW_OFFSET_X;
        ctx.shadowOffsetY = this.SHADOW_OFFSET_Y;
        ctx.shadowColorBlur = 6;
        ctx.beginPath();
        ctx.moveTo(this.left + radius, this.top);
        ctx.arcTo(this.right, this.top, this.right, this.bottom, radius);
        ctx.arcTo(this.right, this.bottom, this.left, this.bottom, radius);
        ctx.arcTo(this.left, this.bottom, this.left, this.top, radius);
        ctx.arcTo(this.left, this.top, this.right, this.top, radius);
        ctx.closePath();
        ctx.fillStyle = this.fillStyle;
        ctx.fill();
        ctx.shadowColor = undefined;
    },
    overlayGradient: function () {
        let gradient = this.context.createLinearGradient(this.left, this.top, this.left, this.bottom);
        gradient.addColorStop(0, 'rgba(255, 255,255, 0.4)');
        gradient.addColorStop(0.2, 'rgba(255, 255,255, 0.6)')
        gradient.addColorStop(0.25, 'rgba(255, 255,255, 0.7)')
        gradient.addColorStop(0.3, 'rgba(255, 255,255, 0.9)')
        gradient.addColorStop(0.40, 'rgba(255, 255,255, 0.7)')
        gradient.addColorStop(0.45, 'rgba(255, 255,255, 0.6)')
        gradient.addColorStop(0.60, 'rgba(255, 255,255, 0.4)')
        gradient.addColorStop(1, 'rgba(255, 255,255, 0.1)')

        this.context.fillStyle = gradient;
        this.context.fill();
        this.context.lineWidth = 0.4;
        this.context.strokeStyle = this.strokeStyle;
        this.context.stroke();
        this.context.restore();
    },
    draw: function (context) {
        let org_context;
        if (context) {
            org_context = this.context;
            this.context = context;
        }

        this.fill();
        this.overlayGradient();

        if (context) {
            this.context = org_context;
        }
    },

    erase: function () {
        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
    }
}