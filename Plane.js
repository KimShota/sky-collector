// ------------------------------
// Plane Class
// ------------------------------
class Plane {
  constructor() {
    this.x = 100;
    this.y = height / 2;
    this.size = 120;
    this.speed = 5;
    this.skin = 0;
  }

  update(moveUp, moveDown) {
    if (moveUp) this.y -= this.speed;
    if (moveDown) this.y += this.speed;

    this.y = constrain(this.y, this.size / 2, height - this.size / 2);
  }

  draw() {
    push();
    translate(this.x, this.y);
    scale(getScale());
    
    // Design based on skin
    this.drawSkin();
    
    pop();
  }

  drawSkin() {
    // Draw sprite image if available
    if (airplaneSkins.length > 0 && this.skin >= 0 && this.skin < airplaneSkins.length) {
      let skinImg = airplaneSkins[this.skin];
      if (skinImg) {
        imageMode(CENTER);
        let targetSize = this.size; 
        let scaleFactor = (targetSize * 0.8) / max(skinImg.width, skinImg.height);
        image(skinImg, 0, 0, skinImg.width * scaleFactor, skinImg.height * scaleFactor);
        return;
      }
    }
    
    // Fallback to default drawing if sprite not available
    let sw = 2 / getScale();
    fill(255, 200, 0);
    stroke(0);
    strokeWeight(sw);
    triangle(-15, 0, 20, 0, 10, -5);
    rect(-10, -5, 25, 10);
    fill(200, 200, 255);
    triangle(-5, -5, -5, -20, 5, -5);
    triangle(-5, 5, -5, 20, 5, 5);
  }

  setSkin(skinIndex) {
    this.skin = skinIndex;
  }

  reset() {
    this.x = 100;
    this.y = height / 2;
  }

  collidesWith(obj) {
    let d = dist(this.x, this.y, obj.x, obj.y);
    return d < (this.size / 2 + obj.size / 2);
  }
}

