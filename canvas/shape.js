//@ts-check
class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    getMagnitude() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }
    add(vector) {
        let v = new Vector();
        v.x = this.x + vector.x;
        v.y = this.y + vector.y;
        return v;
    }
    subtract(vector) {
        let v = new Vector();
        v.x = this.x - vector.x;
        v.y = this.y - vector.y;
        return v;
    }
    dotProduct(vector) {
        return this.x * vector.x + this.y * vector.y;
    }
    edge(vector) {
        return this.subtract(vector);
    }
    perpendicular() {
        let v = new Vector();
        v.x = this.y;
        v.y = 0 - this.x;
        return v;
    }
    normalize() {
        let v = new Vector(0, 0),
            m = this.getMagnitude();
        if (m != 0) {
            v.x = this.x / m;
            v.y = this.y / m;
        }
        return v;
    }
    normal() {
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

function mixin(from, to) {
    let fromPrototype = from.prototype, toPrototype = to.prototype;
    for (let i in fromPrototype) {
        if (!toPrototype[i]) {
            toPrototype[i] = fromPrototype[i];
        }
    }
    return toPrototype;
}

const Shape = function () {
    this.x = undefined;
    this.y = undefined;
    this.axes = [];
    this.strokeStyle = 'rgba(255,253,208,0.9)';
    this.fillStyle = 'rgba(147, 197, 114, 0.8)';
}
Shape.prototype = {
    collidesWith: function (shape) {
        let axes = this.getAxes().concat(shape.getAxes());
        return !this.separationOnAxes(axes, shape);
    },
    minimumTranslationVector: function (axes, shape) {
        let minimumOverlap = 100000, overlap, axisWithSmallestOverlap;
        for (let i = 0; i < axes.length; ++i) {
           let  axis = axes[i];
            let projection1 = shape.projection(axis);
            let projection2 = this.projection(axis);
            overlap = projection1.overlap(projection2);
            if (overlap === 0) {
                return {
                    axis: undefined,
                    overlap: 0,
                };
            } else {
                if (overlap < minimumOverlap) {
                    minimumOverlap = overlap;
                    axisWithSmallestOverlap = axis;
                }
            }
        }
        return { axis: axisWithSmallestOverlap, overlap: minimumOverlap };
    },
    separationOnAxes: function (axes, shape) {
        for (let i = 0; i < axes.length; ++i) {
            let axis = axes[i];
            let projection1 = shape.projection(axis);
            let projection2 = this.projection(axis);
            if (!projection1.overlaps(projection2)) {
                return true;
            }
            return false;
        }
    },
    getAxes: function () {
        return this.axes;
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
export const Polygon = function (centerX, centerY, radius, sides, startAngle, strokeStyle, fillStyle, filled) {
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
    },
    collidesWith: function (shape) {
        let axes = shape.getAxes();
        if (axes === undefined) {
            //圆的碰撞判定
            return polygonCollisionWithCircle(this, shape);
        } else {
            //多边形的判定
            return polygonCollisionWithPolygon(this, shape);
        }
    }
};
Polygon.prototype = mixin(Shape, Polygon);

const Circle = function (x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
}
Circle.prototype = {
    collidesWith: function (shape) {
        let axes = shape.getAxes();
        if (axes === undefined) {
            //圆碰撞的判定
            return circleCollisionWithCircle(shape, this);
        } else {
            //多边形碰撞的判定
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
Circle.prototype = mixin(Shape, Circle);

function getPolygonPointClosestToCircle(polygon, circle) {
    let min = 10000, length, testPoint, closestPoint;
    for (let i = 0; i < polygon.points.length; ++i) {
        testPoint = polygon.points[i];
        length = Math.sqrt((Math.pow(testPoint.x - circle.x, 2), Math.pow(testPoint.y - circle.y, 2)));
        if (length < min) {
            min = length;
            closestPoint = testPoint;
        }
        return closestPoint;
    }
}

function polygonCollisionWithCircle(polygon, circle) {
    let v1, v2, axes = polygon.getAxes(), closestPoint = getPolygonPointClosestToCircle(polygon, circle);
    v1 = new Vector(new Point(circle.x, circle.y));
    v2 = new Vector(new Point(closestPoint.x, closestPoint.y));

    axes.push(v1.subtract(v2).normalize());
    return !polygon.separationOnAxes(axes, circle);
}

function polygonCollisionWithPolygon(p1, p2) {
    let mtv1 = p1.minimumTranslationVector(p1.getAxes(), p2);
    let mtv2 = p2.minimumTranslationVector(p2.getAxes(), p2);
    if (mtv1.overlap === 0 && mtv2.overlap === 0) {
        return { axis: undefined, overlap: 0 };
    } else {
        return mtv1.overlap < mtv2.overlap ? mtv1 : mtv2;
    }
}

function circleCollisionWithCircle(c1, c2) {
    let distance = Math.sqrt((Math.pow(c1.x - c2.x, 2) + Math.pow(c1.y - c2.y,2))), overlap = Math.abs(c1.radius + c2.radius) - distance;
    return overlap < 0 ? new minimumTranslationVector(undefined, 0) : new minimumTranslationVector(undefined, overlap);
}

function separate(shapeMoving, mtv) {
    let dx, dy, velocityMagnitude, point;
    if (mtv.axis === undefined) {
        point = new Point();
        velocityMagnitude = Math.sqrt(Math.pow(velocity.x, 2) + Math.pow(velocity.y, 2));
        point.x = velocity.x / velocityMagnitude;
        point.y = velocity.y / velocityMagnitude;
        mtv.axis = new Vector(point);
    }
    dy = mtv.axis.y * mtv.overlap;
    dx = mtv.axis.x * mtv.overlap;
    if ((dx < 0 && velocity.x < 0) || (dx > 0 && velocity.x > 0)) {
        dx = -dx;
    }
    if ((dy < 0 && velocity.y < 0) || (dy > 0 && velocity.y > 0)) {
        dy = -dy;
    }
    shapeMoving.move(dx, dy);
}