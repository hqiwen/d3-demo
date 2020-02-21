//@ts-check
const Game = function (gameName, canvasId) {
    let canvas = document.getElementById("canvasId"), self = this;

    this.context = canvas.getContext("2d");
    this.sprites = [];
    this.startTime = 0;
    this.lastTime = 0;
    this.gameTime = 0;
    this.fps = 0;
    this.STARTING_FPS = 60;

    this.paused = false;
    this.startedPauseAt = 0;
    this.PAUSE_TIMEOUT = 100;

    this.imageLoadingProgressCallback;
    this.images = {};
    this.imagesUrls = [];
    this.imagesLoaded = 0;
    this.imagesFailedToLoad = 0;
    this.imagesIndex = 0;

    this.soundOn = true;
    this.soundChannels = [];
    this.audio = new Audio();
    this.NUM_SOUND_CHANNELS = 10;

    for (let i = 0; i < this.NUM_SOUND_CHANNELS; i++) {
        let audio = new Audio();
        this.soundChannels.push(audio);
    }

    this.keyListeners = [];

    window.onkeypress = function (e) {
        self.keyPressed(e);
    }
    window.onkeydown = function (e) {
        self.keyPressed(e);
    }

    return this;
}

Game.prototype = {
    //game loop
    start: function () {
        let self = this;
        this.startTime = getTimeNow();

        window.requestAnimationFrame(function (time) {
            self.animate.call(self, time);
        });
    },
    animate: function (time) {
        let self = this;
        if (this.paused) {
            setTimeout(function () {
                self.animate.call(self, time);
            }, this.PAUSE_TIMEOUT);
        } else {
            this._tick(time);
            this.clearScreen();

            this.startAnimate(time);
            this.paintUnderSprites();

            this.updateSprites(time);
            this.paintSprites(time);

            this.paintOverSprites();
            this.endAnimate();

            window.requestAnimationFrame(function (time) {
                self.animate.call(self, time);
            })
        }
    },
    _tick: function (time) {
        this.updateFrameRate(time);
        this.gameTime = (getTimeNow() - this.startTime);
        this.lastTime = time;
    },
    updateFrameRate: function (time) {
        if (this.lastTime === 0) this.fps = this.STARTING_FPS;
        else this.fps = 1000 / (time - this.lastTime);
    },

    clearScreen: function () {
        this.context.clearRect(0, 0, this.context.canvas.window, this.context.canvas.height);
    },
    updateSprites: function (time) {
        for (let i = 0; i < this.sprites.length; ++i) {
            let sprite = this.sprites[i];
            sprite.update(this.context, time);
        }
    },
    paintSprites: function (time) {
        for (let i = 0; i < this.sprites.length; ++i) {
            let sprite = this.sprites[i];
            if (sprite.visible) {
                sprite.paint(this.context);
            }
        }
    },
    pixelsPerFrame: function (time, velocity) {
        return velocity / this.fps;
    },
    togglePaused: function () {
        let now = getTimeNow();
        this.paused = !this.paused;
        if (this.paused) {
            this.startedPauseAt = now;
        } else {
            this.startTime = this.startTime + now - this.startedPauseAt;
            this.lastTime = now;
        }
    },
    startAnimate: function (time) { },
    paintUnderSprites: function () { },
    paintOverSprites: function () { },
    endAnimate: function () { },
    //image
    getImage: function (imageUrl) {
        return this.images[imageUrl];
    },
    imageLoadErrorCallback: function (e) {
        this.imagesFailedToLoad++;
    },
    imageLoadedCallback: function (e) {
        this.imagesLoaded++;
    },
    loadImage: function (imageUrl) {
        let image = new Image(), self = this;
        image.src = imageUrl;
        image.addEventListener('load', function (e) {
            self.imageLoadedCallback(e);
        });
        image.addEventListener('error', function (e) {
            self.imageLoadErrorCallback(e);
        });
        this.images[imageUrl] = image;
    },
    loadImages: function () {
        if (this.imagesIndex < this.imagesUrls.length) {
            this.loadImage(this.imagesUrls[this.imagesIndex]);
            this.imagesIndex++;
        }
        return (this.imagesLoaded + this.imagesFailedToLoad) / this.imagesUrls.length * 100;
    },
    queueImage: function (imageUrl) {
        this.imagesUrls.push(imageUrl);
    },
    //sound
    cnaPlayOggVorbis: function () {
        return "" != this.audio.canPlayType("audio/ogg; codecs= 'vorbis'");
    },
    canPlayMP4: function () {
        return "" != this.audio.canPlayType("audio/mp4");
    },
    getAvailableSoundChannel: function () {
        let audio;
        for (let i = 0; i < this.NUM_SOUND_CHANNELS; ++i) {
            audio = this.soundChannels[i];
            if (audio.played && audio.played.length > 0) {
                if (audio.ended) {
                    return audio;
                }
            } else {
                if (!audio.ended) {
                    return audio;
                }
            }
        }
        return undefined;
    },
    playSound: function (id) {
        let track = this.getAvailableSoundChannel(), element = document.getElementById(id);

        if (track && element) {
            track.src = element.src === "" ? element.currentSrc : element.src;
            track.load();
            track.play();
        }
    },
    //keyListener
    addKeyListener: function (keyAndListener) {
        this.keyListeners.push(keyAndListener);
    },
    findKeyListener: function (key) {
        let listener = undefined;
        this.keyListeners.forEach(function (keyAndListener) {
            let currentKey = keyAndListener.key;
            if (currentKey === key) {
                listener = keyAndListener.key;
            }
        });
        return listener;
    },
    keyPressed: function (e) {
        let listener = undefined, key = undefined;
        switch (e.keyCode) {
            case 32: key = 'space'; break;
            case 83: key = 's'; break;
            case 80: key = 'p'; break;
            case 37: key = 'left arrow'; break;
            case 39: key = 'right arrow'; break;
            case 38: key = 'up arrow'; break;
            case 40: key = 'down arrow'; break;
        };
        listener = this.findKeyListener(key);
        if (listener) {
            listener();
        }
    },
    //sprite
    addSprite: function (sprite) {
        this.sprites.push(sprite)
    },
    getSprite: function (name) {
        for (let i in this.sprites) {
            if (this.sprites[i].name === name) {
                return this.sprites[i];
            }
        }
        return null;
    }
}

function getTimeNow() {
    return +new Date();
}