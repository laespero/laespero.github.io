
customElements.define('scroll-mover',
    class extends HTMLElement {
        constructor() {
            super();
            this._progress = 0;
            this.currentPos = 0;
        }

        connectedCallback() {
            var parentWidth = parseFloat(getComputedStyle(this.parentNode).getPropertyValue("width").replace('px', ''));
            var width = parseFloat(getComputedStyle(this).getPropertyValue("width").replace('px', ''));
            var startPos = 0;
            var endPos = (parentWidth - width);
            var targetPos = startPos * (1 - this._progress) + endPos * this._progress;
            this.currentPos = targetPos;
            this.style.transform = "translateX(" + (this.currentPos) + "px) scaleY(" + 1.6 + ")";

            var step = (timestamp) => {
                var parentWidth = parseFloat(getComputedStyle(this.parentNode).getPropertyValue("width").replace('px', ''));
                var width = parseFloat(getComputedStyle(this).getPropertyValue("width").replace('px', ''));
                var startPos = 0;
                var endPos = (parentWidth - width);
                var targetPos = startPos * (1 - this._progress) + endPos * this._progress;
                this.currentPos = this.currentPos * 0.80 + targetPos * 0.20;
                this.style.transform = "translateX(" + (this.currentPos) + "px) scaleY(" + 1.6 + ")";

                requestAnimationFrame(step);
            }

            requestAnimationFrame(step);
        }

        get progress() {
            return this._progress;
        }

        set progress(val) {
            this._progress = val;
        }

    }
);


customElements.define('my-scroll',
    class extends HTMLElement {
        connectedCallback() {
            this.addEventListener("touchstart", (evt => {
                try {
                    var tar = evt.currentTarget;
                    var touch = evt.targetTouches[0];
                    tar.startX = touch.screenX;
                    tar.isDispatched = false;
                } catch (err) {
                    console.log(err);
                }
            }), false);

            this.addEventListener("touchmove", (evt => {
                try {
                    var tar = evt.currentTarget;
                    if (tar.isDispatched) return;

                    var touch = evt.targetTouches[0];
                    if (touch.screenX - tar.startX < -50) {
                        tar.dispatchEvent(new CustomEvent('leftScroll'));
                        tar.isDispatched = true;
                    } else if (touch.screenX - evt.currentTarget.startX > 50) {
                        tar.dispatchEvent(new CustomEvent('rightScroll'));
                        tar.isDispatched = true;
                    }
                } catch (err) {
                    console.log(err);
                }
            }), false);
        }
    }
);

customElements.define('my-scroll-inner',
    class extends HTMLElement {
        connectedCallback() {
            this.addEventListener("touchend", (evt => {
                try {
                    var tar = evt.currentTarget;
                    var myScroll = tar.closest('my-scroll');
                    if (myScroll && !tar.closest('my-scroll').isDispatched) {
                        tar.dispatchEvent(new CustomEvent('customTouchEnd'));
                    }
                } catch (err) {
                    console.log(err);
                }
            }), false);
        }
    }
);

customElements.define('seekbar-area',
    class extends HTMLElement {
        connectedCallback() {
            this.addEventListener("touchmove", (evt => {
                var tar = evt.currentTarget;
                var touch = evt.targetTouches[0];
                var rect = tar.getBoundingClientRect();
                tar.point = (touch.clientX - rect.x) / (rect.width);
                //console.log(tar);
                tar.dispatchEvent(new CustomEvent('seekbarMove'));
            }), false);
        }
    }
);

customElements.define('float-div',
    class extends HTMLElement {
        constructor() {
            super();

            this.x_orderIdx = -1;
            this.x_isDestroyState = false;
            this._isDestroyState = false;
            this._isShortDestroy = false;
            this.dur = 200;

        }

        tick(now) {
            if(this.isAlive) requestAnimationFrame((t) => { this.tick(t); });

            if(!this._targetId) return;

            if(!this.p_targetId) {
                  if(this.startTime) {
                     const p = (now-this.startTime)/100;
                     if(p>1) this.style.opacity = 1;
                     else this.style.opacity = p;
                  }
            }else{
                this.style.opacity = 1;
            }

            if(!this.x_isDestroyState && this._isDestroyState){
                this.destroyStartTime = now;
            }
            else if(this.x_isDestroyState && !this._isDestroyState) {
                this.style.opacity = 1;
            }

            const destroyDelay = this._isShortDestroy? 150 : 0;
            const destroyDur = this._isShortDestroy? 100 : 300;

            if(this._isDestroyState && now >= this.destroyStartTime+destroyDelay){
                const destroyProgress = (now - (this.destroyStartTime+destroyDelay)) / destroyDur;
                if(destroyProgress <= 1){
                    this.style.opacity = 1 - destroyProgress;
                }
                else {
                    this.style.opacity = 0;
                    this._targetId = null;
                    this.x_targetId = null;
                    return;
                }
            }

            if(!this.x_targetId) {
                let cs = this.currentStyleVal();
                cs.left -= 100;

                this.styleValA = Object.assign({},cs);
                this.styleValT = Object.assign({},cs);

                this.startTime = now;
            }
            else if(this.x_targetId != this._targetId) { // target 변경
                this.styleValA = this.styleValT;
                this.startTime = now;
            }
            else if(this.x_orderIdx != this._orderIdx) { // 순서 변경
                this.styleValA = this.styleValT;
                this.startTime = now;
            }


            this.styleValB = this.currentStyleVal();

            this.lerp(now);
            this.updateStyle(now, this.styleValT);


            // x_update
            this.x_orderIdx = this._orderIdx;
            this.x_targetId = this._targetId;
            this.x_isDestroyState = this._isDestroyState;
        }

        connectedCallback() {
            this.style.opacity = 0;
            requestAnimationFrame((t) => { this.tick(t); });
            this.isAlive = true;
        }

        disconnectedCallback() {
            this.isAlive = false;
        }

        get isDestroyState() {
            return this._isDestroyState;
        }

        set isDestroyState(val) {
            this._isDestroyState = val;
        }

        get orderIdx() {
            return this._orderIdx;
        }

        set orderIdx(val) {
            this._orderIdx = val;
        }

        get isShortDestroy() {
            return this._isShortDestroy;
        }

        set isShortDestroy(val) {
            this._isShortDestroy = val;
        }

        currentStyleVal() {
            const o = {left:0, top:0, width:0, height:0, fontSize:0, borderRadius:0};

            const oEle = document.getElementById("float-origin");
            const ele = document.getElementById(this._targetId);

            if(oEle && ele){
                const oRect = oEle.getBoundingClientRect();
                const rect = ele.getBoundingClientRect();

                const compStyles = window.getComputedStyle(ele);

                o.left = rect.left - oRect.left;
                o.top = rect.top - oRect.top;
                o.width = rect.width;
                o.height = rect.height;
                o.fontSize = parseFloat(compStyles.getPropertyValue("font-size"));
                o.borderRadius = parseFloat(compStyles.getPropertyValue("border-radius"));
            }

            return o;
        }

        updateStyle(now, o) {
            this.style.position = "absolute";
            this.style.left = o.left + 'px';
            this.style.top = o.top + 'px';
            this.style.width = o.width + 'px';
            this.style.height = o.height + 'px';
            this.style.fontSize = o.fontSize + 'px';
            this.style.borderRadius = o.borderRadius + 'px';

            const p = (now - this.startTime) / this.dur;
            if(p<=1){
                this.style.zIndex = 101;
            }
            else {
                this.style.zIndex = 100;
            }
        }

        easeOutQuad(x) {
            return 1 - (1 - x) * (1 - x);
        }

        lerpedStyle(rawP){
            const p = this.easeOutQuad(rawP);
            const a = this.styleValA;
            const b = this.styleValB;
            const o = Object.assign({}, this.styleValA);

            for(let k in o) {
                o[k] = a[k] * (1-p) + b[k] * p;
            }
            return o;
        }

        lerp(now) {
            const p = (now - this.startTime) / this.dur;

            if(p <= 1) {
                this.styleValT = this.lerpedStyle(p);
            }
            else {
                this.styleValT = Object.assign({}, this.styleValB);
            }
        }


        get targetId() {
            return this._targetId;
        }

        set targetId(val) {
            this.p_targetId = this._targetId;
            this._targetId = val;
        }

    }
);

customElements.define('card-drag-area',
    class extends HTMLElement {
        connectedCallback() {
            this.style.touchAction = "none";

            this.addEventListener("pointerdown", (evt => {
                try {
                    var tar = evt.currentTarget;
                    tar.startX = evt.screenX;
                    tar.startY = evt.screenY;
                    tar.isDispatched = false;
                } catch (err) {
                    console.log(err);
                }
            }), false);

            this.addEventListener("pointermove", (evt => {
                try {
                    if(evt.pointerType == "mouse" && evt.buttons == 0) return;
                    var tar = evt.currentTarget;
                    if (tar.isDispatched) return;

                    tar.dispatchEvent(new CustomEvent('card-drag',
                        { detail: (evt.screenX - tar.startX) + (evt.screenY - tar.startY) }));
                } catch (err) {
                    console.log(err);
                }
            }), false);

            this.addEventListener("pointerup", (evt => {
                try {
                    var tar = evt.currentTarget;
                    tar.dispatchEvent(new CustomEvent('card-drag-end'));
                } catch (err) {
                    console.log(err);
                }

            }), false);
        }
    }
);

customElements.define('voca-seekbar',
    class extends HTMLElement {
        constructor() {
            super();
            this._nth = 0;
            this._length = 50;
        }

        setStyle() {
            if (this.firstChild) {
                var rect = this.getBoundingClientRect();
                this.firstChild.style.transition = "transform 300ms, width 300ms";
                this.firstChild.style.transform = "translate(" + (this._nth/this._length) * rect.width + "px, 0px)";
            }
        }

        connectedCallback() {
            this.style.touchAction = "none";

            this.setStyle();
            this.addEventListener("pointermove", (evt => {
                if(evt.pointerType == "mouse" && evt.buttons == 0) return;

                var tar = evt.currentTarget;
                var rect = tar.getBoundingClientRect();
                tar.point = (evt.clientX - rect.x) / (rect.width);
                //console.log(tar);
                tar.dispatchEvent(new CustomEvent('seekbarMove'));
            }), false);
        }

        get nth() {
            return this._nth;
        }

        set nth(val) {
            this._nth = val;
            this.setStyle();
        }

        get length() {
            return this._length;
        }

        set length(val) {
            this._length = val;
            this.setStyle();
        }
    }
);


customElements.define('gesture-div',
    class extends HTMLElement {
        connectedCallback() {
            this.style.touchAction = "none";

            this.addEventListener("pointerdown", (evt => {
                try {
                    var tar = evt.currentTarget;
                    tar.startX = evt.screenX;
                    tar.startY = evt.screenY;
                    tar.isDispatched = false;
                } catch (err) {
                    console.log(err);
                }

            }), false);

            this.addEventListener("pointermove", (evt => {
                try {
                    if(evt.pointerType == "mouse" && evt.buttons == 0) return;

                    var tar = evt.currentTarget;
                    if (tar.isDispatched) return;

                    var xDelta = evt.screenX - tar.startX;
                    var yDelta = evt.screenY - tar.startY;

                    if (-40 < yDelta && yDelta < 40) {
                        if (xDelta < -50) {
                            tar.dispatchEvent(new CustomEvent('leftScroll'));
                            tar.isDispatched = true;
                        } else if (xDelta > 50) {
                            tar.dispatchEvent(new CustomEvent('rightScroll'));
                            tar.isDispatched = true;
                        }
                    }
                } catch (err) {
                    console.loe(err);
                }
            }), false);
        }
    }
);

function loadVideo(vid, isLoop) {
        const params =
            { iv_load_policy: 3,
              rel: 0,
              showinfo: 0,
              modestbranding: 0,
              controls: 0,
              playsinline: 1,
              disablekb: 1,
              fs:0,
              autoplay: 0
            };

        if(isLoop) {
            params.loop = 1;
            params.playlist = vid;
        }

        const YP = new Youtube.Player({
                video_id: vid,
                params: params,
                on: {
                    'ready': e => {
                        player.seek(0, true);
                        player.play();
                        app.ports.fromPlayer.send({ tag: "loadSuccess", data: null });
                    },
                    'state_change': onPlayerStateChange,
                    'yt_error': function onPlayerError(e) {
                        document.getElementById("debug-str").innerHTML = e;
                        player.load_video(vid, true);
                        player.play();
                    },
                    'api_change': function (event) {
                        player.set_api('captions', 'track', {});
                        //player.set_api('channelBanners', 'track', {});
                    },
                    'time_change': function(){
                        app.ports.fromPlayer.send({ tag: "playerTime", data: parseInt(player.get_current_time() * 1000) });
                    }
                }
            });
        const iframe = YP.get_iframe();

        iframe.style.height = "100%";
        iframe.style.width = "100%";
        this.appendChild(iframe);
        player = YP;
}

customElements.define('youtube-wrapper',
    class extends HTMLElement {
        connectedCallback() {
            this.loadVideo(this.getAttribute('vid'));
        }

        loadVideo(vid) {
            loadVideo.call(this, vid, false);
        }
    }
);


customElements.define('youtube-loop-wrapper',
    class extends HTMLElement {
        connectedCallback() {
            this.loadVideo(this.getAttribute('vid'));
        }

        loadVideo(vid) {
            loadVideo.call(this, vid, true);
        }
    }
);


customElements.define('youtube-loop-wrapper-record',
    class extends HTMLElement {
        connectedCallback() {
            this.loadVideo(this.getAttribute('vid'));
        }

        loadVideo(vid) {
            loadVideo.call(this, vid, true);
            player.iframe.style.transform = 'scale(4) rotate(145deg)';
        }
    }
);


customElements.define('write-canvas',
    class extends HTMLElement {
        constructor() { super(); }

        connectedCallback() { this.init(); }

        clear() {
            this.ctx.clearRect(0, 0, 200, 200);
            this.ctx.beginPath();
        }

        init()
        {
            const canvas = document.createElement("canvas");
            this.style.touchAction = "none";
            this.appendChild(canvas);
            const ctx = canvas.getContext('2d');
            this.ctx = ctx;

            canvas.width = 200;
            canvas.height = 200;
            canvas.style.opacity = 0.7;
            ctx.canvas.width = 200;
            ctx.canvas.height = 200;

            let isDraw = false;
            let coord = { px: -1, py: -1, cx: -1, cy: -1 };

            function toPos(e) {
                const offset = e.target.getBoundingClientRect();
                const x = e.clientX - offset.x;
                const y = e.clientY - offset.y;
                return {x:x, y:y};
            }

            canvas.addEventListener('pointerdown', e => { try {
                e.preventDefault();

                const pos = toPos(e);
                coord.cx = pos.x;
                coord.cy = pos.y;
                coord.px = pos.x;
                coord.py = pos.y;
                drawStart();

                isDraw = true;
            } catch {}
            });

            canvas.addEventListener('pointermove', e => { try {
                e.preventDefault();
                if(e.pointerType == "mouse" && e.buttons == 0) return;

                update(e);
                draw();
                isDraw = false;
            } catch {}
            });

            canvas.addEventListener('pointerup', e => { try {
                e.preventDefault();

                update(e);
                draw();
            } catch {}
            });

            function update(e) {
                if(coord.cx == -1) {
                    const pos = toPos(e);
                    coord.px = pos.x;
                    coord.py = pos.y;
                    coord.cx = pos.x;
                    coord.cy = pos.y;
                }

                coord.px = coord.cx;
                coord.py = coord.cy;

                const pos = toPos(e);
                coord.cx = pos.x;
                coord.cy = pos.y;
            }

            function drawStart() {
                ctx.beginPath();
                ctx.arc(coord.px, coord.py, 3, 0, 2 * Math.PI);
                ctx.fill();
            }

            function draw() {
                ctx.beginPath();
                ctx.lineWidth = 5;
                ctx.lineCap = 'round';
                ctx.strokeStyle = '#000';
                ctx.moveTo(coord.px, coord.py);
                ctx.lineTo(coord.cx, coord.cy);
                ctx.stroke();
            }
        }
    }
);
