((root) => {
  var FrameTest = root.FrameTest = (root.FrameTest || {});

  const canvasHeight = 1080;
  const canvasWidth = 1920;

  const centerX = Math.floor(canvasWidth / 2);
  const centerY = Math.floor(canvasHeight / 2);

  const maxHue = 255;
  const numIntervals = 6;


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

      this.fillBackground = false;
      this.showSliders = true;

      this.minShrinkRate = 0.8;
      this.shrinkDelta = 0.3;
      this.huePeriod = 0;

      this.dPointPosition = 0;

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
        // (ratio) => { this.huePeriod = Math.PI * 2 * ratio }
        (ratio) => { this.dPointPosition = ratio }
        )
      // this.sizeSlider = new Slider(sliderX, sliderY + canvasHeight - (sliderHeight + 10), sliderStart, sliderLength)

      // this.sliders = [this.slider, this.sizeSlider]


      // Config options

      this.configOptions = {};

      let optionInputs = Array.from(document.getElementsByClassName("configOption"));
      this.optionNames = optionInputs.map((opt) => opt.id);

      optionInputs.forEach((optInput) => {
        
        optInput.addEventListener("click", () => {
          this.configOptions[optInput.id] = optInput.checked;
        });
      });

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
        () => this.dPointPosition )   // period

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
      if (this.fillBackground) {
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

  class Frame {

    constructor(canvas, center, width, height, radius, theta, getDeltaTheta, getReductionRate, getDepth, getSliderVal, parent=null) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');

      this.center = center;
      this.width = width;
      this.height = height;
      this.radius = radius;
      this.theta = theta;
      this.getDeltaTheta = getDeltaTheta;
      this.getReductionRate = getReductionRate;
      this.reductionRate = getReductionRate();
      this.getSliderVal = getSliderVal;
      this.parent = parent;

      this.periodDepthDivisor = 10;
      this.tAngleMultiplier = 8;
      this.curveMultiplier = 120;

      this.getDepth = getDepth;
      this.depth = getDepth();

      this.bgColor = "black";
      this.fgColor = "white";

      if (parent === null) {

        this.sinRef = Math.sin;
        this.cosRef = Math.cos;
        this.tanRef = Math.tan;
        this.translateRef = (arr) => arr;

      } else {

        this.sinRef = (angle) => parent.cos(angle + this.getDeltaTheta())
        this.cosRef = (angle) => parent.sin(angle + this.getDeltaTheta())
        this.tanRef = (angle) => parent.tan(angle + this.getDeltaTheta())

        this.translateRef = ([x, y]) => {
          let marginX = width * (1 - this.reductionRate) / 2
          let marginY = height * (1 - this.reductionRate) / 2

          return parent.translateXY(
            [
              this.reductionRate * x,
              this.reductionRate * y
            ]
          );
        }
      }

      if (this.depth > 0) {
        this.subFrame = new Frame(
          canvas,
          center,
          width * this.reductionRate,
          height * this.reductionRate,
          radius * this.reductionRate,
          theta,
          getDeltaTheta,
          getReductionRate,
          () => this.depth - 1,
          getSliderVal,
          this
          )
      }
      
      this.color = this.getColor()

    }

    getColor() {
      const sigmoid = (z) => {
        return 2 * Math.PI / (1 + Math.exp(-z + Math.PI));
      }
      const hue = (period, interval, t) => {

        // period += this.getHuePeriod()

        let maxF = (t) => maxHue;// + 0.5 * Math.sin(t);
        let minF = (t) => 0.5 * Math.sin(t);
        let incF = (t) => (maxHue / interval) * ((t + period) % interval);
        let decF = (t) => (maxHue / interval) * (interval - ((t + period) % interval));

        let isigF = (t) => incF(t);//incF(sigmoid(t))
        let dsigF = (t) => decF(t);//decF(sigmoid(t))

        let fArray = [
          [ maxF, isigF, minF ],
          [ dsigF, maxF, minF ],
          [ minF, maxF, isigF ],
          [ minF, dsigF, maxF ],
          [ isigF, minF, maxF ],
          [ maxF, minF, dsigF ]
        ];

        let i = Math.floor( (t + period) / interval) % numIntervals
        if (fArray[i] === undefined) {
          return null;
        }
        return fArray[i].map( (f, idx) => {
          let resultHue = Math.round(f(t))
          return resultHue;
        })
      };


      // let maxDepth = Math.PI * (1 + this.getHuePeriod());
      let maxDepth = Math.PI * 2;
      let interval = maxDepth / numIntervals;

      let complAngle = ((Math.PI * 2) - this.getDeltaTheta())

      let colors = hue((this.depth / this.periodDepthDivisor), interval, Math.abs(complAngle * this.tAngleMultiplier))


      let minDepth = (1.0 / this.depth) * (this.getDeltaTheta());
      minDepth = Math.max(1, minDepth);


      // Credit: Kamil Kiełczewski
      // https://stackoverflow.com/questions/8022885/rgb-to-hsv-color-in-javascript
      const rgb2hsv = (r,g,b) => {
        let v = Math.max(r, g, b), c = v - Math.min(r,g,b);
        let h = c && ((v == r) ? (g - b)/c : ((v==g) ? 2 + (b - r)/c : 4 +( r - g)/complAngle));
        return [60 * (h < 0 ? h + 6 : h), v && c/v, v];
        // return [60 * (h < 0 ? h + 6 : h), v && c/(30 * complAngle), v];
      }

      const hsv2rgb = (h,s,v) => {
        let f = (n, k=(n + h / 60) % 6) => v - v*s*Math.max( Math.min(k, 4 - k, 1), 0);
        return [f(5),f(3),f(1)];
      }

      let depth = this.depth



      let redShifted   = colors[0] + (Math.cos(minDepth)) / 2
      let greenShifted = colors[1] + (this.cosRef(minDepth)) / 2
      let blueShifted  = colors[2] + (this.sinRef(minDepth)) / 2

      colors = [redShifted, greenShifted, blueShifted]

      // Inkblot transformations

      let hsv = rgb2hsv(...colors)
      let sv = this.translateRef([hsv[1], hsv[2]])

      let inverseVal = sv[1]

      // Opposite frames invert colors

      // if (depth % 2 === 0) {
        // inverseVal = 1 - sv[1]
      // }
      let newCols = hsv2rgb(hsv[0], 1 - sv[0], inverseVal)

      colors = colors.flatMap((c, i) => maxHue - newCols[i])



      // return "rgb(" + (maxHue / this.sinRef(minDepth)) + "," + (maxHue / this.cosRef(minDepth + 2)) + "," + (maxHue / (minDepth)) + ")";
      return "rgba(" + colors[2] + "," + colors[0] + "," + colors[1] + ',' + (1 - complAngle) + ")";
    }

    sin(angle) {
      return this.sinRef(angle)
    }

    cos(angle) {
      return this.cosRef(angle)
    }

    tan(angle) {
      return this.tanRef(angle)
    }

    translateXY([x, y]) {
      return this.translateRef([x, y])
    }
    
    draw() {

      if (this.subFrame) {

        // Draw its subFrame

        let halfWidth = this.width / 2;
        let halfHeight = this.height / 2;

        let newWidthL = this.subFrame.radius * this.sin(this.theta );
        let newHeightL = this.subFrame.radius * this.cos(this.theta );

        let newWidthR = this.subFrame.radius * this.sin(Math.PI - 1 * (this.theta ));
        let newHeightR = this.subFrame.radius * this.cos(Math.PI - 1 * (this.theta ));

        
        let pointA = this.translateXY([ -1 * newWidthL, -1 * newHeightL])

        let pointB = this.translateXY([ 1 * newWidthR, newHeightR])

        let pointC = this.translateXY([ 1 * newWidthL, newHeightL])

        let pointD = this.translateXY([ -1 * newWidthR, -1 * newHeightR])


        let pointD_alt = [pointD[1] - pointC[1], pointD[0] - pointC[0]]

        let pointD_alt_between = [
          this.getSliderVal() * (pointD[0] - pointD_alt[0])
          this.getSliderVal() * (pointD[1] - pointD_alt[1]) ];

        // let pointD_alt2 = this.translateXY([0, -(newHeightL + newHeightR) / 2])


        // Trace 4 paths
        this.ctx.beginPath();

        this.ctx.moveTo(this.center[0] - pointA[0], this.center[1] - pointA[1]);

        this.ctx.lineTo(this.center[0] - pointB[0],this.center[1] -  pointB[1]);

        this.ctx.lineTo(this.center[0] - pointC[0],this.center[1] -  pointC[1]);

        // this.ctx.lineTo(this.center[0] - pointD[0],this.center[1] -  pointD[1]);
        this.ctx.lineTo(this.center[0] - pointD_alt_between[0],this.center[1] -  pointD_alt_between[1]);

        this.ctx.lineTo(this.center[0] - pointA[0],this.center[1] -  pointA[1]);

        const swapColors = (rgbStr) => {
          let vals = rgbStr.split(",");
          // let r = parseInt(vals[0].split("(")[1]);
          // let g = parseInt(vals[1]);
          // let b = parseInt(vals[2].replace(")", ""));
          // let rgb = [r, g, b]

          let r = parseInt(vals[0].split("(")[1]) * 1.1 * Math.PI / maxHue;
          let g = parseInt(vals[1]) * 1.1 * Math.PI / maxHue;
          let b = parseInt(vals[2].replace(")", "")) * 1.1 * Math.PI / maxHue;
          let rgb = [this.curveMultiplier * this.sinRef(r), this.curveMultiplier * this.sinRef(g), this.curveMultiplier * this.sinRef(b)]

          // let avg = (Math.abs(rgb[0]) + parseInt(vals[0].split("(")[1])) / 2
          // let avg2 = (Math.abs(rgb[1]) + parseInt(vals[1])) / 2
          // let avg3 = (Math.abs(rgb[2]) + parseInt(vals[2].replace(")", ""))) / 2

          // let i = rgb.indexOf(Math.max(...rgb));
          // if (i === 0) {
          //   // Rotate colors right
             let str = "rgb(" + Math.abs(rgb[1]) + "," + Math.abs(rgb[2]) + "," + Math.abs(rgb[0]) + ")";
             // console.log(str)
             return str
          // }
          // else if (i === 1) {
          //   // Rotate colors left
          //   return "rgb(" + g + "," + b + "," + r + ")";
          // }
          // Swap blue and red
          // return "rgb(" + b + ", " + g + ", " + r + ")";
        }

        var linearGradient1 = this.ctx.createLinearGradient(
          this.center[0] - pointA[0],
          this.center[1] - pointA[1],
          this.center[0] - pointC[0],
          this.center[1] - pointC[1]);


        let rgbStr = this.getColor();
        let rgbStr2 = swapColors(rgbStr);

        linearGradient1.addColorStop(0, swapColors(rgbStr2));
        linearGradient1.addColorStop(0.5, rgbStr);
        linearGradient1.addColorStop(1, rgbStr2)

        this.ctx.strokeStyle = linearGradient1;
        this.ctx.lineWidth = 2;

        if (this.parent){
          this.ctx.stroke();
        }
        this.subFrame.draw()

        this.depth = this.getDepth();
        this.reductionRate = this.getReductionRate();

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
            && between(mouse.x, this.x, this.y + this.length)
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
