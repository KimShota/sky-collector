class Plane {
  constructor() {
    // always start at x = 100
    this.x = 100;
    this.y = height / 2;
    this.size = 120;
    // set the speed of the plane
    this.speed = 12;
    // skin to use 
    this.skin = 0;
  }

  update(moveUp, moveDown) {
    // moves the plane up
    if (moveUp) this.y -= this.speed;
    // move the plane down
    if (moveDown) this.y += this.speed;

    // ensure that the plane never leaves the canvas
    this.y = constrain(this.y, this.size / 2, height - this.size / 2);
  }

  draw() {
    // draw airplane on x and y
    push();
    translate(this.x, this.y);
    scale(getScale());
    this.drawSkin();
    pop();
  }

  drawSkin() {
    // if the user already has the skin collected 
    if (airplaneSkins.length > 0 && this.skin >= 0 && this.skin < airplaneSkins.length) {
      let skinImg = airplaneSkins[this.skin];
      if (skinImg) {
        imageMode(CENTER);
        let targetSize = this.size; 
        // calculate the scaleFactor so that the sprite fits inside the plane size
        let scaleFactor = (targetSize * 0.8) / max(skinImg.width, skinImg.height);
        // draw the skin
        image(skinImg, 0, 0, skinImg.width * scaleFactor, skinImg.height * scaleFactor);
        return;
      }
    }
    
    // always use the first skin if the user does not have any skins collected yet
    if (airplaneSkins.length > 0 && airplaneSkins[0]) {
      let fallbackImg = airplaneSkins[0];
      imageMode(CENTER);
      let targetSize = this.size; 
      let scaleFactor = (targetSize * 0.8) / max(fallbackImg.width, fallbackImg.height);
      image(fallbackImg, 0, 0, fallbackImg.width * scaleFactor, fallbackImg.height * scaleFactor);
    }
  }

  setSkin(skinIndex) {
    this.skin = skinIndex;
  }

  // reset the plane position after the game ends 
  reset() {
    this.x = 100;
    this.y = height / 2;
  }

  // collision detection 
  collidesWith(obj) {
    // calculate the distance between the plane and the object
    let d = dist(this.x, this.y, obj.x, obj.y);
    // consider it as collision if the distance is less than the sum of half plane and half object
    return d < (this.size / 2 + obj.size / 2);
  }
}

