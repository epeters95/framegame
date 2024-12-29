((root) => {
  var FrameTest = root.FrameTest = (root.FrameTest || {});

  const canvasHeight = 600;
  const canvasWidth = 1200;

  const centerX = Math.floor(canvasWidth / 2);
  const centerY = Math.floor(canvasWidth / 2);


  class Display {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');

      this.frameWidth = canvasWidth / 2;
      this.frameHeight = canvasHeight / 2;

      this.theta = Math.arctan(this.frameWidth / this.frameHeight)


      this.shrinkFactor = 0.8;
      this.depth = 5;

      this.bgColor = "black";
      this.fgColor = "white";

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
    }


    start() {
      let radius = Math.hypot(canvasWidth / 2, canvasHeight / 2)

      var frame = new Frame(
        this.ctx,
        [centerX, centerY], // center
        canvasWidth / 2,    // width
        canvasHeight / 2,   // height
        radius,             // radius
        this.theta,         // theta
        0,                  // deltaTheta
        this.shrinkFactor,
        this.depth )

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

      this.frameWidth = width;
      this.frameHeight = height;
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

        this.sinRef = (angle) => parent.sin(angle + this.theta)
        this.cosRef = (angle) => parent.cos(angle + this.theta)

        let that = this;

        this.translateRef = ([x, y]) => {
          let marginX = that.width * (1 - that.reductionRate) / 2
          let marginY = that.height * (1 - that.reductionRate) / 2

          return that.parent.translateXY(
            [
              x * that.reductionRate + marginX,
              y * that.reductionRate + marginY
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
          deltaTheta
          depth - 1,
          this
          )
      }
    }

    sin() {
      return this.sinRef()
    }

    cos() {
      return this.cosRef()
    }

    translateXY([x, y]) {
      return this.translateRef([x, y])
    }
    
    draw() {

      if (this.subframe) {

        // Draw its subframe

        let newWidth = this.subframe.radius * sin(this.theta + this.deltaTheta);
        let newHeight = this.subframe.radius * cos(this.theta + this.deltaTheta);

        let deltaX = (this.width / 2) - newWidth;
        let deltaY = (this.height / 2) - newHeight;

        // this.ctx.beginPath();
        // this.ctx.moveTo( , );
        // this.ctx.lineTo( , );
        // this.ctx.strokeStyle = 'white';
        // this.ctx.stroke();
      }
    }



  }

  FrameTest.Frame = Frame;
  
  var canvas = document.getElementsByTagName("canvas")[0];
  new FrameTest.Frame(canvas).start();

})(this);
