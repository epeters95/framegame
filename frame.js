((root) => {
  var FrameTest = root.FrameTest = (root.FrameTest || {});

  const canvasHeight = 1080;
  const canvasWidth = 1920;

  const centerX = Math.floor(canvasWidth / 2);
  const centerY = Math.floor(canvasHeight / 2);


  class Display {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');

      this.frameWidth = canvasWidth / 2;
      this.frameHeight = canvasHeight / 2;

      this.theta = Math.tanh(this.frameWidth / this.frameHeight)


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
      this.showSliders = false;


      const sliderStart = 0;
      const sliderLength       = 860;
      const sliderX = centerX - Math.floor(sliderLength / 2);
      const sliderY = 0;
      const sliderHeight = 20;

      this.slider = new Slider(sliderX, sliderY, sliderStart, sliderLength)
      this.sizeSlider = new Slider(sliderX, sliderY + canvasHeight - (sliderHeight + 10), sliderStart, sliderLength)

      this.sliders = [this.slider, this.sizeSlider]

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

      const canvasPosition = {
        x: this.canvas.offsetLeft,
        y: this.canvas.offsetTop
      };

      // Add general click listeners for all sliders

      this.sliders.forEach((slider) => {

        const mouseDownCallback = (e) => {
          // mouse position relative to the browser window
          const mouse = { 
            x: e.pageX - canvasPosition.x,
            y: e.pageY - canvasPosition.y
          }

          const between = (a, b, c) => { return (a >= b && a <= c) };

          let x = slider.getPlace();
          if (!slider.held
              && between(mouse.x, slider.x, slider.y + slider.length)
              && between(mouse.y, slider.y, slider.y + slider.height)
          ) {
            slider.hold();
            slider.setPlace(mouse.x)
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
          slider.letgo();
        }
        this.canvas.addEventListener('mouseup', mouseUpCallback);
        this.canvas.addEventListener('touchend', mouseUpCallback);


        // Mouse Move / Touch move
        const mouseMoveCallback = (e) => {

          if (slider.held) {
            const mouse = {
              x: e.pageX - canvasPosition.x,
              y: e.pageY - canvasPosition.y
            }
            slider.leftWidth = mouse.x - slider.x;

            if (slider.x > sliderStart + sliderLength) {
              slider.x = sliderStart + sliderLength;
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

      })

      let radius = Math.hypot(canvasWidth / 2, canvasHeight / 2)

      this.frame = new Frame(
        this.canvas,
        [centerX, centerY],      // center
        canvasWidth,             // width
        canvasHeight,            // height
        radius,                  // radius
        this.theta,              // theta
        () => this.deltaTheta,   // deltaTheta
        () => this.shrinkFactor, // reductionRate
        () => this.depth )       // depth

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

      if (this.slider.held) {
        this.deltaTheta = Math.PI * 2 * this.slider.getRatio();
      }
      else if (this.holding) {
        this.deltaTheta = -Math.tanh(
          (centerY - this.mouseXY[1]) / (centerX - this.mouseXY[0])
        );
      }

      if (this.sizeSlider.held) {
        this.shrinkFactor = 0.93 +  0.3 * this.sizeSlider.getRatio();
      }
      else if (this.holding) {
        let diagonal = Math.hypot(canvasWidth / 2, canvasHeight / 2);
        let x = centerX - this.mouseXY[0];
        let y = centerY - this.mouseXY[1];
        let distRatio = Math.hypot(x, y) / diagonal;

        this.shrinkFactor = 0.9 + 0.3 * distRatio;
      }

      if (!this.slider.held && !this.sizeSlider.held && !this.holding) {
        this.deltaTheta = this.idleDelta;

        if (this.shrinkFactor >= 1 && this.shrinkInc < 0) {
          this.shrinkInc = this.shrinkInc * -1;
        }
        else if (this.shrinkFactor <= 0.8 && this.shrinkInc > 0) {
          this.shrinkInc = this.shrinkInc * -1
        }
        this.shrinkFactor -= this.shrinkInc;
      }

      this.frame.draw();
    }

    drawSlider(slider) {
      let widthL = slider.leftWidth;
      let widthR = slider.length - widthL;
      const sliderColor        = 'rgba(200,200,200,0.4)';
      //Left side
      this.ctx.beginPath();
      this.ctx.fillStyle = sliderColor;
      this.ctx.fillRect(slider.x, slider.y, widthL, slider.height);

      //Slider
      this.ctx.beginPath();
      this.ctx.moveTo(slider.x + widthL, slider.y - 2);
      this.ctx.lineTo(slider.x + widthL, slider.y + slider.height + 2);
      this.ctx.strokeStyle = 'yellow';
      this.ctx.stroke();

      //Right Side
      this.ctx.beginPath();
      this.ctx.fillStyle = sliderColor;
      this.ctx.fillRect(slider.x + widthL + 1, slider.y, widthR, slider.height);
    }


    start() {

      this.windowID = window.setInterval(this.step.bind(this), 30);
    }
    
    
    step() {
      
      this.draw();

      if (this.showSliders) {
        this.drawSlider(this.slider);
        this.drawSlider(this.sizeSlider);
      }
    }
  }

  class Frame {

    constructor(canvas, center, width, height, radius, theta, getDeltaTheta, getReductionRate, getDepth, parent=null) {
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

        let maxF = (t) => 255;// + 0.5 * Math.sin(t);
        let minF = (t) => 0.5 * Math.sin(t);
        let incF = (t) => (255 / interval) * ((t + period) % interval);
        let decF = (t) => (255 / interval) * (interval - ((t + period) % interval));

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

        let i = Math.floor( (t + period) / interval) % 6
        if (fArray[i] === undefined) {
          return null;
        }
        return fArray[i].map( (f, idx) => {
          let resultHue = Math.round(f(t))
          return resultHue;
        })
      };


      let maxDepth = Math.PI * 2;
      let interval = maxDepth / 6.0;

      let complAngle = ((Math.PI * 2) - this.getDeltaTheta())

      let colors = hue((this.depth / 10), interval, Math.abs(complAngle * 8))


      let minDepth = (1.0 / this.depth) * (this.getDeltaTheta());
      minDepth = Math.max(1, minDepth);


      // Credit: Kamil Kiełczewski
      // https://stackoverflow.com/questions/8022885/rgb-to-hsv-color-in-javascript
      const rgb2hsv = (r,g,b) => {
        let v = Math.max(r, g, b), c = v - Math.min(r,g,b);
        let h = c && ((v == r) ? (g - b)/c : ((v==g) ? 2 + (b - r)/c : 4 +( r - g)/c));
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

      if (depth % 2 === 0) {
        // inverseVal = 1 - sv[1]
      }
      let newCols = hsv2rgb(hsv[0], 1 - sv[0], inverseVal)

      colors = colors.flatMap((c, i) => newCols[i])



      // return "rgb(" + (255 / this.sinRef(minDepth)) + "," + (255 / this.cosRef(minDepth + 2)) + "," + (255 / (minDepth)) + ")";
      return "rgba(" + colors[0] + "," + colors[1] + "," + colors[2] + ',' + (1 - complAngle) + ")";
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

        // let pointCD = this.translateXY([0, -(newHeightL + newHeightR) / 2])

        // Trace 4 paths
        this.ctx.beginPath();

        this.ctx.moveTo(this.center[0] - pointA[0], this.center[1] - pointA[1]);

        this.ctx.lineTo(this.center[0] - pointB[0],this.center[1] -  pointB[1]);

        this.ctx.lineTo(this.center[0] - pointC[0],this.center[1] -  pointC[1]);

        // this.ctx.lineTo(this.center[0] - pointCD[0],this.center[1] -  pointCD[1]);

        this.ctx.lineTo(this.center[0] - pointD[0],this.center[1] -  pointD[1]);

        this.ctx.lineTo(this.center[0] - pointA[0],this.center[1] -  pointA[1]);

        const swapColors = (rgbStr) => {
          let vals = rgbStr.split(",");
          // let r = parseInt(vals[0].split("(")[1]);
          // let g = parseInt(vals[1]);
          // let b = parseInt(vals[2].replace(")", ""));
          // let rgb = [r, g, b]

          let r = parseInt(vals[0].split("(")[1]) * 1.1 * Math.PI / 255;
          let g = parseInt(vals[1]) * 1.1 * Math.PI / 255;
          let b = parseInt(vals[2].replace(")", "")) * 1.1 * Math.PI / 255;
          let rgb = [120 * this.sinRef(r), 120* this.sinRef(g),120* this.sinRef(b)]

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
        this.ctx.stroke();

        this.subFrame.draw()

        this.depth = this.getDepth();
        this.reductionRate = this.getReductionRate();

      }
    }

  }



  class Slider {

    constructor(x, y, leftWidth, length) {
      this.x = x;
      this.y = y;
      this.leftWidth = leftWidth;
      this.length = length;
      this.held = false;
      this.height = 20;
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

  }

  FrameTest.Display = Display;
  
  var canvas = document.getElementsByTagName("canvas")[0];
  new FrameTest.Display(canvas).start();

})(this);
