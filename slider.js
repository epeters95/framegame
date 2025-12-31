((root) => {

  var FrameTest = root.FrameTest = (root.FrameTest || {});

  class Slider {

    constructor(canvas, x, y, leftWidth, length, getScale) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.x = x;
      this.y = y;
      this.leftWidth = leftWidth;
      this.length = length;
      this.held = false;
      this.height = 20;
      this.configs = {};
      this.activeConfig = "";
      this.getScale = getScale;
      this.opacity = 1.0;

      this.initMouseListeners();
    }

    addConfig(name, ratio, changeFunction, active=false) {
      let config = {};
      config.ratio = ratio;
      config.changeFunction = changeFunction;
      this.configs[name] = config
      if (active) {
        this.activeConfig = name;
      }
    }

    activateConfig(name) {
      
      // save old setting
      let current = this.configs[this.activeConfig];
      current.ratio = this.getRatio();

      // load given setting
      this.activeConfig = name;
      this.setRatio(this.configs[name].ratio)
    }

    getHeld() {
      return this.held;
    }

    getPlace() {
      return this.x + this.leftWidth;
    }

    setPlace(newX) {
      this.leftWidth = newX - this.x;
    }

    getRatio() {
      return this.leftWidth / (this.length);
    }

    setRatio(newRatio) {
      this.leftWidth = newRatio * this.length;
    }

    hold() {
      this.held = true;
    }

    letgo() {
      this.held = false;
    }

    initMouseListeners() {
      const mouseDownCallback = (e) => {
        // mouse position relative to the browser window
        const mouse = { 
          x: e.pageX - this.canvas.offsetLeft,
          y: e.pageY - this.canvas.offsetTop
        }

        const between = (a, b, c) => { return (a >= b && a <= c) };

        let padding = 4;

        let x_min = this.getScale() * (Math.min(this.x, this.getPlace()) - padding);
        let x_max = this.getScale() * (Math.max(this.x + this.length, this.getPlace()) + padding);
        let y_min = this.getScale() * (this.y + padding);
        let y_max = this.getScale() * (this.y + this.height + padding);

        if (!this.held
            && between(mouse.x * this.getScale(), x_min, x_max)
            && between(mouse.y * this.getScale(), y_min, y_max)
        ) {
          this.hold();
          this.setPlace(mouse.x * this.getScale())
        }
      }

      this.canvas.addEventListener('mousedown', mouseDownCallback);
      this.canvas.addEventListener('touchstart', (e) => {

        this.canvas.dispatchEvent(new MouseEvent('mousedown', {
          clientX: e.touches[0].clientX,
          clientY: e.touches[0].clientY
        }));

      });

      
      // Mouse Up / Touch end

      const mouseUpCallback = () => {
        this.letgo();
      }
      this.canvas.addEventListener('mouseup', mouseUpCallback);
      this.canvas.addEventListener('touchend', mouseUpCallback);


      // Mouse Move / Touch move
      const mouseMoveCallback = (e) => {

        if (this.held) {
          const mouse = {
            x: e.pageX - this.canvas.offsetLeft,
            y: e.pageY - this.canvas.offsetTop
          }
          this.leftWidth = mouse.x - this.x;

          if (this.x > this.leftWidth + this.length) {
            this.x = this.leftWidth + this.length;
          }
        }

      }
      this.canvas.addEventListener('mousemove', mouseMoveCallback);
      this.canvas.addEventListener('touchmove', (e) => {
  
        this.canvas.dispatchEvent(new MouseEvent('mousemove', {
          clientX: e.touches[0].clientX,
          clientY: e.touches[0].clientY
        }));

      });
      
      this.canvas.addEventListener('mouseover', (e) => {
        this.opacity = this.opacity / 2;
      });
      this.canvas.addEventListener('mouseoff', (e) => {
        this.opacity = 1.0;
      });
    }

    draw() {
      this.configs[this.activeConfig].changeFunction(this.getRatio())

      let widthL = this.leftWidth;
      let widthR = this.length - widthL;
      const sliderColor = 'rgba(0,0,0,' + this.opacity + ')';
      //Left side
      this.ctx.beginPath();
      this.ctx.fillStyle = sliderColor;
      this.ctx.fillRect(this.x, this.y, widthL, this.height);

      //Slider
      this.ctx.beginPath();
      this.ctx.moveTo(this.x + widthL, this.y);
      this.ctx.lineTo(this.x + widthL, this.y + this.height);
      this.ctx.lineWidth = 5;
      this.ctx.strokeStyle = 'red';
      this.ctx.stroke();

      //Right Side
      this.ctx.beginPath();
      this.ctx.fillStyle = sliderColor;
      this.ctx.fillRect(this.x + widthL + 1, this.y, widthR, this.height);
    }

  }

  FrameTest.Slider = Slider;

})(this);