((root) => {
  var FrameTest = root.FrameTest = (root.FrameTest || {});

  const maxHue = 255;
  const numIntervals = 6;

  const rgbaStr = (r,g,b,a=1) => "rgba("+ r +","+ g +","+ b +','+ a +")";

  class Frame {

    constructor(canvas,
      center,
      width,
      height,
      radius,
      theta,
      getDeltaTheta,
      getReductionRate,
      getDepth,
      getHuePeriod,
      getPointDPosition,
      getConfigFunctions,
      parent=null) {

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
      this.getHuePeriod = getHuePeriod;
      this.getPointDPosition = getPointDPosition;

      this.getConfigFunctions = getConfigFunctions;
      this.parent = parent;

      this.periodDepthDivisor = 10;
      this.tAngleMultiplier = 8;
      this.curveMultiplier = 120;

      this.getDepth = getDepth;
      this.depth = getDepth();

      this.bgColor = "black";
      this.fgColor = "white";

      this.customFactor = 0.1;

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
          getHuePeriod,
          getPointDPosition,
          getConfigFunctions,
          this
          )
      }
      
      this.color = this.getColor()

    }
    // Credit: Kamil Kiełczewski
    // https://stackoverflow.com/questions/8022885/rgb-to-hsv-color-in-javascript

    rgb2hsv(r,g,b) {
      let complAngle = ((Math.PI * 2) - this.getDeltaTheta())

      let v = Math.max(r, g, b), c = v - Math.min(r,g,b);
      let h = c && ((v == r) ? (g - b)/c : ((v==g) ? 2 + (b - r)/c : 4 +( r - g)/complAngle));
      
      if (this.getConfigFunctions().modifyHsv()) {
        return [60 * (h < 0 ? h + 6 : h), v && c/(30 * complAngle), v];
      } else {
        return [60 * (h < 0 ? h + 6 : h), v && c/v, v];
      }
    }

    hsv2rgb(h,s,v) {
      let f = (n, k=(n + h / 60) % 6) => v - v*s*Math.max( Math.min(k, 4 - k, 1), 0);
      return [f(5),f(3),f(1)];
    }

    getColor() {
      const sigmoid = (z) => {
        return 2 * Math.PI / (1 + Math.exp(-z + Math.PI));
      }
      const hue = (period, interval, t) => {

        // Add custom function of hue period multiplied by reduction factor
        // if (typeof(this.configFunctions.customMath) === 'function') {
        //   let factor = this.customFactor * this.configFunctions.customMath(this.getHuePeriod());
        //   period += factor;
        // }
        period += this.getHuePeriod()

        let maxF = (t) => maxHue;// + 0.5 * Math.sin(t);
        let minF = (t) => 0.5 * Math.sin(t);
        let incF = (t) => (maxHue / interval) * ((t + period) % interval);
        let decF = (t) => (maxHue / interval) * (interval - ((t + period) % interval));

        let isigF = (t) => incF(t);
        let dsigF = (t) => decF(t);


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

        let customFactor = this.customFactor;
        let customMath = this.getConfigFunctions().customMath;
        return fArray[i].map( (f, idx) => {
          let v = f(t)
          if (typeof(customMath) === 'function') {
            v += customFactor * customMath(v);
          }
          let resultHue = Math.round( Math.max(0, Math.min(255, v)))
          return resultHue;
        })
      };


      let maxDepth = Math.PI * 2;
      let interval = maxDepth / numIntervals;

      let complAngle = ((Math.PI * 2) - this.getDeltaTheta())

      let colors = hue((this.depth / this.periodDepthDivisor), interval, Math.abs(complAngle * this.tAngleMultiplier))


      let minDepth = (1.0 / this.depth) * (this.getDeltaTheta());
      minDepth = Math.max(1, minDepth);

      let depth = this.depth

      let redShifted   = colors[0] + (Math.cos(minDepth)) / 2
      let greenShifted = colors[1] + (this.cosRef(minDepth)) / 2
      let blueShifted  = colors[2] + (this.sinRef(minDepth)) / 2

      colors = [redShifted, greenShifted, blueShifted]

      // Inkblot transformations

      let hsv = this.rgb2hsv(...colors)
      let sv = this.translateRef([hsv[1], hsv[2]])

      let inverseVal = sv[1]
      let satVal = 1 - sv[0]

      if (this.getConfigFunctions().useInvert()) {
        inverseVal = 1 - inverseVal;
      }

      // Opposite frames invert colors

      if (this.getConfigFunctions().useStrange()) {
        
        if (depth % 2 === 0) {
          satVal = (this.cos(Math.PI * hsv[0] / 20) + satVal) / 2
        } else {
          satVal = (this.cos(Math.PI * sv[1] / 20) + satVal) / 2
        }

      }

      let newCols = this.hsv2rgb(hsv[0], satVal, inverseVal)

      colors = colors.flatMap((c, i) => maxHue - newCols[i])

      return [colors[2], colors[0], colors[1], 1 - complAngle];
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
          pointD[0] - this.getPointDPosition() * pointD_alt[0],
          pointD[1] - this.getPointDPosition() * pointD_alt[1] ];

        // let pointD_alt2 = this.translateXY([0, -(newHeightL + newHeightR) / 2])

        // Trace 4 paths
        this.ctx.beginPath();

        this.ctx.moveTo(this.center[0] - pointA[0], this.center[1] - pointA[1]);

        this.ctx.lineTo(this.center[0] - pointB[0],this.center[1] -  pointB[1]);

        this.ctx.lineTo(this.center[0] - pointC[0],this.center[1] -  pointC[1]);

        // this.ctx.lineTo(this.center[0] - pointD[0],this.center[1] -  pointD[1]);
        this.ctx.lineTo(this.center[0] - pointD_alt_between[0],this.center[1] -  pointD_alt_between[1]);

        this.ctx.lineTo(this.center[0] - pointA[0],this.center[1] -  pointA[1]);

        const swapColors = (r, g, b, a=1) => {

          r = r * 1.1 * Math.PI / maxHue;
          g = g * 1.1 * Math.PI / maxHue;
          b = b * 1.1 * Math.PI / maxHue;
          let rgb = [this.curveMultiplier * this.sinRef(r), this.curveMultiplier * this.sinRef(g), this.curveMultiplier * this.sinRef(b)]

          // let avg = (Math.abs(rgb[0]) + parseInt(vals[0].split("(")[1])) / 2
          // let avg2 = (Math.abs(rgb[1]) + parseInt(vals[1])) / 2
          // let avg3 = (Math.abs(rgb[2]) + parseInt(vals[2].replace(")", ""))) / 2

          // let i = rgb.indexOf(Math.max(...rgb));
          // if (i === 0) {
          //   // Rotate colors right
             // let str = "rgb(" + Math.abs(rgb[1]) + "," + Math.abs(rgb[2]) + "," + Math.abs(rgb[0]) + ")";
             // console.log(str)
             // return str
          // }
          // else if (i === 1) {
          //   // Rotate colors left
          //   return "rgb(" + g + "," + b + "," + r + ")";
          // }
          // Swap blue and red
          // return "rgb(" + b + ", " + g + ", " + r + ")";

          return [Math.abs(rgb[1]), Math.abs(rgb[2]), Math.abs(rgb[0]), Math.abs(a)];
        }

        var linearGradient1 = this.ctx.createLinearGradient(
          this.center[0] - pointA[0],
          this.center[1] - pointA[1],
          this.center[0] - pointC[0],
          this.center[1] - pointC[1]);


        let colors = this.getColor();


        let apoint = [...colors];
        let midpoint = swapColors(...colors);
        let bpoint = [...colors];

        let alpha = Math.max(0, midpoint[3]) / 8

        if (this.getConfigFunctions().colorSwap()) {
          apoint = swapColors(...midpoint);
          bpoint = midpoint;
          midpoint = [...colors];
        }

        if (this.getConfigFunctions().shadowMode()) {

          alpha = midpoint.pop() // remove alpha
          midpoint = midpoint.flatMap((c, i) => maxHue - midpoint[i])

          let hsv = this.rgb2hsv(...midpoint)

          let shadow = this.sinRef(Math.PI * hsv[2] / 0.2);


          midpoint = this.hsv2rgb(hsv[0], hsv[1], shadow)

          if (this.getConfigFunctions().useAlphas()) {
            midpoint.push(alpha);
          }
        }
        else {

          
          if (this.getConfigFunctions().useAlphas()) {
            midpoint[3] = alpha;
          }
        }

        linearGradient1.addColorStop(0, rgbaStr(...apoint));
        linearGradient1.addColorStop(0.5, rgbaStr(...midpoint));
        linearGradient1.addColorStop(1, rgbaStr(...bpoint));

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

  FrameTest.Frame = Frame;

})(this);
