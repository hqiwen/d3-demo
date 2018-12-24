let painter = {
    ballPainter: ballPainter,
    ImagePainter: ImagePainter,
    SpriteSheetPainter: SpriteSheetPainter
}
// 精灵的实现
let Sprite = function (name, painter, behaviors) {
    if (name !== undefined) this.name = name;
    if (painter !== undefined) this.painter = painter;

    this.top = 0;
    this.left = 0;
    this.width = 10;
    this.height = 10;
    this.velocityX = 0;
    this.velocityY = 0;
    this.visible = true;
    this.animating = true;
    this.behaviors = behaviors || [];
    return this;
}
Sprite.prototype = {
    paint: function (context) {
        if (this.painter !== undefined && this.visible) {
            this.painter.paint(this, context);
        }
    },
    update: function (context, time) {
        for (let i = 0; i < this.behaviors.length; ++i){
            this.behaviors[i].execute(this, context, time);
        }
    }
}
// 路径绘制器
let ballPainter = {
    paint: function (sprite, context) {
        let x = sprite.left + sprite.width / 2;
        let y = sprite.top + sprite.height / 2;
        let radius = sprite.width / 2;

        context.save();
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2, false);
        context.clip();
        context.restore();
    }
}
// 图像绘制器
let ImagePainter = function (imgUrl) {
    this.image = new Image();
    this.image.src = imgUrl;
}
ImagePainter.prototype = {
    paint: function (sprite, context) {
        if (this.image.complete) {
            context.drawImage(this.image, sprite.left, sprite.top, sprite.width, sprite.height);
        }
    }
}
// 精灵表绘制器
let SpriteSheetPainter = function (cells) {
    this.cells = cells || [];
    this.cellIndex = 0;
}
SpriteSheetPainter.prototype = {
    advance: function () {
        if (this.cellIndex == this.cells.length - 1) {
            this.cellIndex = 0;
        } else {
            this.cellIndex += 1;
        };
    },
    paint: function (sprite, context) {
        let cell = this.cells[this.cellIndex];
        context.draw(spriteSheet,cell.x, cell.y,cell.w, cell.h, sprite.left, sprite.top, cell.w, cell.h);
    }
}
let runInPlace = {
    lastAdvance: 0,
    PAGEFLIP_INTERVAL: 1000,
    execute: function (sprite) {
        let elapsed = animationTimer.getElapsedTime();
        if (this.lastAdvance === 0) {
            this.lastAdvance = elapsed;
        } else if (this.lastAdvance !== 0 && elapsed - this.lastAdvance > this.PAGEFLIP_INTERVAL) {
            sprite.painter.advance();
            this.lastAdvance = elapsed;
        };
    }
}

StopWatch = function () { };
StopWatch.prototype = {
    startTime = 0,
    running = false,
    elapsed = undefined,
    start: function () {
        this.startTime = +new Date();
        this.elapsedTime = undefined;
        this.running = true;
    },
    stop: function () {
        this.elapsed = +new Date() - this.startTime;
    },
    getElapsedTime: function () {
        if (this.running) {
            return (+new Date() - this.startTime)
        } else {
            return this.elapsed;
        }
    },
    isRunning: function () {
        return this.running;
    },
    reset: function () {
        this.elapsed = 0;
    }
}

AnimationTimer = function (duration, timeWrap) {
    if(this.duration !== undefined) this.duration = duration;
    if(this.timeWrap !== undefined) this.timeWrap = timeWrap;
    this.stopWatch = new StopWatch();
}
AnimationTimer.prototype = {
    start: function () {
        this.stopWatch.start();
    },
    stop: function () {
        this.stopWatch.stop();
    },
    getElapsedTime: function () {
        let elapsedTime = this.stopWatch.getElapsedTime(),
            percentComplete = elapsedTime / this.duration;
        if (!this.stopWatch.running) {
            return undefined;
        }
        if (this.timeWrap == undefined) return elapsedTime;
        return elapsedTime * (this.timeWrap(percentComplete) / percentComplete);
    },
    isRunning: function () {
        return this.stopWatch.isRunning();
    },
    isOver: function () {
        return this.stopWatch.getElapsedTime() > this.duration;
    }
}
//时间轴的扭曲函数，注意帧速率会发生变化
AnimationTimer.makeEaseIn = function (strength) {
    return function (percentComplete) {
        return 1 - Math.pow(percentComplete, strength * 2);
    }
}
AnimationTimer.makeEaseInOut = function () {
    return function (percentComplete) {
        return percentComplete - Math.sin(percentComplete * 2 * Math.PI) / (2 * Math.PI);
    }
}

let SpriteAnimator = function (painters, elapsedCallback) {
    this.painters = painters || [];
    this.elapsedCallback = elapsedCallback;
    this.duration = 1000;
    this.startTime = 0;
    this.index = 0;
}
SpriteAnimator.prototype = {
    end: function (sprite, originalPainter) {
        sprite.animating = false;
        if (this.elapsedCallback) this.elapsedCallback(sprite);
        else sprite.painter = originalPainter;
    },
    start: function (sprite, duration) {
        let endTime = +new Date() + duration,
            period = duration / this.painters.length,
            animator = this,
            originalPainter = sprite.painter,
            lastUpdate = 0;
        this.index = 0;
        sprite.animating = true;
        sprite.painter = this.painters[this.index];
        requestAnimationFrame(function SpriteAnimatorAnimate(time) {
            if (time < endTime) {
                if ((time - lastUpdate) > period) {
                    sprite.painter = animator.painters[++animator.index];
                    lastUpdate = time;
                }
                requestAnimationFrame(SpriteAnimatorAnimate);
            } else {
                animator.end(sprite, originalPainter);
            }
        })
    }
}

let lob = {
    lastTime:0,
    GRAVITY_FORCE: 9.81,
    applyGravity: function (elapsed) {
        ball.velocityY = (this.GRAVITY_FORCE * elapsed) - (launchVelocity * Math.sin(launchAngle));
    },
    updateBallPosition: function (updateDelta) {
        ball.left += ball.velocityX * (updateDelta) * pixelPerMeter;
        ball.top += ball.velocityY * (updateDelta) * pixelPerMeter;
    },
    execute: function (ball, context, time) {
        let elapsedFrameTime,elapsedFlightTime;
        if (ballInFlight) {
            elapsedFrameTime = (time - lastTime) / 1000;
            elapsedFlightTime = (time - launchTime) / 1000;
            this.applyGravity(elapsedFlightTime);
            this.updateBallPosition(elapsedFrameTime);
            this.checkBallBound();
        }
        this.lastTime = time;
    }
}