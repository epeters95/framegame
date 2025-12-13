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
      this.scale = 1;


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
      this.holding        = false;

      this.debug = false;


      this.configValues = {
        clearBackground: false,
        useInvert:       false,
        useStrange:      false,
        modifyHsv:       false,
        colorSwap:       true,
        shadowMode:      false,
        useAlphas:       true,
        addHue:          null,
        customFactor:    0.1,
        customFeature:   ""
      }


      Array.from(document.getElementsByClassName("config-checkbox"))
        .forEach( (opt) => {

          // Add Hue special case
          if (["cyan", "magenta", "yellow"].includes(opt.id) ) {
            this.configValues.addHue = opt.id;
          }
          else {
            this.configValues[opt.id] = opt.checked;
            if (opt.id === "clearBackground") {
              this.configValues.addHue = null;
            }
            else if (opt.id === "customFactor") {
              this.configValues.customFactor = opt.value;
            }
          }
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
        () => this.scale
        );

      this.slider.addConfig("huePeriod", 0, (ratio) => { this.huePeriod = Math.PI * 2 * ratio }, true)
      this.slider.addConfig("pointD", 0, (ratio) => { this.dPointPosition = ratio })

      // Config options

      this.configOptions = { "pointD": true };

      // Object hash of key -> () => config.value

      this.configFunctions = Object.keys(this.configValues)
                                  .reduce((obj, val) => ({ ...obj, [val]: () => this.configValues[val]}), {})

      let optionInputs = Array.from(document.getElementsByClassName("config-radio"));
      this.optionNames = optionInputs.map((opt) => opt.id);

      optionInputs.forEach((optInput) => {
        
        optInput.addEventListener("click", () => {
          this.optionNames.forEach((optName) => { this.configOptions[optName] = false})
          this.configOptions[optInput.id] = optInput.checked;
          this.slider.activateConfig(optName)
        });
      });

      // Custom field

      const computeEngine = new ComputeEngine.ComputeEngine();
      let mathField = document.getElementById("custom-math-field");
      
      mathField.addEventListener("change", () => {

        const expression = computeEngine.parse(mathField.value);
        const customFunction = expression.compile();
        this.configFunctions.customMath = customFunction;
      })

      let factorInput = document.getElementById("custom-factor")
      factorInput.addEventListener("change", (e) => {
        this.configValues.customFactor = parseFloat(e.target.value) / 100;
      })

      let shapeInput = document.getElementById("hueshape-var")
      let timeInput = document.getElementById("huetime-var")
      const featureSelection = (e) => {
        this.configValues.customFeature = e.target.id
      }
      shapeInput.addEventListener("change", featureSelection)
      timeInput.addEventListener("change", featureSelection)

      // Slider logic

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
        [this.centerX, this.centerY],    // center
        this.frameWidth,                 // width
        this.frameHeight,                // height
        radius,                          // radius
        this.theta,                      // theta
        () => this.deltaTheta,           // deltaTheta
        () => this.shrinkFactor,         // reductionRate
        () => this.depth,                // depth
        () => this.huePeriod,            // period
        () => this.dPointPosition,       // Point D position
        () => this.configFunctions       // config return functions
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

      this.scale = this.cWidth / canvasWidth;
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
      if (this.configValues.clearBackground) {

        this.ctx.clearRect(0, 0, this.frameWidth, this.frameHeight);
        this.ctx.fillStyle = this.bgColor;

        if (this.configValues.addHue !== null) {
          this.ctx.fillStyle = this.configValues.addHue;
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

      if (this.configValues.showSliders) {
        // Clear slider area
        this.ctx.clearRect(0, 0, this.frameWidth, this.slider.height);
        this.ctx.fillStyle = this.bgColor;
        this.ctx.fillRect(0, 0, this.frameWidth, this.slider.height);
        
        this.slider.draw();
      }

      if (this.debug) {
        let debugStr = "Display state:\n";
        Object.keys(this.configValues).forEach((config) => {
          debugStr += config + ": " + this.configValues[config] + "\n";
        });
        this.ctx.fillText("debugStr",20,20);
      }
    }
  }

  FrameTest.Display = Display;
  
  var canvas = document.getElementsByTagName("canvas")[0];
  new FrameTest.Display(canvas).start();

})(this);