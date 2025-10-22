((root) => {
  var FrameTest = root.FrameTest = (root.FrameTest || {});

  var Frame = FrameTest.Frame;
  var Slider = FrameTest.Slider;

  const canvasHeight = 1080;
  const canvasWidth = 1920;
  const maxWidth = 2400;
  let windowPercentage = 0.98;


  class Display {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.cWidth = canvasWidth;
      this.cHeight = canvasHeight;


      window.addEventListener('load', () => {
        this.canvas.width = this.cWidth;
        this.canvas.height = this.cHeight;
        this.resize();
      })

      window.addEventListener('resize', () => {
        this.resize();
      })

      

      this.frameWidth = canvasWidth;
      this.frameHeight = canvasHeight;
      this.centerX = Math.floor(canvasWidth / 2);
      this.centerY = Math.floor(canvasHeight / 2);
      this.frameRate = 30;

      this.bgColor = "black";
      this.fgColor = "white";

      this.mouseXY = [0, 0];

      this.theta = Math.tanh(this.frameWidth / this.frameHeight);
      this.shrinkFactor   = 0.995;
      this.deltaTheta     = 0;
      this.depth          = 30;
      this.idleDelta      = 0;
      this.idleInc        = 0.0005;
      this.shrinkInc      = 0.0001;
      this.minShrinkRate  = 0.8;
      this.shrinkDelta    = 0.3;
      this.huePeriod      = 0;

      this.dPointPosition = 1;

      this.holding         = false;
      this.clearBackground = false;
      this.showSliders     = true;
      this.useHueConfig    = false;
      this.useInvert       = false;
      this.useStrange      = false;
      this.modifyHsv       = false;
      this.colorSwap       = true;
      this.addHue          = null;

      // Config options

      this.configOptions = { "huePeriod": true };

      let optionInputs = Array.from(document.getElementsByClassName("configOption"));
      this.optionNames = optionInputs.map((opt) => opt.id);

      optionInputs.forEach((optInput) => {
        
        optInput.addEventListener("click", () => {
          this.optionNames.forEach((optName) => { this.configOptions[optName] = false})
          this.configOptions[optInput.id] = optInput.checked;
        });
      });

      const clearConfig = document.getElementById("clearBackground");
      clearConfig.addEventListener("click", () => {
        this.clearBackground = clearConfig.checked;
        this.addHue = null;
      })

      const invertConfig = document.getElementById("invert");
      invertConfig.addEventListener("click", () => {
        this.useInvert = invertConfig.checked;
      })

      const strangeConfig = document.getElementById("strange");
      strangeConfig.addEventListener("click", () => {
        this.useStrange = strangeConfig.checked;
      })

      const modifyHsvConfig = document.getElementById("modifyHsv");
      modifyHsvConfig.addEventListener("click", () => {
        this.modifyHsv = modifyHsvConfig.checked;
      })

      const colorSwapConfig = document.getElementById("colorSwap");
      colorSwapConfig.addEventListener("click", () => {
        this.colorSwap = colorSwapConfig.checked;
      })

      const cyanConfig = document.getElementById("cyan");
      cyanConfig.addEventListener("click", () => {
        this.addHue = "cyan";
      });

      const magentaConfig = document.getElementById("magenta");
      magentaConfig.addEventListener("click", () => {
        this.addHue = "magenta";
      });

      const yellowConfig = document.getElementById("yellow");
      yellowConfig.addEventListener("click", () => {
        this.addHue = "yellow";
      });

      const sliderStart = 0;
      const sliderLength = 860;
      const sliderX = this.centerX - Math.floor(sliderLength / 2);
      const sliderY = 0;

      this.slider = new Slider(
        this.canvas,
        sliderX,
        sliderY,
        sliderStart,
        sliderLength,

        (ratio) => { 
          
          if (this.configOptions["huePeriod"] === true) {
            this.huePeriod = Math.PI * 2 * ratio
          }

          if (this.configOptions["pointD"] === true) {
            this.dPointPosition = ratio
          }
        })



      this.canvas.addEventListener('mousedown', () => {
        
        if (!this.slider.getHeld()) {
          this.holding = true;
        }
      })

      this.canvas.addEventListener('mousemove', (e) => {

        if (this.holding) {
          this.mouseXY = [
            e.pageX - this.canvas.offsetLeft,
            e.pageY - this.canvas.offsetTop
          ];
        }

      })

      this.canvas.addEventListener('mouseup', () => {
        this.holding = false;
      })

      let radius = Math.hypot(this.frameWidth / 2, this.frameHeight / 2)

      this.frame = new Frame(
        this.canvas,
        [this.centerX, this.centerY],        // center
        this.frameWidth,           // width
        this.frameHeight,          // height
        radius,                    // radius
        this.theta,                // theta
        () => this.deltaTheta,     // deltaTheta
        () => this.shrinkFactor,   // reductionRate
        () => this.depth,          // depth
        () => this.huePeriod,      // period
        () => this.dPointPosition, // Point D position
        () => this.useInvert,      // use invert value
        () => this.useStrange,     // use hue alternation
        () => this.modifyHsv,      // modify hsv function
        () => this.colorSwap       // color swap gradients
      );

      this.reset();
    }

    resize() {

      this.cWidth = window.innerWidth;
      this.cHeight = window.innerHeight;

      const nativeRatio = canvasWidth / canvasHeight;
      const browserWindowRatio = this.cWidth / this.cHeight;

      if (browserWindowRatio > nativeRatio) {

        this.cHeight = Math.floor(this.cHeight * windowPercentage);
        this.cWidth = Math.floor(this.cHeight * nativeRatio);
      
      } else {

        this.cHeight = Math.floor(this.cWidth / nativeRatio);
        this.cWidth = Math.floor(this.cWidth * windowPercentage);
        
        if (this.cWidth > maxWidth) {
          this.cWidth = maxWidth;
        }
      }
      this.canvas.style.width = '' + this.cWidth + 'px';
      this.canvas.style.height = '' + this.cHeight + 'px';
    }

    reset() {

      window.clearInterval(this.endID);
    }

    draw() {

      if (this.idleDelta > (10 * Math.PI)) {
        this.idleDelta = 0;
      }
      this.idleDelta += this.idleInc;

      // Fill background
      if (this.clearBackground) {
        this.ctx.clearRect(0, 0, this.frameWidth, this.frameHeight);
        this.ctx.fillStyle = this.bgColor;
        if (this.addHue !== null) {
          this.ctx.fillStyle = this.addHue;
        } else {
          this.ctx.fillStyle = "#000000";
        }
        this.ctx.fillRect(0, 0, this.frameWidth, this.frameHeight);
      }

      if (!this.slider.held && this.holding) {
        let diagonal = Math.hypot(this.frameWidth / 2, this.frameWidth / 2);
        let x = this.centerX - this.mouseXY[0];
        let y = this.centerY - this.mouseXY[1];
        let distRatio = Math.hypot(x, y) / diagonal;

        this.shrinkFactor = this.minShrinkRate + this.shrinkDelta * distRatio;
        this.deltaTheta = this.idleDelta / 2;
      }

      if (this.slider.held || !this.holding) {
        this.deltaTheta = this.idleDelta;

        if (this.shrinkFactor >= 1 && this.shrinkInc < 0 ||
            this.shrinkFactor <= this.minShrinkRate && this.shrinkInc > 0) {

          this.shrinkInc = this.shrinkInc * -1
        }
        this.shrinkFactor -= this.shrinkInc;
      }

      this.frame.draw();
    }


    start() {

      this.windowID = window.setInterval(this.step.bind(this), this.frameRate);
    }
    
    
    step() {
      
      this.draw();

      if (this.showSliders) {
        // Clear slider area
        this.ctx.clearRect(0, 0, this.frameWidth, this.slider.height);
        this.ctx.fillStyle = this.bgColor;
        this.ctx.fillRect(0, 0, this.frameWidth, this.slider.height);
        
        this.slider.draw();
      }
    }
  }

  FrameTest.Display = Display;
  
  var canvas = document.getElementsByTagName("canvas")[0];
  new FrameTest.Display(canvas).start();

})(this);