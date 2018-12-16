TextCursor = function (width, fillStyle) {
    this.fillStyle = fillStyle || 'rbga(0,0,0, 0.5)'
    this.width = width;
    this.left = 0;
    this.top = 0;
}
TextCursor.prototype = {
    getHeight: function (context) {
        let h = context.measureText('W').width;
        return h + h / 6;
    },
    createPath: function (context) {
        context.beginPath();
        context.rect(this.left, this.top, this.width, this.getHeight(context));
    },
    draw: function (context, left, bottom) {
        context.save();
        this.left = left;
        this.top = bottom - this.getHeight(context);
        this.createPath(context);
        context.fillStyle = this.fillStyle;
        context.fill();
        context.restore();
    },
    erase: function (context, imageData) {
        context.putImageData(imageData, 0, 0, this.left, this.top, this.width, this.getHeight(context));
    }
}

TextLine = function (x, y) {
    this.text = "";
    this.left = x;
    this.bottom = y;
    this.caret = 0;
}
TextLine.prototype = {
    insert: function (text) {
        this.text = this.text.substr(0, this.caret) + text + this.text.substr(this.caret);
        this.caret += text.length;
    },
    removeCharacterBeforeCaret: function () {
        if (this.caret === 0) return;
        this.text = this.text.substr(0, this.caret - 1) + this.text.substr(this.caret);
        this.caret--;
    },
    getWidth: function (context) {
        return context.measureText(this.text).width;
    },
    getHeight: function (context) {
        let h = context.measureText('W').width;
        return h + h / 6;
    },
    draw: function (context) {
        context.save();
        context.textAlign = 'start';
        context.textBaseline = 'bottom';
        context.strokeText(this.text, this.left, this.bottom);
        context.fillText(this.text, this.left, this.bottom);
    },
    erase: function (context, imageData) {
        context.putImageData(imageData, 0, 0);
    }
}
Paragraph = function (context, left, top, imageData, cursor) {
    this.context = context;
    this.drawingSurface = imageData;
    this.left = left;
    this.top = top;
    this.lines = [];
    this.activeLine = undefined;
    this.cursor = cursor;
    this.blinkingInterval = undefined;
}
Paragraph.prototype = {
    isPointInside: function (loc) {
        let c = this.context;
        c.beginPath();
        c.rect(this.left, this.top, this.getWidth(), this.getHeight());
        return c.isPointInside(loc.x, loc.y);
    },
    getWidth:function () {
        let w = 0,widest = 0;
        this.lines.forEach(function (line) {
            w = line.getWidth(this.context);
            if (w > widest) {
                widest = w;
            }
        })
        return widest;
    },
    getHeight:function () {
        let h = 0;
        this.lines.forEach(function (line) {
            h += line.getWidth(this.context);
        })
        return h;
    },
    draw: function () {
        this.lines.forEach(function (line) {
            line.draw(this.context);
        })
    },
    erase: function () {
        context.putImageData(imageData, 0, 0);
    },
    addLine: function (line) {
        this.lines.push(line);
        this.activeLine = line;
        this.moveCursor(line.left, line.bottom);
    },
    moveCursor: function (x, y) {
        this.cursor.erase(this.context, this.drawingSurface);
        this.cursor.draw(this.context, x, y);
        this.blinkCursor(x, y);
    },
    blinkCursor: function (x, y) {
        let self = this, BLINK_OUT = 200, BLINK_INTERVAL = 900;
        this.blinkingInterval = setInterval(function (e) {
            cursor.erase(context, self.drawingSurface);
            setTimeout(function (e) {
                cursor.draw(context, cursor.left, cursor.top, cursor.getHeight(context))
            }, BLINK_OUT)
        }, BLINK_INTERVAL);
    },
    moveCursorCloseTo: function (x, y) {
        let line = this.getLine(y);
        if (line) {
            line.caret = this.getColumn(line, x);
            this.activeLine = line;
            this.moveCursor(line.getCaretX(context), line.bottom);
        }
    },
    moveLinesDown:function(start) {
        for (let i = start; i < this.lines.length; ++i){
            line = this.lines[i];
            line.bottom += line.getHeight(this.context);
        }
    },
    getLine: function (y) {
        let line;
        for (let i = 0; i < this.lines.length; ++i){
            line = this.lines[i];
            if (y > line.bottom - line.getHeight(context) && y < line.bottom) {
                return line;
            }
        }
        return undefined;
    },
    insert: function (text) {
        let t = this.activeLine.text.substring(0, this.activeLine.caret),
            w = this.context.measureText(t).width;
        this.activeLine.erase(this.context, this.drawingSurface);
        this.activeLine.insert(text);
        this.moveCursor(thi.activeLine.left + w, this.activeLine.bottom);
        this.activeLine.draw(this.context);
    },
    newLine: function () {
        let textBeforeCursor = this.activeLine.text.substring(0, this.activeLine.caret),
            textAfterCursor = this.activeLine.text.substring(this.activeLine.caret),
            height = this.context.measureText('W').width + this.context.measureText('W').width / 6,
            bottom = this.activeLine.bottom + height,
            activeIndex, line;
        this.erase(this.context, this.drawingSurface);
        this.activeLine.text = textBeforeCursor;
        line = new TextLine(this.activeLine.left, bottom);
        line.insert(textAfterCursor);

        activeIndex = this.lines.indexOf(this.activeLine);
        this.lines.splice(activeIndex + 1, 0, line);
        this.activeLine = line;
        this.activeLine.caret = 0;

        activeIndex = this.lines.indexOf(this.activeLine);
        for (let i = activeIndex + 1; i < this.lines.length; ++i) {
            line = this.lines[i];
            line.bottom += height;
        }
        this.draw();
        this.cursor.draw(this.context, this.activeLine.left, this.activeLine.bottom);
    },
    getColumn: function (line, x) {
        let found = false, before, after, closest, tmpLine, column;
        tmpLine = new TextLine(line.left, line.bottom);
        tmpLine.insert(line.text);

        while (!found && tmpLine.text.length > 0) {
            before = tmpLine.left + tmpLine.getWidth(context);
            tmpLine.removeLastCharacter();
            after = tmpLine.left + tmpLine.getWidth(context);
            if (after < x) {
                closest = x - after < before - x ? after : before;
                column = closest === before ? tmpLine.text.length + 1 : tmpLine.text.length;
                found = true;
            }
        }
        return column;
    },
    activeLineIsOutOfText: function () {
        return this.activeLine.text.length === 0;
    },
    activeLineIsTopLine: function () {
        return this.lines[0] === this.activeLine;
    },
    moveUpOneLine: function () {
        let lastActiveText, line, before, after;
        lastActiveLine = this.activeLine;
        lastActiveText = "" + lastActiveLine.text;
        activeIndex = this.lines.indexOf(this.activeLine);
        this.activeLine = this.lines[activeIndex - 1];
        this.activeLine.caret = this.activeLine.text.length;
        this.lines.splice(activeIndex, 1);
        this.moveCursor(this.activeLine.left + this.activeLine.getWidth(this.context), this.activeLine.bottom);
        this.activeLine.text += lastActiveText;
        for (let i = activeIndex; i < this.lines.length; ++i) {
            line = this.lines[i];
            line.bottom -= line.getHeight(this.context);
        }
    },
    backspace: function () {
        let lastActiveLine, activeIndex, t, w;
        this.context.save();
        if (this.activeLine.caret === 0) {
            if (!this.activeLineIsTopLine()) {
                this.erase(this.context, this.drawingSurface);
                this.moveUpOneLine();
                this.draw();
            }
        } else {
            this.context.fillStyle = fillStyleSelect.value;
            this.context.strokeText = fillStrokeSelect.value;
            this.erase(this.context, this.drawingSurface);
            this.activeLine.removeCharacterBeforeCaret();
            t = this.activeLine.text.slice(0, this.activeLine.caret);
            w = this.context.measureText(t).width;

            this.moveCursor(this.activeLine.left + w, this.activeLine.bottom);
            this.draw(this.context);
            context.restore();
        }
    }
}