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
    getPoints: function () {
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
    createPath: function (context) {
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