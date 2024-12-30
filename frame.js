((root) => {
  var FrameTest = root.FrameTest = (root.FrameTest || {});

  const canvasHeight = 600;
  const canvasWidth = 1200;

  const centerX = Math.floor(canvasWidth / 2);
  const centerY = Math.floor(canvasHeight / 2);


  class Display {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');

      this.frameWidth = canvasWidth / 2;
      this.frameHeight = canvasHeight / 2;

      this.theta = Math.tanh(this.frameWidth / this.frameHeight)


      this.shrinkFactor = 0.9;
      this.deltaTheta = 0;
      this.depth = 10;

      this.bgColor = "black";
      this.fgColor = "white";


      const sliderStart = 0;
      const sliderLength       = 500;
      const sliderHeight       = 20;
      const sliderX = centerX - Math.floor(sliderLength / 2);
      const sliderY = 0;

      this.slider = new Slider(sliderX, sliderY, sliderStart, sliderLength)

      const canvasPosition = {
        x: this.canvas.offsetLeft,
        y: this.canvas.offsetTop
      };
          let slider = this.slider

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
        // slidersArray.forEach( (slider) => {
          this.slider.letgo();
        // });
      }
      this.canvas.addEventListener('mouseup', mouseUpCallback);
      this.canvas.addEventListener('touchend', mouseUpCallback);


      // Mouse Move / Touch move

      const mouseMoveCallback = (e) => {
        // slidersArray.forEach( (slider) => {
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
        // });
      }
      this.canvas.addEventListener('mousemove', mouseMoveCallback);
      this.canvas.addEventListener('touchmove', (e) => {
  
        this.canvas.dispatchEvent(new MouseEvent('mousemove', {
          clientX: e.touches[0].clientX,
          clientY: e.touches[0].clientY
        }));

      });

      let radius = Math.hypot(canvasWidth / 2, canvasHeight / 2)

      this.frame = new Frame(
        this.canvas,
        [centerX, centerY], // center
        canvasWidth,    // width
        canvasHeight,   // height
        radius,             // radius
        this.theta,         // theta
        () => this.deltaTheta,                  // deltaTheta
        this.shrinkFactor,
        this.depth )

      this.reset();
    }

    reset() {

      window.clearInterval(this.endID);
    }

    draw() {
      // Fill background
      this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      this.ctx.fillStyle = this.bgColor;
      this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      if (this.slider.held) {
        this.deltaTheta = Math.PI * 2 * this.slider.getRatio();
      }

      this.frame.draw();
    }

    drawSlider(slider) {
      let widthL = slider.leftWidth;
      let widthR = slider.length - widthL;
      let sliderHeight = 20;
      const sliderColor        = 'rgba(200,200,200,0.4)';
      //Left side
      this.ctx.beginPath();
      this.ctx.fillStyle = sliderColor;
      this.ctx.fillRect(slider.x, slider.y, widthL, sliderHeight);

      //Slider
      this.ctx.beginPath();
      this.ctx.moveTo(slider.x + widthL, slider.y - 2);
      this.ctx.lineTo(slider.x + widthL, slider.y + sliderHeight + 2);
      this.ctx.strokeStyle = 'yellow';
      this.ctx.stroke();

      //Right Side
      this.ctx.beginPath();
      this.ctx.fillStyle = sliderColor;
      this.ctx.fillRect(slider.x + widthL + 1, slider.y, widthR, sliderHeight);
    }


    start() {

      this.windowID = window.setInterval(this.step.bind(this), 30);
    }
    
    
    step() {
      

      this.draw();
      this.drawSlider(this.slider);
      
      // this.drawFrames();
    }
  }

  class Frame {

    constructor(canvas, center, width, height, radius, theta, getDeltaTheta, reductionRate, depth, parent=null) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');

      this.center = center;
      this.width = width;
      this.height = height;
      this.radius = radius;
      this.theta = theta;
      this.getDeltaTheta = getDeltaTheta
      this.reductionRate = reductionRate;

      this.bgColor = "black";
      this.fgColor = "white";

      if (parent === null) {

        this.sinRef = Math.sin;
        this.cosRef = Math.cos;
        this.translateRef = (arr) => arr;

      } else {

        this.sinRef = (angle) => parent.sin(angle + this.getDeltaTheta())
        this.cosRef = (angle) => parent.cos(angle + this.getDeltaTheta())

        this.translateRef = ([x, y]) => {
          let marginX = width * (1 - reductionRate) / 2
          let marginY = height * (1 - reductionRate) / 2

          return parent.translateXY(
            [
              reductionRate * x,
              reductionRate * y
            ]
          );
        }
      }

      if (depth > 0) {
        this.subFrame = new Frame(
          canvas,
          center,
          width * reductionRate,
          height * reductionRate,
          radius * reductionRate,
          theta,
          getDeltaTheta,
          reductionRate,
          depth - 1,
          this
          )
      }
    }

    sin(angle) {
      return this.sinRef(angle)
    }

    cos(angle) {
      return this.cosRef(angle)
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

        // Trace 4 paths
        this.ctx.beginPath();

        this.ctx.moveTo(this.center[0] - pointA[0], this.center[1] - pointA[1]);

        this.ctx.lineTo(this.center[0] - pointB[0],this.center[1] -  pointB[1]);

        this.ctx.lineTo(this.center[0] - pointC[0],this.center[1] -  pointC[1]);

        this.ctx.lineTo(this.center[0] - pointD[0],this.center[1] -  pointD[1]);

        this.ctx.lineTo(this.center[0] - pointA[0],this.center[1] -  pointA[1]);

        this.ctx.strokeStyle = 'white';
        this.ctx.stroke();

        this.subFrame.draw()

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
