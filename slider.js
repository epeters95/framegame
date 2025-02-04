((root) => {

  var FrameTest = root.FrameTest = (root.FrameTest || {});

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

  FrameTest.Slider = Slider;

})(this);