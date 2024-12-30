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


      this.shrinkFactor = 0.7;
      this.depth = 6;

      this.bgColor = "black";
      this.fgColor = "white";

      let radius = Math.hypot(canvasWidth / 2, canvasHeight / 2)

      this.frame = new Frame(
        this.ctx,
        [centerX, centerY], // center
        canvasWidth,    // width
        canvasHeight,   // height
        radius,             // radius
        this.theta,         // theta
        0.2,                  // deltaTheta
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

      this.frame.draw();
    }


    start() {

      this.windowID = window.setInterval(this.step.bind(this), 30);
    }
    
    
    step() {
      

      this.draw();
      
      // this.drawFrames();
    }
  }

  class Frame {

    constructor(ctx, center, width, height, radius, theta, deltaTheta, reductionRate, depth, parent=null) {
      this.ctx = ctx;

      this.center = center;
      this.width = width;
      this.height = height;
      this.radius = radius;
      this.theta = theta;
      this.deltaTheta = deltaTheta;
      this.reductionRate = reductionRate;

      this.bgColor = "black";
      this.fgColor = "white";

      if (parent === null) {

        this.sinRef = Math.sin;
        this.cosRef = Math.cos;
        this.translateRef = (arr) => arr;

      } else {

        this.sinRef = (angle) => parent.sin(angle + this.deltaTheta)
        this.cosRef = (angle) => parent.cos(angle + this.deltaTheta)

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
          ctx,
          center,
          width * reductionRate,
          height * reductionRate,
          radius * reductionRate,
          theta,
          deltaTheta,
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

        let newWidthL = this.subFrame.radius * this.sin(this.subFrame.theta);
        let newHeightL = this.subFrame.radius * this.cos(this.subFrame.theta);

        let newWidthR = this.subFrame.radius * this.sin(Math.PI - 1 * (this.subFrame.theta));
        let newHeightR = this.subFrame.radius * this.cos(Math.PI - 1 * (this.subFrame.theta));

        
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

  FrameTest.Display = Display;
  
  var canvas = document.getElementsByTagName("canvas")[0];
  new FrameTest.Display(canvas).start();

})(this);
