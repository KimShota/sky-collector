class Bomb {
  constructor() {
    this.x = width + 20; // appears outside of the canvas first 
    this.y = random(50, height - 50); // random y position 
    this.size = 30;
    this.speed = 5;
  }

  update() {
    // if the user is pressing the button, multiply its speed by 2. otherwise, 1
    let speedMultiplier = boostEnergy > 0 && (keyIsDown(32) || buttonPressed) ? 2 : 1;
    this.x -= this.speed * difficulty * speedMultiplier;
  }

  draw() {
    // save the current drawing state 
    push();
    translate(this.x, this.y);
    scale(getScale());

    // draw darker outer shell 
    fill(40, 40, 40);
    stroke(0);
    strokeWeight(2 / getScale());
    circle(0, 0, this.size);

    // draw red center 
    fill(255, 0, 0);
    noStroke();
    circle(0, 0, this.size * 0.6);

    // draw the fuse 
    stroke(100, 50, 0);
    strokeWeight(3 / getScale());
    line(0, -this.size / 2, 5, -this.size / 2 - 10);

    // draw the spark 
    fill(255, 200, 0);
    noStroke();
    circle(5, -this.size / 2 - 10, 5);

    pop();
  }

  offScreen() {
    return this.x < -50;
  }
}

