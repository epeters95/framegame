((root) => {
  var FrameTest = root.FrameTest = (root.FrameTest || {});

  var Frame = FrameTest.Frame;

  const canvasHeight = 1080;
  const canvasWidth = 1920;

  const centerX = Math.floor(canvasWidth / 2);
  const centerY = Math.floor(canvasHeight / 2);


  class Display {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');

      this.frameWidth = canvasHeight;
      this.frameHeight = canvasHeight;
      this.frameRate = 30;

      this.theta = Math.tanh(this.frameWidth / this.frameHeight);

      this.shrinkFactor = 0.995;
      this.deltaTheta = 0;
      this.depth = 30;

      this.bgColor = "black";
      this.fgColor = "white";

      this.holding = false;
      this.mouseXY = [0, 0];

      this.idleDelta = 0;
      this.idleInc = 0.0005;
      this.shrinkInc = 0.0001;

      this.clearBackground = false;
      this.showSliders = true;

      this.minShrinkRate = 0.8;
      this.shrinkDelta = 0.3;
      this.huePeriod = 0;

      this.dPointPosition = 1;

      this.useHueConfig = false;

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
      })

      const sliderStart = 0;
      const sliderLength       = 860;
      const sliderX = centerX - Math.floor(sliderLength / 2);
      const sliderY = 0;
      const sliderHeight = 20;

      this.slider = new Slider(
        this.canvas,
        sliderX,
        sliderY,
        sliderStart,
        sliderLength,

        (ratio) => { 
          
          if (this.configOptions["huePeriod"] === true) {
            this.huePeriod = Math.PI * 2 * ratio
          } else {
            this.huePeriod = Math.PI * 2
          }

          if (this.configOptions["pointD"] === true) {
            this.dPointPosition = ratio
          } else {
            this.dPointPosition = 1;
          }
        })
      // this.sizeSlider = new Slider(sliderX, sliderY + canvasHeight - (sliderHeight + 10), sliderStart, sliderLength)

      // this.sliders = [this.slider, this.sizeSlider]



      this.canvas.addEventListener('mousedown', () => {
        this.holding = true;
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
        [centerX, centerY],      // center
        canvasWidth,             // width
        canvasHeight,            // height
        radius,                  // radius
        this.theta,              // theta
        () => this.deltaTheta,   // deltaTheta
        () => this.shrinkFactor, // reductionRate
        () => this.depth,        // depth
        () => this.huePeriod,    // period
        () => this.dPointPosition )   // Point D position

      this.reset();
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
        this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        this.ctx.fillStyle = this.bgColor;
        this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }

      // if (this.slider.held) {
      //   this.deltaTheta = Math.PI * 2 * this.slider.getRatio();
      // }
      // else if (this.holding) {
        // this.deltaTheta = -Math.tanh(
        //   (centerY - this.mouseXY[1]) / (centerX - this.mouseXY[0])
        // );
      // }

      // if (this.sizeSlider.held) {
      //   this.shrinkFactor = 0.93 +  0.3 * this.sizeSlider.getRatio();
      // }
      if (!this.slider.held && this.holding) {
        let diagonal = Math.hypot(this.frameWidth / 2, this.frameWidth / 2);
        let x = centerX - this.mouseXY[0];
        let y = centerY - this.mouseXY[1];
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
        this.slider.draw();
        // this.sizeSlider.draw();
      }
    }
  }

  class Slider {

    constructor(canvas, x, y, leftWidth, length, changeFunction) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.x = x;
      this.y = y;
      this.leftWidth = leftWidth;
      this.length = length;
      this.held = false;
      this.height = 20;
      this.changeFunction = changeFunction;

      this.initMouseListeners();
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

        let x = this.getPlace();
        if (!this.held
            && between(mouse.x, Math.min(this.x, this.getPlace()), Math.max(this.x + this.length, this.getPlace()))
            && between(mouse.y, this.y, this.y + this.height)
        ) {
          this.hold();
          this.setPlace(mouse.x)
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
    }

    draw() {
      this.changeFunction(this.getRatio())

      let widthL = this.leftWidth;
      let widthR = this.length - widthL;
      const sliderColor = 'rgba(0,0,0,0.3)';
      //Left side
      this.ctx.beginPath();
      this.ctx.fillStyle = sliderColor;
      this.ctx.fillRect(this.x, this.y, widthL, this.height);

      //Slider
      this.ctx.beginPath();
      this.ctx.moveTo(this.x + widthL, this.y - 2);
      this.ctx.lineTo(this.x + widthL, this.y + this.height + 2);
      this.ctx.lineWidth = 5;
      this.ctx.strokeStyle = 'blue';
      this.ctx.stroke();

      //Right Side
      this.ctx.beginPath();
      this.ctx.fillStyle = sliderColor;
      this.ctx.fillRect(this.x + widthL + 1, this.y, widthR, this.height);
    }

  }

  FrameTest.Display = Display;
  
  var canvas = document.getElementsByTagName("canvas")[0];
  new FrameTest.Display(canvas).start();

})(this);