((root) => {
  var FrameTest = root.FrameTest = (root.FrameTest || {});

  const canvasHeight = 600;
  const canvasWidth = 1200;

  const centerX = Math.floor(canvasWidth / 2);

  class Display {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');

      this.frameWidth = canvasWidth / 2;
      this.frameHeight = canvasHeight / 2;

      this.deltaTheta = Math.arctan(this.frameWidth / this.frameHeight)


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
      this.windowID = window.setInterval(this.step.bind(this), 30);
    }
    
    
    step() {
      

      this.draw();
      
      // this.drawFrames();
    }
  }

  class Frame {

    constructor(width, height, theta, deltaTheta, ) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');

      this.frameWidth = canvasWidth / 2;
      this.frameHeight = canvasHeight / 2;

      this.thickness = 2;

      this.bgColor = "black";
      this.fgColor = "white";

    }

    
    draw() {

      let marginX = this.frameWidth / 4;
      let marginY = this.frameHeight / 4;
      
      this.ctx.fillStyle = this.fgColor;
      this.ctx.fillRect(
        marginX,
        marginY,
        marginX + this.frameWidth,
        marginY + this.frameHeight);

      this.ctx.fillStyle = this.bgColor;
      this.ctx.fillRect(
        marginX + this.thickness,
        marginY + this.thickness,
        marginX + this.frameWidth - (this.thickness * 2),
        marginY + this.frameHeight - (this.thickness * 2));

      this.ctx.beginPath();
      this.ctx.moveTo(marginX, marginY);
      this.ctx.lineTo(slider.x + widthL, slider.y + sliderHeight + 2);
      this.ctx.strokeStyle = 'yellow';
      this.ctx.stroke();
    }

  }

  FrameTest.Frame = Frame;
  
  var canvas = document.getElementsByTagName("canvas")[0];
  new FrameTest.Frame(canvas).start();

})(this);
