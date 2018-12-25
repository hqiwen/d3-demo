const Vector = function (x, y) {
    this.x = x;
    this.y = y;
}
Vector.prototype = {
    getMagnitude: function () {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    },
    add: function (vector) {
        let v = new Vector();
        v.x = this.x + vector.x;
        v.y = this.y + vector.y;
        return v;
    },
    subtract: function (vector) {
        let v = new Vector();
        v.x = this.x - vector.x;
        v.y = this.y - vector.y;
        return v;
    },
    //点集为投影
    dotProduct: function (vector) {
        return this.x * vector.x + this.y * vector.y;
    },
    edge: function (vector) {
        return this.subtract(vector);
    },
    perpendicular: function () {
        let v = new Vector();
        v.x = this.y;
        v.y = 0 - this.x;
        return v;
    },
    normalize: function () {
        let v = new Vector(0, 0),
            m = this.getMagnitude();
        if (m != 0) {
            v.x = this.x / m;
            v.y = this.y / m;
        }
        return v;
    },
    normal: function () {
        let p = this.perpendicular();
        return p.normalize();
    }
}

const Projection = function (min, max) {
    this.min = min;
    this.max = max;
}
Projection.prototype = {
    overlaps: function (projection) {
        return this.max > projection.min && projection.max > this.min;
    }
}

const Shape = function () {
    this.x = undefined;
    this.y = undefined;
    this.strokeStyle = 'rgba(255,253,208,0.9)';
    this.fillStyle = 'rgba(147, 197, 114, 0.8)';
}
Shape.prototype = {
    collidesWith: function (shape) {
        let axes = this.getAxes().concat(shape.getAxes());
        return !this.separationOnAxes(axes, shape);
    },
    separationOnAxes: function (axes, shape) {
        for (let i = 0; i < axes.length; ++i) {
            axis = axes[i];
            projection1 = shape.projection(axis);
            projection2 = this.projection(axis);
            if (!projection1.overlaps(projection2)) {
                return true;
            }
            return false;
        }
    },
    getAxes: function () {
        throw 'getAxes not implemented'
    },
    createPath: function (context) {
        throw "createPath not implemented";
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
    isPointInPath: function (ctx, x, y) {
        this.createPath(ctx);
        return ctx.isPointInPath(x, y);
    }
}

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
    this.points = this.getPoints();
}
Polygon.prototype = new Shape();
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
    move: function (x, y) {
        this.centerX = x;
        this.centerY = y;
    },
    project: function (axis) {
        let scalars = [], v = new Vector();
        this.points.forEach(function (point) {
            v.x = point.x;
            v.y = point.y;
            scalars.push(v.dotProduct(axis));
        });
        return new Projection(Math.min.apply(Math, scalars), Math.max.apply(Math, scalars));
    },
    getAxes: function () {
        let v1 = new Vector();
        let v2 = new Vector();
        let axes = [];
        for (let i = 0; i < this.points.length - 1; i++) {
            v1.x = this.points[i].x;
            v1.y = this.points[i].y;
            v2.x = this.points[i + 1].x;
            v2.y = this.points[i + 1].y;
            axes.push(v1.edge(v2).normal());
        }
        return axes;
    },
    addPoint: function (point) {
        this.points.push(new Point(point.x, point.y));
    }
};

const Circle = function (x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
}
Circle.prototype = new Shape();
Circle.prototype = {
    collidesWith: function (shape) {
        let point, length, min = 10000, v1, v2, edge, perpendicular, normal,axes = shape.getAxes(), distance;
        if (axes === undefined) {
            distance = Math.sqrt(Math.pow(shape.x - this.x, 2) + Math.pow(shape.y - this.y), 2);
            return distance < Math.abs(this.radius + shape.radius);
        } else {
            return polygonCollisionWithCircle(shape, this);
        }
    },
    project: function (axis) {
        let scalars = [], point = new Point(this.x, this.y), dotProduct = new Vector(point).dotProduct(axis);
        scalars.push(dotProduct);
        scalars.push(dotProduct + this.radius);
        scalars.push(dotProduct - this.radius);
        return new Projection()
    },
    move: function (dx, dy) {
        this.x += dx;
        this.y += dy;
    },
    createPath: function (context) {
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    }
}