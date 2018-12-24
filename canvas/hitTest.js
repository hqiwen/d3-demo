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
    dotProduct: function (vector) {
        return this.x * vector.x + this.y * vector.y;
    },
    edge:function (vector) {
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
    }
}
