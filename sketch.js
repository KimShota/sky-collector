let gameState = "LANDING"; // LANDING, INSTRUCTIONS, START, PLAYING, GAMEOVER
let plane;
let stars = [];
let bombs = [];
let score = 0;
let hearts = 3;
let starTimer = 0;
let bombTimer = 0;
let boostEnergy = 100; 
let boostRecoveryRate = 0.15;
let boostDrainRate = 1.5;
let difficulty = 1;
let difficultyTimer = 0;
let hearts_items = [];
let heartSpawnTimer = 0;
let playerName = "";
let currentSkin = 0;
let clouds = [];
let nameInput;
let leaderboard = [];
let showLeaderboard = false;
let buttonPressed = false;
let selectedMode = ""; // "collection" or "story"
let collectionButton, storyButton;
let leaderboardButton;
let lastUnlockedSkinCount = 1; // Track last unlocked skin count for animation
let unlockAnimation = null; // Animation object for skin unlock
let newlyUnlockedSkins = []; // Track newly unlocked skins that need to be selected
let skinChangeAllowed = false; // Only allow skin change when new skin is unlocked and selected
let highestScore = 0; // Track highest score for skin unlocking


// Serial communication for accelerometer
let port;
let connectButton;
let baudrate = 9600;
let sensorValue = 337; // Default center value (675/2 ≈ 337)
let useSensor = false;

// Base dimensions for responsive scaling
const BASE_WIDTH = 800;
const BASE_HEIGHT = 600;

// variables for sprites 
let spritesheet;
let sprites = []; // 2D array for all sprites
let airplaneSkins = []; // Array of selected airplane skin images
let unlockedSkins = [0]; // Array of unlocked skin indices (0 is always unlocked)
let showSkinSelection = false; // Flag to show/hide skin selection UI 

// Background music variables
let bgMusicMenu; // studio_ghibli.mp3 for non-playing modes
let bgMusicPlaying; // spirited_away1.mp3 for playing mode
let previousGameState = "";
let isFadingOut = false;
let isFadingIn = false;
let fadeSpeed = 0.02;
let targetVolume = 0.5; // Volume level (0.0 to 1.0)

function preload(){
  spritesheet = loadImage("planes.png");
  bgMusicMenu = loadSound("studio_ghibli.mp3");
  bgMusicPlaying = loadSound("spirited_away1.mp3");
}

// ------------------------------
// Cloud Class
// ------------------------------
class Cloud {
  constructor() {
    this.x = random(width);
    this.y = random(height * 0.3, height * 0.7);
    this.size = random(60, 120);
    this.speed = random(0.3, 0.8);
  }

  update() {
    this.x -= this.speed;
    if (this.x < -this.size) {
      this.x = width + this.size;
      this.y = random(height * 0.3, height * 0.7);
    }
  }

  draw() {
    push();
    translate(this.x, this.y);
    scale(getScale());
    fill(255, 255, 255, 200);
    noStroke();
    
    // Soft cloud shape
    ellipse(0, 0, this.size, this.size * 0.6);
    ellipse(-this.size * 0.3, 0, this.size * 0.7, this.size * 0.5);
    ellipse(this.size * 0.3, 0, this.size * 0.7, this.size * 0.5);
    ellipse(0, -this.size * 0.2, this.size * 0.6, this.size * 0.4);
    
    pop();
  }
}

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

// ------------------------------
// Star Class
// ------------------------------
class Star {
  constructor() {
    this.x = width + 20;
    this.y = random(50, height - 50);
    this.size = 25;
    this.speed = 3;
    this.rotation = 0;
  }

  update() {
    let speedMultiplier = boostEnergy > 0 && (keyIsDown(32) || buttonPressed) ? 2 : 1;
    this.x -= this.speed * difficulty * speedMultiplier;
    this.rotation += 0.05;
  }

  draw() {
    push();
    translate(this.x, this.y);
    scale(getScale());
    rotate(this.rotation);
    fill(255, 255, 0);
    stroke(255, 200, 0);
    strokeWeight(2 / getScale());

    beginShape();
    for (let i = 0; i < 5; i++) {
      let angle = TWO_PI / 5 * i - HALF_PI;
      vertex(cos(angle) * this.size, sin(angle) * this.size);

      angle = TWO_PI / 5 * (i + 0.5) - HALF_PI;
      vertex(cos(angle) * this.size * 0.5, sin(angle) * this.size * 0.5);
    }
    endShape(CLOSE);

    pop();
  }

  offScreen() {
    return this.x < -50;
  }
}

// ------------------------------
// Bomb Class
// ------------------------------
class Bomb {
  constructor() {
    this.x = width + 20;
    this.y = random(50, height - 50);
    this.size = 30;
    this.speed = 3;
  }

  update() {
    let speedMultiplier = boostEnergy > 0 && (keyIsDown(32) || buttonPressed) ? 2 : 1;
    this.x -= this.speed * difficulty * speedMultiplier;
  }

  draw() {
    push();
    translate(this.x, this.y);
    scale(getScale());

    fill(40, 40, 40);
    stroke(0);
    strokeWeight(2 / getScale());
    circle(0, 0, this.size);

    fill(255, 0, 0);
    noStroke();
    circle(0, 0, this.size * 0.6);

    stroke(100, 50, 0);
    strokeWeight(3 / getScale());
    line(0, -this.size / 2, 5, -this.size / 2 - 10);

    fill(255, 200, 0);
    noStroke();
    circle(5, -this.size / 2 - 10, 5);

    pop();
  }

  offScreen() {
    return this.x < -50;
  }
}

// ------------------------------
// HeartItem Class
// ------------------------------
class HeartItem {
  constructor() {
    this.x = width + 20;
    this.y = random(50, height - 50);
    this.size = 25;
    this.speed = 3;
    this.pulse = 0;
  }

  update() {
    let speedMultiplier = boostEnergy > 0 && (keyIsDown(32) || buttonPressed) ? 2 : 1;
    this.x -= this.speed * difficulty * speedMultiplier;
    this.pulse += 0.1;
  }

  draw() {
    push();
    translate(this.x, this.y);
    scale(getScale());
    let pulseSize = this.size + sin(this.pulse) * 3;

    fill(255, 100, 150);
    stroke(255, 0, 100);
    strokeWeight(2 / getScale());
    beginShape();
    vertex(0, pulseSize * 0.3);
    bezierVertex(-pulseSize * 0.5, -pulseSize * 0.3, -pulseSize * 0.8, 0, 0, pulseSize * 0.8);
    bezierVertex(pulseSize * 0.8, 0, pulseSize * 0.5, -pulseSize * 0.3, 0, pulseSize * 0.3);
    endShape(CLOSE);

    pop();
  }

  offScreen() {
    return this.x < -50;
  }
}

// ------------------------------
// Control Input
// ------------------------------
function updateControls() {
  let moveUp = false;
  let moveDown = false;
  let boosting = keyIsDown(32) || buttonPressed;
  
  if (useSensor && port && port.opened()) {
    // Use accelerometer sensor value (0-675) to control plane
    // Map sensor value to screen height
    // Sensor center (337.5) = screen center
    let sensorCenter = 337.5;
    let targetY = map(sensorValue, 270, 390, plane.size / 2, height - plane.size / 2);
    let currentY = plane.y;
    let diff = targetY - currentY;
    
    // Smooth movement with threshold (adjust threshold for responsiveness)
    let threshold = 3;
    if (abs(diff) > threshold) {
      if (diff > 0) {
        moveDown = true;
      } else {
        moveUp = true;
      }
    }
  } else {
    // Fallback to keyboard controls
    moveUp = keyIsDown(UP_ARROW) || keyIsDown(87);
    moveDown = keyIsDown(DOWN_ARROW) || keyIsDown(83);
  }
  
  return { moveUp, moveDown, boosting };
}

// ------------------------------
// Responsive Scaling Functions
// ------------------------------
function getScale() {
  return min(width / BASE_WIDTH, height / BASE_HEIGHT);
}

function scaleSize(size) {
  return size * getScale();
}

function scaleX(x) {
  return x * (width / BASE_WIDTH);
}

function scaleY(y) {
  return y * (height / BASE_HEIGHT);
}

// ------------------------------
// Button Position Update
// ------------------------------
function updateButtonPositions() {
  if (!collectionButton || !storyButton) return;
  
  let canvas = document.querySelector('canvas');
  let centerX, centerY;
  if (canvas) {
    let rect = canvas.getBoundingClientRect();
    centerX = rect.left + rect.width / 2;
    centerY = rect.top + rect.height / 2;
  } else {
    // Fallback to window center
    centerX = windowWidth / 2;
    centerY = windowHeight / 2;
  }
  
  let buttonWidth = scaleSize(200);
  let buttonSpacing = scaleSize(20);
  
  collectionButton.size(buttonWidth, scaleSize(50));
  collectionButton.position(centerX - buttonWidth - buttonSpacing / 2, centerY + scaleSize(20));
  storyButton.size(buttonWidth, scaleSize(50));
  storyButton.position(centerX + buttonSpacing / 2, centerY + scaleSize(20));
}

function updateLeaderboardButtonPosition() {
  if (!leaderboardButton) return;
  
  let canvas = document.querySelector('canvas');
  let centerX, centerY;
  if (canvas) {
    let rect = canvas.getBoundingClientRect();
    centerX = rect.left + rect.width / 2;
    centerY = rect.top + rect.height / 2;
  } else {
    // Fallback to window center
    centerX = windowWidth / 2;
    centerY = windowHeight / 2;
  }
  
  let buttonWidth = scaleSize(200);
  leaderboardButton.size(buttonWidth, scaleSize(50));
  leaderboardButton.position(centerX - buttonWidth / 2, centerY + scaleSize(50));
}

function updateLandingPageButtonPositions() {
  let canvas = document.querySelector('canvas');
  let centerX, centerY;
  
  if (canvas) {
    let rect = canvas.getBoundingClientRect();
    centerX = rect.left + rect.width / 2;
    centerY = rect.top + rect.height / 2;
  } else {
    // Fallback to window center
    centerX = windowWidth / 2;
    centerY = windowHeight / 2;
  }
  
  // offset to avoid overlapping with the name button
  let verticalOffset = scaleSize(100); 
  let buttonWidth = scaleSize(200);
  let buttonSpacing = scaleSize(20);

  // Position buttons horizontally: Collection, Leaderboard, Story
  if (collectionButton) {
    collectionButton.size(buttonWidth, scaleSize(50));
    collectionButton.position(centerX - buttonWidth * 1.5 - buttonSpacing, centerY + verticalOffset);
  }
  if (leaderboardButton) {
    leaderboardButton.size(buttonWidth, scaleSize(50));
    leaderboardButton.position(centerX - buttonWidth / 2, centerY + verticalOffset);
  }
  if (storyButton) {
    storyButton.size(buttonWidth, scaleSize(50));
    storyButton.position(centerX + buttonWidth / 2 + buttonSpacing, centerY + verticalOffset);
  }
}

// ------------------------------
// Name Input Position Update
// ------------------------------
function updateNameInputPosition() {
  if (nameInput) {
    let canvas = document.querySelector('canvas');
    if (canvas) {
      let rect = canvas.getBoundingClientRect();
      let inputWidth = min(scaleSize(300), windowWidth * 0.4);
      let inputX = rect.left + rect.width / 2 - inputWidth / 2;
      let inputY = rect.top + rect.height / 2 + scaleSize(20);
      nameInput.position(inputX, inputY);
      nameInput.size(inputWidth);
      nameInput.style('font-size', scaleSize(20) + 'px');
    } else {
      // Fallback: center relative to window
      let inputWidth = min(scaleSize(300), windowWidth * 0.4);
      nameInput.position(windowWidth / 2 - inputWidth / 2, windowHeight / 2 + scaleSize(20));
      nameInput.size(inputWidth);
      nameInput.style('font-size', scaleSize(20) + 'px');
    }
  }
}

// ------------------------------
// Skin Unlock Functions
// ------------------------------
function loadUnlockedSkins() {
  // Load highest score
  let savedScore = localStorage.getItem('skyCollectorHighestScore');
  if (savedScore !== null) {
    highestScore = parseInt(savedScore);
  } else {
    highestScore = 0;
  }
  
  // Calculate unlocked skins based on highest score
  unlockedSkins = [0]; // First skin is always unlocked
  let skinsToUnlock = floor(highestScore / 100) + 1; // +1 because skin 0 is always unlocked
  let maxSkins = airplaneSkins.length;
  
  for (let i = 1; i < min(skinsToUnlock, maxSkins); i++) {
    unlockedSkins.push(i);
  }
  
  // Load selected skin
  let savedSkin = localStorage.getItem('skyCollectorCurrentSkin');
  if (savedSkin !== null) {
    let skinIndex = parseInt(savedSkin);
    if (skinIndex >= 0 && skinIndex < airplaneSkins.length && unlockedSkins.includes(skinIndex)) {
      currentSkin = skinIndex;
      plane.setSkin(currentSkin);
    }
  }
}

function saveUnlockedSkins() {
  localStorage.setItem('skyCollectorUnlockedSkins', JSON.stringify(unlockedSkins));
}

function checkAndUnlockSkins(score) {
  // Unlock one skin every 100 points
  let skinsToUnlock = floor(score / 100) + 1; // +1 because skin 0 is always unlocked
  let maxSkins = airplaneSkins.length;
  
  let previousUnlockedCount = unlockedSkins.length;
  
  for (let i = 0; i < min(skinsToUnlock, maxSkins); i++) {
    if (!unlockedSkins.includes(i)) {
      unlockedSkins.push(i);
      newlyUnlockedSkins.push(i);
      
      // Trigger unlock animation
      if (!unlockAnimation) {
        unlockAnimation = {
          active: true,
          skinIndex: i,
          timer: 0,
          duration: 180, // 3 seconds at 60fps
          scale: 0,
          rotation: 0,
          alpha: 255
        };
      }
    }
  }
  
  // Sort and save
  unlockedSkins.sort((a, b) => a - b);
  saveUnlockedSkins();
  
  // Update last unlocked count
  if (unlockedSkins.length > previousUnlockedCount) {
    lastUnlockedSkinCount = unlockedSkins.length;
  }
}

// ------------------------------
// Leaderboard Functions
// ------------------------------
function loadLeaderboard() {
  let saved = localStorage.getItem('skyCollectorLeaderboard');
  if (saved) {
    leaderboard = JSON.parse(saved);
  } else {
    leaderboard = [];
  }
  // Sort by score
  leaderboard.sort((a, b) => b.score - a.score);
}

function saveToLeaderboard(name, score) {
  if (!name || name.trim() === "") {
    name = "Anonymous";
  }
  leaderboard.push({ name: name.trim(), score: score, date: new Date().toLocaleDateString() });
  leaderboard.sort((a, b) => b.score - a.score);
  // Keep only top 10
  if (leaderboard.length > 10) {
    leaderboard = leaderboard.slice(0, 10);
  }
  localStorage.setItem('skyCollectorLeaderboard', JSON.stringify(leaderboard));
  
  // Update highest score
  if (score > highestScore) {
    highestScore = score;
    localStorage.setItem('skyCollectorHighestScore', highestScore.toString());
    // Recalculate unlocked skins based on new highest score
    loadUnlockedSkins();
  }
}

// ------------------------------
// Background Music Management
// ------------------------------
function handleBackgroundMusic() {
  // Check if game state changed
  if (gameState !== previousGameState) {
    if (gameState === "PLAYING") {
      // Switch to playing music
      switchToPlayingMusic();
    } else {
      // Switch to menu music
      switchToMenuMusic();
    }
    previousGameState = gameState;
  }
  
  // Handle fade transitions
  if (isFadingOut) {
    if (gameState === "PLAYING") {
      // Fade out menu music
      if (bgMusicMenu.isPlaying()) {
        let currentVol = bgMusicMenu.getVolume();
        let newVol = max(0, currentVol - fadeSpeed);
        bgMusicMenu.setVolume(newVol);
        if (newVol <= 0) {
          bgMusicMenu.stop();
          isFadingOut = false;
          // Start playing music
          if (!bgMusicPlaying.isPlaying()) {
            bgMusicPlaying.setVolume(0);
            bgMusicPlaying.loop();
            isFadingIn = true;
          }
        }
      } else {
        isFadingOut = false;
      }
    } else {
      // Fade out playing music
      if (bgMusicPlaying.isPlaying()) {
        let currentVol = bgMusicPlaying.getVolume();
        let newVol = max(0, currentVol - fadeSpeed);
        bgMusicPlaying.setVolume(newVol);
        if (newVol <= 0) {
          bgMusicPlaying.stop();
          isFadingOut = false;
          // Start menu music
          if (!bgMusicMenu.isPlaying()) {
            bgMusicMenu.setVolume(0);
            bgMusicMenu.loop();
            isFadingIn = true;
          }
        }
      } else {
        isFadingOut = false;
      }
    }
  }
  
  // Handle fade in
  if (isFadingIn) {
    if (gameState === "PLAYING") {
      if (bgMusicPlaying.isPlaying()) {
        let currentVol = bgMusicPlaying.getVolume();
        let newVol = min(targetVolume, currentVol + fadeSpeed);
        bgMusicPlaying.setVolume(newVol);
        if (newVol >= targetVolume) {
          isFadingIn = false;
        }
      }
    } else {
      if (bgMusicMenu.isPlaying()) {
        let currentVol = bgMusicMenu.getVolume();
        let newVol = min(targetVolume, currentVol + fadeSpeed);
        bgMusicMenu.setVolume(newVol);
        if (newVol >= targetVolume) {
          isFadingIn = false;
        }
      }
    }
  }
}

function switchToPlayingMusic() {
  // Stop menu music with fade out
  if (bgMusicMenu.isPlaying()) {
    isFadingOut = true;
  } else {
    // If menu music wasn't playing, start playing music directly
    if (!bgMusicPlaying.isPlaying()) {
      bgMusicPlaying.setVolume(0);
      bgMusicPlaying.loop();
      isFadingIn = true;
    }
  }
}

function switchToMenuMusic() {
  // Stop playing music with fade out
  if (bgMusicPlaying.isPlaying()) {
    isFadingOut = true;
  } else {
    // If playing music wasn't playing, start menu music directly
    if (!bgMusicMenu.isPlaying()) {
      bgMusicMenu.setVolume(0);
      bgMusicMenu.loop();
      isFadingIn = true;
    }
  }
}

// ------------------------------
// p5 Setup
// ------------------------------
function setup() {
  createCanvas(windowWidth, windowHeight);
  plane = new Plane();

  
  // Analyze the new planes.png structure (500x500 image)
  // Assuming a grid layout - adjust these values based on actual image structure
  let imgWidth = spritesheet.width;
  let imgHeight = spritesheet.height;
  
  // Detect grid structure - try common layouts
  // For a 500x500 image, common layouts could be:
  // - 5 columns x 6 rows = 30 planes (100x83 per cell)
  // - 6 columns x 5 rows = 30 planes (83x100 per cell)
  // - 10 columns x 3 rows = 30 planes (50x166 per cell)
  
  // Try to auto-detect: assume 5 columns x 6 rows for 30 planes
  let cols = 5;
  let rows = 6;
  let cellWidth = imgWidth / cols;
  let cellHeight = imgHeight / rows;
  
  // Add some padding/margin if planes don't fill entire cells
  let padding = 5; // Adjust based on actual spacing in image
  
  airplaneSkins = [];
  
  // Extract each plane from the grid
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let x = col * cellWidth + padding;
      let y = row * cellHeight + padding;
      let w = cellWidth - (padding * 2);
      let h = cellHeight - (padding * 2);
      
      // Ensure we don't go outside image bounds
      x = max(0, min(x, imgWidth - w));
      y = max(0, min(y, imgHeight - h));
      w = min(w, imgWidth - x);
      h = min(h, imgHeight - y);
      
      if (w > 0 && h > 0) {
        let img = spritesheet.get(x, y, w, h);
        airplaneSkins.push(img);
      }
    }
  }
  
  // If we got fewer planes than expected, log for debugging
  if (airplaneSkins.length < 30) {
    console.log(`Extracted ${airplaneSkins.length} planes from ${imgWidth}x${imgHeight} image`);
  }

  
  
  // Load unlocked skins from localStorage
  loadUnlockedSkins();
  
  // Create username input field
  nameInput = createInput('');
  nameInput.size(scaleSize(300));
  nameInput.style('font-size', scaleSize(20) + 'px');
  nameInput.style('text-align', 'center');
  nameInput.style('padding', scaleSize(10) + 'px');
  nameInput.style('border', scaleSize(3) + 'px solid #8B4513');
  nameInput.style('border-radius', scaleSize(10) + 'px');
  nameInput.style('background-color', '#FFF8DC');
  nameInput.style('font-family', 'serif');
  nameInput.attribute('placeholder', 'Enter your name');
  updateNameInputPosition();
  nameInput.show();
  
  // Create mode selection buttons
  collectionButton = createButton('Plane Collection');
  collectionButton.size(scaleSize(200), scaleSize(50));
  collectionButton.style('font-size', scaleSize(18) + 'px');
  collectionButton.style('padding', scaleSize(10) + 'px');
  collectionButton.style('border', scaleSize(3) + 'px solid #8B4513');
  collectionButton.style('border-radius', scaleSize(10) + 'px');
  collectionButton.style('background-color', '#FFF8DC');
  collectionButton.style('font-family', 'serif');
  collectionButton.style('cursor', 'pointer');
  collectionButton.style('z-index', '1000');
  collectionButton.mousePressed(function() {
    selectedMode = "collection";
    gameState = "COLLECTION_PAGE";
    nameInput.hide();
    collectionButton.hide();
    if (storyButton) storyButton.hide();
    if (leaderboardButton) leaderboardButton.hide();
    console.log("Collection mode selected:", selectedMode);
  });
  collectionButton.hide();
  
  storyButton = createButton('Wind Rises Story');
  storyButton.size(scaleSize(200), scaleSize(50));
  storyButton.style('font-size', scaleSize(18) + 'px');
  storyButton.style('padding', scaleSize(10) + 'px');
  storyButton.style('border', scaleSize(3) + 'px solid #8B4513');
  storyButton.style('border-radius', scaleSize(10) + 'px');
  storyButton.style('background-color', '#FFF8DC');
  storyButton.style('font-family', 'serif');
  storyButton.style('cursor', 'pointer');
  storyButton.style('z-index', '1000');
  storyButton.mousePressed(function() {
    selectedMode = "story";
    gameState = "STORY_PAGE";
    nameInput.hide();
    if (collectionButton) collectionButton.hide();
    storyButton.hide();
    console.log("Story mode selected:", selectedMode);
  });
  storyButton.hide();
  
  // Create leaderboard button
  leaderboardButton = createButton('Leaderboard');
  leaderboardButton.size(scaleSize(200), scaleSize(50));
  leaderboardButton.style('font-size', scaleSize(18) + 'px');
  leaderboardButton.style('padding', scaleSize(10) + 'px');
  leaderboardButton.style('border', scaleSize(3) + 'px solid #8B4513');
  leaderboardButton.style('border-radius', scaleSize(10) + 'px');
  leaderboardButton.style('background-color', '#FFF8DC');
  leaderboardButton.style('font-family', 'serif');
  leaderboardButton.style('cursor', 'pointer');
  leaderboardButton.style('z-index', '1000');
  leaderboardButton.mousePressed(function() {
    showLeaderboard = !showLeaderboard;
    console.log("Leaderboard toggled:", showLeaderboard);
  });
  leaderboardButton.hide();
  
  // Initialize serial communication
  port = createSerial(); 
  
  
  // Try to open previously used port
  let usedPorts = usedSerialPorts();
  if (usedPorts.length > 0) {
    port.open(usedPorts[0], baudrate);
    useSensor = true;
  }
  
  // Add serial port selection button
  connectButton = createButton("Connect Serial");
  connectButton.position(scaleSize(10), scaleSize(10));
  connectButton.mousePressed(connectSerial);
  connectButton.style('padding', scaleSize(10) + 'px');
  connectButton.style('font-size', scaleSize(14) + 'px');
  connectButton.style('background-color', '#4CAF50');
  connectButton.style('color', 'white');
  connectButton.style('border', 'none');
  connectButton.style('border-radius', scaleSize(5) + 'px');
  connectButton.style('cursor', 'pointer');
  
  // Load leaderboard
  loadLeaderboard();
  
  // Initialize clouds
  for (let i = 0; i < 5; i++) {
    clouds.push(new Cloud());
  }
  
  // Initialize background music
  previousGameState = gameState;
  if (bgMusicMenu && !bgMusicMenu.isPlaying()) {
    bgMusicMenu.setVolume(targetVolume);
    bgMusicMenu.loop();
  }
}

// ------------------------------
// Serial Communication
// ------------------------------
function connectSerial() {
  if (!port.opened()) {
    // Open port selection popup
    port.open(baudrate);
    useSensor = true;
  } else {
    port.close();
    useSensor = false;
  }
}

// function to read sensor values 
function readSerialValue() {
  let str = port.readUntil("\n");
  if (str.length > 0) {
    str = str.trim();

    // Expecting "ACC:300,BTN:1"
    let parts = str.split(",");

    if (parts.length === 2) {
      let accVal = parseInt(parts[0].split(":")[1]);
      let btnVal = parseInt(parts[1].split(":")[1]);

      if (!isNaN(accVal)) sensorValue = accVal;
      if (!isNaN(btnVal)) buttonPressed = (btnVal === 1);
      
      useSensor = true;
    }
  }
}





// ------------------------------
// p5 Draw
// ------------------------------
function draw() {
  // Read serial data FIRST, before any game logic uses it
  if (port && port.opened()) {
    readSerialValue();
  }

  if (port.opened()) {
    console.log("port is open");
  } else {
    console.log("port is CLOSED");
  }

  console.log("sensorValue =", sensorValue);

  // Handle background music
  handleBackgroundMusic();
  
  // Update connect button label based on connection status
  if (connectButton) {
    if (!port || !port.opened()) {
      connectButton.html("Connect Serial");
      connectButton.style('background-color', '#4CAF50');
    } else {
      connectButton.html("Disconnect Serial");
      connectButton.style('background-color', '#f44336');
    }
  }
  
  if (gameState === "LANDING") {
    drawLandingPage();
  } else if (gameState === "INSTRUCTIONS") {
    drawInstructionsPage();
  } else if (gameState === "START") {
    drawStartScreen();
  } else if (gameState === "PLAYING") {
    playGame();
  } else if (gameState === "GAMEOVER") {
    drawGameOverScreen();
  } else if (gameState === "COLLECTION_PAGE"){
    drawCollectionPage(); 
  } else if (gameState === "STORY_PAGE"){
    drawStoryPage(); 
  }
  
  // Check and unlock skins based on score (every 100 points)
  checkAndUnlockSkins(score);
  
  // Update unlock animation
  if (unlockAnimation && unlockAnimation.active) {
    unlockAnimation.timer++;
    unlockAnimation.scale = sin(unlockAnimation.timer * 0.1) * 0.3 + 1.0;
    unlockAnimation.rotation += 0.05;
    
    if (unlockAnimation.timer >= unlockAnimation.duration) {
      unlockAnimation.active = false;
      unlockAnimation = null;
    }
  }

}

// ------------------------------
// Landing Page
// ------------------------------
function drawLandingPage() {
  // Ghibli-style background (gradient)
  for (let i = 0; i < height; i++) {
    let inter = map(i, 0, height, 0, 1);
    let c = lerpColor(color(135, 206, 250), color(255, 250, 240), inter);
    stroke(c);
    line(0, i, width, i);
  }
  
  // Draw clouds
  for (let cloud of clouds) {
    cloud.update();
    cloud.draw();
  }
  
  // Title
  fill(255, 255, 240);
  stroke(139, 69, 19);
  strokeWeight(scaleSize(5));
  textAlign(CENTER, CENTER);
  textSize(scaleSize(56));
  textFont('serif');
  text("Sky Collector", width / 2, height / 2 - scaleSize(200));
  
  textSize(scaleSize(32));
  fill(255, 255, 240);
  text("Flight Adventure", width / 2, height / 2 - scaleSize(150));
  
  // Username input instruction
  textSize(scaleSize(20));
  fill(139, 69, 19);
  stroke(255, 255, 240);
  strokeWeight(scaleSize(2));
  text("Please enter your name", width / 2, height / 2 - scaleSize(80));
  
  // Update and show input field
  updateNameInputPosition();
  nameInput.show();
  
  // Show all buttons on landing page
  updateLandingPageButtonPositions();
  if (collectionButton) collectionButton.show();
  if (storyButton) storyButton.show();
  if (leaderboardButton) leaderboardButton.show();
  
  // Instructions
  textSize(scaleSize(18));
  fill(139, 69, 19);
  stroke(255, 255, 240);
  strokeWeight(scaleSize(1));
  text("Press ENTER to continue", width / 2, height / 2 + scaleSize(150));
  
  // Show leaderboard if active
  if (showLeaderboard) {
    drawLeaderboard();
  }
}

// ------------------------------
// Instructions Page
// ------------------------------
function drawInstructionsPage() {
  // Ghibli-style background (gradient)
  for (let i = 0; i < height; i++) {
    let inter = map(i, 0, height, 0, 1);
    let c = lerpColor(color(135, 206, 250), color(255, 250, 240), inter);
    stroke(c);
    line(0, i, width, i);
  }
  
  // Draw clouds
  for (let cloud of clouds) {
    cloud.update();
    cloud.draw();
  }
  
  // Title
  fill(255, 255, 240);
  stroke(139, 69, 19);
  strokeWeight(scaleSize(4));
  textAlign(CENTER, CENTER);
  textSize(scaleSize(40));
  textFont('serif');
  text("How to Play", width / 2, height / 2 - scaleSize(200));
  
  // Instructions
  textSize(scaleSize(18));
  fill(139, 69, 19);
  stroke(255, 255, 240);
  strokeWeight(scaleSize(1));
  textAlign(LEFT, CENTER);
  
  let instructions = [
    "Use ↑/↓ arrow keys or W/S to move your airplane",
    "Press SPACE for speed boost (consumes boost energy)",
    "⭐ Collect stars to earn 10 points each",
    "💣 Avoid bombs - they reduce your hearts",
    "❤️ Collect heart items to restore health",
    "New airplane skins unlock every 100 points",
    "Visit the Airplane Collection to view and select skins"
  ];
  
  let startY = height / 2 - scaleSize(120);
  for (let i = 0; i < instructions.length; i++) {
    text(instructions[i], width / 2 - scaleSize(300), startY + i * scaleSize(35));
  }
  
  // Continue button
  textAlign(CENTER, CENTER);
  textSize(scaleSize(24));
  fill(255, 215, 0);
  stroke(139, 69, 19);
  strokeWeight(scaleSize(3));
  text("Press ENTER to Start Game", width / 2, height / 2 + scaleSize(200));
  
  // Hide input and buttons
  if (nameInput) nameInput.hide();
  if (collectionButton) collectionButton.hide();
  if (storyButton) storyButton.hide();
}

// ------------------------------
// Start Screen
// ------------------------------
function drawStartScreen() {
  // Ghibli-style background (gradient)
  for (let i = 0; i < height; i++) {
    let inter = map(i, 0, height, 0, 1);
    let c = lerpColor(color(135, 206, 250), color(255, 250, 240), inter);
    stroke(c);
    line(0, i, width, i);
  }
  
  // Draw clouds
  for (let cloud of clouds) {
    cloud.update();
    cloud.draw();
  }
  
  // Title
  fill(255, 255, 240);
  stroke(139, 69, 19);
  strokeWeight(scaleSize(5));
  textAlign(CENTER, CENTER);
  textSize(scaleSize(56));
  textFont('serif');
  text("Sky Collector", width / 2, height / 2 - scaleSize(150));
  
  textSize(scaleSize(32));
  fill(255, 255, 240);
  text("Flight Adventure", width / 2, height / 2 - scaleSize(100));
  
  // Username input instruction
  textSize(scaleSize(20));
  fill(139, 69, 19);
  stroke(255, 255, 240);
  strokeWeight(scaleSize(2));
  text("Please enter your name", width / 2, height / 2 - scaleSize(30));
  
  // Update and show input field (hide if leaderboard is showing)
  updateNameInputPosition();
  if (showLeaderboard) {
    nameInput.hide();
  } else {
    nameInput.show();
  }
  
  // Instructions
  textSize(scaleSize(18));
  fill(139, 69, 19);
  stroke(255, 255, 240);
  strokeWeight(scaleSize(1));
  text("Use ↑/↓ or W/S to move", width / 2, height / 2 + scaleSize(80));
  text("Press SPACE for speed boost", width / 2, height / 2 + scaleSize(110));
  text("⭐ Collect stars (+10 pts)", width / 2, height / 2 + scaleSize(140));
  text("💣 Avoid bombs (-1 heart)", width / 2, height / 2 + scaleSize(170));
  text("New skins unlock every 100 points!", width / 2, height / 2 + scaleSize(200));
  
  // Skin selection button
  textSize(scaleSize(18));
  fill(139, 69, 19);
  stroke(255, 255, 240);
  strokeWeight(scaleSize(1));
  text("Press S to select skin", width / 2, height / 2 + scaleSize(230));
  
  // Start button
  textSize(scaleSize(24));
  fill(255, 215, 0);
  stroke(139, 69, 19);
  strokeWeight(scaleSize(3));
  text("Press ENTER to Start", width / 2, height / 2 + scaleSize(270));
  
  // Leaderboard button
  textSize(scaleSize(18));
  fill(139, 69, 19);
  stroke(255, 255, 240);
  strokeWeight(scaleSize(1));
  text("Press L to view Leaderboard", width / 2, height / 2 + scaleSize(310));
  
  // Draw skin selection UI if active
  if (showSkinSelection) {
    drawSkinSelection();
  }
  
  // Show leaderboard
  if (showLeaderboard) {
    drawLeaderboard();
  }
}

// ------------------------------
// Skin Selection Display
// ------------------------------
function drawSkinSelection() {
  // Background overlay
  fill(0, 0, 0, 150);
  noStroke();
  rect(0, 0, width, height);
  
  // Skin selection box
  let boxWidth = scaleSize(600);
  let boxHeight = scaleSize(500);
  fill(255, 250, 240);
  stroke(139, 69, 19);
  strokeWeight(scaleSize(4));
  rect(width / 2 - boxWidth / 2, height / 2 - boxHeight / 2, boxWidth, boxHeight, scaleSize(20));
  
  // Title
  fill(139, 69, 19);
  textAlign(CENTER, CENTER);
  textSize(scaleSize(32));
  text("✈️ Select Airplane Skin ✈️", width / 2, height / 2 - scaleSize(220));
  
  // Display skins in a grid
  let cols = 4;
  let skinSize = scaleSize(80);
  let spacing = scaleSize(100);
  let startX = width / 2 - (cols - 1) * spacing / 2;
  let startY = height / 2 - scaleSize(100);
  
  for (let i = 0; i < airplaneSkins.length; i++) {
    let col = i % cols;
    let row = floor(i / cols);
    let x = startX + col * spacing;
    let y = startY + row * spacing;
    
    let isUnlocked = unlockedSkins.includes(i);
    let isSelected = currentSkin === i;
    let isNewlyUnlocked = newlyUnlockedSkins.includes(i);
    
    // Draw skin preview
    push();
    translate(x, y);
    
    // Background box
    if (isSelected) {
      fill(255, 215, 0);
      stroke(139, 69, 19);
      strokeWeight(scaleSize(3));
    } else if (isNewlyUnlocked) {
      // Highlight newly unlocked skins
      fill(255, 200, 100);
      stroke(255, 150, 0);
      strokeWeight(scaleSize(3));
    } else if (isUnlocked) {
      fill(255, 255, 255);
      stroke(139, 69, 19);
      strokeWeight(scaleSize(2));
    } else {
      fill(100, 100, 100);
      stroke(50, 50, 50);
      strokeWeight(scaleSize(2));
    }
    rect(-skinSize/2 - 5, -skinSize/2 - 5, skinSize + 10, skinSize + 10, scaleSize(5));
    
    // Add "NEW" label for newly unlocked skins
    if (isNewlyUnlocked) {
      fill(255, 100, 100);
      textSize(scaleSize(12));
      textAlign(CENTER, CENTER);
      text("NEW!", 0, -skinSize/2 - 15);
    }
    
    // Draw sprite
    if (isUnlocked && airplaneSkins[i]) {
      imageMode(CENTER);
      let scaleFactor = (skinSize * 0.7) / max(airplaneSkins[i].width, airplaneSkins[i].height);
      image(airplaneSkins[i], 0, 0, airplaneSkins[i].width * scaleFactor, airplaneSkins[i].height * scaleFactor);
    } else {
      // Locked icon
      fill(150, 150, 150);
      textSize(scaleSize(30));
      text("🔒", 0, 0);
    }
    
    // Skin number
    fill(139, 69, 19);
    textSize(scaleSize(14));
    textAlign(CENTER, CENTER);
    text(`Skin ${i + 1}`, 0, skinSize/2 + 15);
    
    pop();
  }
  
  // Instructions
  textAlign(CENTER, CENTER);
  textSize(scaleSize(16));
  fill(139, 69, 19);
  if (newlyUnlockedSkins.length > 0) {
    text("New skins available! Press number keys to select", width / 2, height / 2 + scaleSize(180));
    text("You can only change to newly unlocked skins during gameplay", width / 2, height / 2 + scaleSize(210));
  } else {
    text("Press number keys (1-" + airplaneSkins.length + ") to select", width / 2, height / 2 + scaleSize(180));
  }
  text("Press S to close", width / 2, height / 2 + scaleSize(240));
  
  // Unlock info
  let nextUnlockScore = (unlockedSkins.length) * 100;
  if (unlockedSkins.length < airplaneSkins.length) {
    textSize(scaleSize(14));
    fill(100, 100, 100);
    text(`Next skin unlocks at ${nextUnlockScore} points`, width / 2, height / 2 + scaleSize(240));
  }
}

// ------------------------------
// Collection Page
// ------------------------------
function drawCollectionPage() {
  // Ghibli-style background (gradient)
  for (let i = 0; i < height; i++) {
    let inter = map(i, 0, height, 0, 1);
    let c = lerpColor(color(135, 206, 250), color(255, 250, 240), inter);
    stroke(c);
    line(0, i, width, i);
  }
  
  // Draw clouds
  for (let cloud of clouds) {
    cloud.update();
    cloud.draw();
  }
  
  // Title - positioned at top
  fill(255, 255, 240);
  stroke(139, 69, 19);
  strokeWeight(scaleSize(4));
  textAlign(CENTER, CENTER);
  textSize(scaleSize(36));
  textFont('serif');
  text("✈️ Airplane Collection ✈️", width / 2, height * 0.08);
  
  // Highest score display - below title
  textSize(scaleSize(16));
  fill(139, 69, 19);
  stroke(255, 255, 240);
  strokeWeight(scaleSize(1));
  text(`Highest Score: ${highestScore} points`, width / 2, height * 0.13);
  text(`Unlocked: ${unlockedSkins.length}/${airplaneSkins.length} skins`, width / 2, height * 0.16);
  
  // Display skins in a grid - calculate responsive sizing
  let cols = 5; // Reduced columns for more space
  let totalRows = ceil(airplaneSkins.length / cols);
  
  // Calculate available space
  let topMargin = height * 0.20; // Start below title/score info
  let bottomMargin = height * 0.25; // Space for instructions at bottom
  let availableHeight = height - topMargin - bottomMargin;
  let availableWidth = width * 0.95; // Use 95% of width
  
  // Calculate optimal skin size and spacing - ensure text fits
  let maxSkinSize = min(availableWidth / cols * 0.75, availableHeight / totalRows * 0.65);
  let skinSize = min(scaleSize(65), maxSkinSize);
  // Increased spacing to accommodate text below boxes
  let horizontalSpacing = skinSize * 1.5;
  let verticalSpacing = skinSize * 1.8; // More vertical space for text
  
  let startX = width / 2 - (cols - 1) * horizontalSpacing / 2;
  let startY = topMargin;
  
  for (let i = 0; i < airplaneSkins.length; i++) {
    let col = i % cols;
    let row = floor(i / cols);
    let x = startX + col * horizontalSpacing;
    let y = startY + row * verticalSpacing;
    
    // Skip drawing if outside visible area (account for text below)
    if (y + skinSize/2 + 50 > height - bottomMargin) {
      continue;
    }
    
    let isUnlocked = unlockedSkins.includes(i);
    let isSelected = currentSkin === i;
    let unlockScore = i * 100; // Score needed to unlock (0, 100, 200, etc.)
    
    // Draw skin preview
    push();
    translate(x, y);
    
    // Background box
    if (isSelected) {
      fill(255, 215, 0);
      stroke(139, 69, 19);
      strokeWeight(scaleSize(4));
    } else if (isUnlocked) {
      fill(255, 255, 255);
      stroke(139, 69, 19);
      strokeWeight(scaleSize(2));
    } else {
      fill(100, 100, 100);
      stroke(50, 50, 50);
      strokeWeight(scaleSize(2));
    }
    rect(-skinSize/2 - 5, -skinSize/2 - 5, skinSize + 10, skinSize + 10, scaleSize(5));
    
    // Add "SELECTED" label for selected skin
    if (isSelected) {
      fill(139, 69, 19);
      textSize(scaleSize(12));
      textAlign(CENTER, CENTER);
      noStroke();
      text("✓ SELECTED", 0, -skinSize/2 - 18);
    }
    
    // Draw sprite
    if (isUnlocked && airplaneSkins[i]) {
      imageMode(CENTER);
      let scaleFactor = (skinSize * 0.7) / max(airplaneSkins[i].width, airplaneSkins[i].height);
      image(airplaneSkins[i], 0, 0, airplaneSkins[i].width * scaleFactor, airplaneSkins[i].height * scaleFactor);
    } else {
      // Locked icon
      fill(150, 150, 150);
      textSize(scaleSize(30));
      textAlign(CENTER, CENTER);
      text("🔒", 0, 0);
    }
    
    // Skin number and status - positioned below box with more space
    noStroke();
    fill(139, 69, 19);
    textSize(scaleSize(14));
    textAlign(CENTER, CENTER);
    text(`Skin ${i + 1}`, 0, skinSize/2 + 20);
    
    if (!isUnlocked) {
      textSize(scaleSize(12));
      fill(150, 150, 150);
      text(`${unlockScore}pts`, 0, skinSize/2 + 38);
    }
    
    pop();
  }
  
  // Instructions - positioned at bottom
  textAlign(CENTER, CENTER);
  textSize(scaleSize(14));
  fill(139, 69, 19);
  stroke(255, 255, 240);
  strokeWeight(scaleSize(1));
  text("Press number keys (1-" + min(airplaneSkins.length, 9) + (airplaneSkins.length > 9 ? ", 0 for 10+" : "") + ") to select unlocked skin", width / 2, height * 0.88);
  
  // Show current selection
  if (currentSkin >= 0 && currentSkin < airplaneSkins.length) {
    textSize(scaleSize(14));
    fill(255, 215, 0);
    stroke(139, 69, 19);
    strokeWeight(scaleSize(1));
    text(`Currently selected: Skin ${currentSkin + 1}`, width / 2, height * 0.92);
  }
  
  textSize(scaleSize(14));
  fill(139, 69, 19);
  stroke(255, 255, 240);
  strokeWeight(scaleSize(1));
  text("Press ESC or B to go back", width / 2, height * 0.96);
}

// ------------------------------
// Story Page
// ------------------------------
function drawStoryPage() {
  // Ghibli-style background (gradient)
  for (let i = 0; i < height; i++) {
    let inter = map(i, 0, height, 0, 1);
    let c = lerpColor(color(135, 206, 250), color(255, 250, 240), inter);
    stroke(c);
    line(0, i, width, i);
  }
  
  // Draw clouds
  for (let cloud of clouds) {
    cloud.update();
    cloud.draw();
  }
  
  // Title
  fill(255, 255, 240);
  stroke(139, 69, 19);
  strokeWeight(scaleSize(4));
  textAlign(CENTER, CENTER);
  textSize(scaleSize(40));
  textFont('serif');
  text("風立ちぬ", width / 2, height / 2 - scaleSize(240));
  
  textSize(scaleSize(28));
  fill(255, 255, 240);
  text("The Wind Rises", width / 2, height / 2 - scaleSize(200));
  
  // Story content
  textAlign(LEFT, TOP);
  textSize(scaleSize(16));
  fill(139, 69, 19);
  stroke(255, 255, 240);
  strokeWeight(scaleSize(1));
  
  let storyText = [
    "「風立ちぬ」は、宮崎駿監督による2013年のスタジオジブリの",
    "アニメーション映画です。",
    "",
    "この映画は、零式戦闘機の設計者である堀越二郎の人生を",
    "描いた物語です。",
    "",
    "主人公の二郎は、幼い頃から飛行機に憧れ、航空技術者として",
    "夢を追い続けます。",
    "",
    "映画は、技術への情熱、戦争の現実、そして愛する人との",
    "出会いと別れを描いています。",
    "",
    "「風立ちぬ、いざ生きめやも」という言葉は、",
    "困難な時代でも前向きに生きることを意味しています。"
  ];
  
  let startY = height / 2 - scaleSize(150);
  for (let i = 0; i < storyText.length; i++) {
    text(storyText[i], width / 2 - scaleSize(350), startY + i * scaleSize(25));
  }
  
  // Back button
  textAlign(CENTER, CENTER);
  textSize(scaleSize(18));
  fill(139, 69, 19);
  stroke(255, 255, 240);
  strokeWeight(scaleSize(1));
  text("Press ESC or B to go back", width / 2, height / 2 + scaleSize(200));
  
  // Hide Leaderboard button on Story page
  if (leaderboardButton) leaderboardButton.hide();
  if (collectionButton) collectionButton.hide();
  if (storyButton) storyButton.hide();
  if (nameInput) nameInput.hide();
}

// ------------------------------
// Leaderboard Display
// ------------------------------
function drawLeaderboard() {
  // Hide all buttons and name input when leaderboard is shown
  if (leaderboardButton) leaderboardButton.hide();
  if (collectionButton) collectionButton.hide();
  if (storyButton) storyButton.hide();
  if (nameInput) nameInput.hide();
  
  // Background overlay
  fill(0, 0, 0, 150);
  noStroke();
  rect(0, 0, width, height);
  
  // Leaderboard box
  let boxWidth = scaleSize(500);
  let boxHeight = scaleSize(400);
  fill(255, 250, 240);
  stroke(139, 69, 19);
  strokeWeight(scaleSize(4));
  rect(width / 2 - boxWidth / 2, height / 2 - boxHeight / 2, boxWidth, boxHeight, scaleSize(20));
  
  // Title
  fill(139, 69, 19);
  textAlign(CENTER, CENTER);
  textSize(scaleSize(32));
  text("🏆 Leaderboard 🏆", width / 2, height / 2 - scaleSize(160));
  
  // Rankings
  textSize(scaleSize(20));
  fill(139, 69, 19);
  textAlign(LEFT, CENTER);
  
  if (leaderboard.length === 0) {
    textAlign(CENTER, CENTER);
    text("No records yet", width / 2, height / 2);
  } else {
    let startY = height / 2 - scaleSize(100);
    for (let i = 0; i < min(leaderboard.length, 10); i++) {
      let entry = leaderboard[i];
      let y = startY + i * scaleSize(30);
      
      // Rank display
      fill(139, 69, 19);
      text(`${i + 1}.`, width / 2 - scaleSize(220), y);
      
      // Name
      fill(50, 50, 50);
      text(entry.name, width / 2 - scaleSize(180), y);
      
      // Score
      fill(200, 50, 50);
      textAlign(RIGHT, CENTER);
      text(`${entry.score} pts`, width / 2 + scaleSize(200), y);
      textAlign(LEFT, CENTER);
    }
  }
  
  // Close button
  textAlign(CENTER, CENTER);
  textSize(scaleSize(18));
  fill(139, 69, 19);
  text("Press L to close", width / 2, height / 2 + scaleSize(150));
}

// ------------------------------
// Play Game
// ------------------------------
function playGame() {
  // Ghibli-style background
  for (let i = 0; i < height; i++) {
    let inter = map(i, 0, height, 0, 1);
    let c = lerpColor(color(135, 206, 250), color(255, 250, 240), inter);
    stroke(c);
    line(0, i, width, i);
  }
  
  // Draw clouds
  for (let cloud of clouds) {
    cloud.update();
    cloud.draw();
  }

  let controls = updateControls();

  if (controls.boosting && boostEnergy > 0) {
    boostEnergy -= boostDrainRate;
    boostEnergy = max(0, boostEnergy);
  } else if (!controls.boosting && boostEnergy < 100) {
    boostEnergy += boostRecoveryRate;
    boostEnergy = min(100, boostEnergy);
  }

  plane.update(controls.moveUp, controls.moveDown);
  plane.draw();

  difficultyTimer++;
  if (difficultyTimer >= 900) {
    difficulty += 0.2;
    difficultyTimer = 0;
  }

  // Spawn stars
  starTimer--;
  if (starTimer <= 0) {
    stars.push(new Star());
    starTimer = random(60, 120) / difficulty;
  }

  // Spawn bombs
  bombTimer--;
  if (bombTimer <= 0) {
    bombs.push(new Bomb());
    bombTimer = random(80, 150) / difficulty;
  }

  // Spawn hearts
  heartSpawnTimer--;
  if (heartSpawnTimer <= 0) {
    hearts_items.push(new HeartItem());
    heartSpawnTimer = random(600, 1200);
  }

  // Update stars
  for (let i = stars.length - 1; i >= 0; i--) {
    stars[i].update();
    stars[i].draw();

    if (plane.collidesWith(stars[i])) {
      score += 10;
      stars.splice(i, 1);
      // Send signal to Arduino to light up LEDs when star is collected
      if (port && port.opened()) {
        port.write('1');
      }
      continue;
    }

    if (stars[i].offScreen()) stars.splice(i, 1);
  }

  // Update bombs
  for (let i = bombs.length - 1; i >= 0; i--) {
    bombs[i].update();
    bombs[i].draw();

    if (plane.collidesWith(bombs[i])) {
      hearts--;
      bombs.splice(i, 1);

      if (hearts <= 0) {
        gameState = "GAMEOVER";
      }
      continue;
    }

    if (bombs[i].offScreen()) bombs.splice(i, 1);
  }

  // Update heart items
  for (let i = hearts_items.length - 1; i >= 0; i--) {
    hearts_items[i].update();
    hearts_items[i].draw();

    if (plane.collidesWith(hearts_items[i])) {
      hearts = min(hearts + 1, 3);
      hearts_items.splice(i, 1);
      continue;
    }

    if (hearts_items[i].offScreen()) hearts_items.splice(i, 1);
  }

  drawUI();
  
  // Draw unlock animation
  if (unlockAnimation && unlockAnimation.active) {
    drawUnlockAnimation();
  }
}

// ------------------------------
// UI Drawing
// ------------------------------
function drawUI() {
  // Calculate Connect Serial button dimensions
  let buttonHeight = scaleSize(40); // Approximate button height including padding
  let buttonWidth = scaleSize(140); // Approximate button width
  let scoreY = scaleSize(10) + buttonHeight + scaleSize(10); // Position below button
  
  // Score text - positioned below Connect Serial button
  fill(255);
  stroke(0);
  strokeWeight(scaleSize(3));
  textAlign(LEFT, TOP);
  textSize(scaleSize(24));
  text(`Score: ${score}`, scaleSize(20), scoreY);

  // Hearts section - positioned on the right side
  textAlign(RIGHT, TOP);
  textSize(scaleSize(20));
  fill(255);
  stroke(0);
  strokeWeight(scaleSize(2));
  
  // Calculate hearts position to avoid overlap
  let heartsLabelX = width - scaleSize(20);
  let heartIconSize = scaleSize(20);
  let heartSpacing = scaleSize(25); // Space between hearts
  let heartsStartX = heartsLabelX - (hearts * heartSpacing);
  
  // Draw "Hearts:" label
  text("Hearts:", heartsStartX - scaleSize(10), scaleSize(20));
  
  // Draw heart icons with proper spacing
  for (let i = 0; i < hearts; i++) {
    fill(255, 0, 0);
    noStroke();
    push();
    translate(heartsStartX + i * heartSpacing, scaleSize(45));
    scale(getScale());
    beginShape();
    vertex(0, 5);
    bezierVertex(-8, -5, -15, 0, 0, 15);
    bezierVertex(15, 0, 8, -5, 0, 5);
    endShape(CLOSE);
    pop();
  }

  textAlign(LEFT, TOP);
  textSize(scaleSize(16));
  stroke(139, 69, 19);
  fill(255, 250, 240);
  text("Boost:", scaleSize(20), scoreY + scaleSize(35));

  noFill();
  stroke(139, 69, 19);
  strokeWeight(scaleSize(2));
  rect(scaleSize(80), scoreY + scaleSize(35), scaleSize(120), scaleSize(15), scaleSize(5));

  let energyColor =
    boostEnergy > 66 ? color(100, 200, 100) :
    boostEnergy > 33 ? color(255, 200, 100) :
                       color(255, 150, 100);

  fill(energyColor);
  noStroke();
  rect(scaleSize(80), scoreY + scaleSize(35), (boostEnergy / 100) * scaleSize(120), scaleSize(15), scaleSize(5));
  
  // Display skin info
  textSize(scaleSize(14));
  fill(255, 250, 240);
  stroke(139, 69, 19);
  strokeWeight(scaleSize(1));
  text(`Skin: ${currentSkin + 1}/${airplaneSkins.length}`, scaleSize(20), scoreY + scaleSize(65));
  let nextUnlockScore = (unlockedSkins.length) * 100;
  if (unlockedSkins.length < airplaneSkins.length) {
    let pointsNeeded = nextUnlockScore - score;
    if (pointsNeeded > 0) {
      text(`Next skin in: ${pointsNeeded} pts`, scaleSize(20), scoreY + scaleSize(85));
    } else {
      text(`All skins unlocked!`, scaleSize(20), scoreY + scaleSize(85));
    }
  } else {
    text(`All skins unlocked!`, scaleSize(20), scoreY + scaleSize(85));
  }
  
  // Fullscreen button hint
  textSize(scaleSize(12));
  fill(139, 69, 19);
  stroke(255, 250, 240);
  strokeWeight(scaleSize(1));
  text("F: Fullscreen", width - scaleSize(150), height - scaleSize(30));
  
  // Sensor status
  if (useSensor && port && port.opened()) {
    textSize(scaleSize(12));
    fill(0, 200, 0);
    stroke(255, 250, 240);
    strokeWeight(scaleSize(1));
    text("Sensor: Connected", scaleSize(20), height - scaleSize(30));
    text(`Value: ${sensorValue}`, scaleSize(20), height - scaleSize(15));
  } else {
    textSize(scaleSize(12));
    fill(200, 0, 0);
    stroke(255, 250, 240);
    strokeWeight(scaleSize(1));
    text("Sensor: Not Connected", scaleSize(20), height - scaleSize(30));
    text("Use ↑/↓ or W/S keys", scaleSize(20), height - scaleSize(15));
  }
}

// ------------------------------
// Unlock Animation
// ------------------------------
function drawUnlockAnimation() {
  if (!unlockAnimation || !unlockAnimation.active) return;
  
  // Semi-transparent overlay
  fill(0, 0, 0, 180);
  noStroke();
  rect(0, 0, width, height);
  
  // Animation box
  let boxWidth = scaleSize(400);
  let boxHeight = scaleSize(300);
  fill(255, 250, 240);
  stroke(255, 215, 0);
  strokeWeight(scaleSize(5));
  rect(width / 2 - boxWidth / 2, height / 2 - boxHeight / 2, boxWidth, boxHeight, scaleSize(20));
  
  // Title
  fill(255, 215, 0);
  textAlign(CENTER, CENTER);
  textSize(scaleSize(36));
  textFont('serif');
  text("🎉 NEW SKIN UNLOCKED! 🎉", width / 2, height / 2 - scaleSize(100));
  
  // Draw unlocked skin with animation
  push();
  translate(width / 2, height / 2);
  rotate(unlockAnimation.rotation);
  scale(unlockAnimation.scale);
  
  if (airplaneSkins[unlockAnimation.skinIndex]) {
    imageMode(CENTER);
    let skinImg = airplaneSkins[unlockAnimation.skinIndex];
    let displaySize = scaleSize(120);
    let scaleFactor = displaySize / max(skinImg.width, skinImg.height);
    image(skinImg, 0, 0, skinImg.width * scaleFactor, skinImg.height * scaleFactor);
  }
  pop();
  
  // Instructions
  textSize(scaleSize(18));
  fill(139, 69, 19);
  text("Visit Airplane Collection to select this skin!", width / 2, height / 2 + scaleSize(80));
  
  // Progress indicator
  let progress = unlockAnimation.timer / unlockAnimation.duration;
  if (progress < 0.3) {
    textSize(scaleSize(14));
    fill(100, 100, 100);
    text("Press S to open Collection", width / 2, height / 2 + scaleSize(120));
  }
}

// ------------------------------
// Game Over Screen
// ------------------------------
function drawGameOverScreen() {
  // Ghibli-style background
  for (let i = 0; i < height; i++) {
    let inter = map(i, 0, height, 0, 1);
    let c = lerpColor(color(135, 206, 250), color(255, 250, 240), inter);
    stroke(c);
    line(0, i, width, i);
  }
  
  // Draw clouds
  for (let cloud of clouds) {
    cloud.update();
    cloud.draw();
  }

  fill(200, 50, 50);
  stroke(139, 69, 19);
  strokeWeight(scaleSize(5));
  textAlign(CENTER, CENTER);
  textSize(scaleSize(64));
  textFont('serif');
  text("GAME OVER", width / 2, height / 2 - scaleSize(100));

  fill(139, 69, 19);
  textSize(scaleSize(36));
  text(`Final Score: ${score} pts`, width / 2, height / 2 - scaleSize(30));
  
  if (playerName) {
    textSize(scaleSize(24));
    fill(139, 69, 19);
    text(`Great job, ${playerName}!`, width / 2, height / 2 + scaleSize(20));
  }

  textSize(scaleSize(24));
  fill(255, 215, 0);
  stroke(139, 69, 19);
  strokeWeight(scaleSize(3));
  text("Press ENTER to Restart", width / 2, height / 2 + scaleSize(100));
  
  textSize(scaleSize(18));
  fill(139, 69, 19);
  stroke(255, 250, 240);
  strokeWeight(scaleSize(1));
  text("Press L to view Leaderboard", width / 2, height / 2 + scaleSize(140));
  
  // Show leaderboard
  if (showLeaderboard) {
    drawLeaderboard();
  }
}

// ------------------------------
// Key Presses
// ------------------------------
function keyPressed() {
  if (keyCode === ENTER) {
    if (gameState === "LANDING") {
      // Get username
      playerName = nameInput.value();
      if (!playerName || playerName.trim() === "") {
        playerName = "Anonymous";
      }
      // Move to instructions page
      nameInput.hide();
      if (collectionButton) collectionButton.hide();
      if (storyButton) storyButton.hide();
      if (leaderboardButton) leaderboardButton.hide();
      gameState = "INSTRUCTIONS";
    } else if (gameState === "INSTRUCTIONS") {
      // Start the game immediately
      resetGame();
      gameState = "PLAYING";
    } else if (gameState === "START") {
      // Start the game
      resetGame();
      gameState = "PLAYING";
    } else if (gameState === "GAMEOVER") {
      // Save score to leaderboard and return to landing
      saveToLeaderboard(playerName, score);
      nameInput.show();
      if (collectionButton) collectionButton.show();
      if (storyButton) storyButton.show();
      if (leaderboardButton) leaderboardButton.show();
      resetGame();
      gameState = "LANDING";
      selectedMode = "";
    }
  }

  // Toggle leaderboard
  if (keyCode === 76 || keyCode === 108) { // L key
    if (gameState === "LANDING" || gameState === "START" || gameState === "GAMEOVER") {
      showLeaderboard = !showLeaderboard;
      if (showLeaderboard) {
        showSkinSelection = false;
      }
    }
  }
  
  // Toggle skin selection (only in START state or when new skin is unlocked)
  if (keyCode === 83 || keyCode === 115) { // S key
    if (gameState === "START" || gameState === "GAMEOVER" || gameState === "PLAYING") {
      // Only allow opening collection if there are newly unlocked skins or in START/GAMEOVER
      if (gameState === "PLAYING" && newlyUnlockedSkins.length === 0) {
        // Don't allow opening collection during gameplay unless new skin is unlocked
        return;
      }
      showSkinSelection = !showSkinSelection;
      if (showSkinSelection) {
        showLeaderboard = false;
        if (unlockAnimation) {
          unlockAnimation.active = false;
          unlockAnimation = null;
        }
      }
    }
  }
  
  // Select skin with number keys (1-9, 0 for 10, etc.)
  if (showSkinSelection) {
    let skinIndex = -1;
    if (keyCode >= 49 && keyCode <= 57) { // Keys 1-9
      skinIndex = keyCode - 49; // Convert to 0-8
    } else if (keyCode === 48) { // Key 0
      skinIndex = 9;
    }
    
    if (skinIndex >= 0 && skinIndex < airplaneSkins.length) {
      if (unlockedSkins.includes(skinIndex)) {
        // Check if this is a newly unlocked skin (for collection mode)
        if (newlyUnlockedSkins.includes(skinIndex)) {
          // Allow skin change only if it's a newly unlocked skin
          currentSkin = skinIndex;
          plane.setSkin(currentSkin);
          localStorage.setItem('skyCollectorCurrentSkin', currentSkin.toString());
          // Remove from newly unlocked list
          newlyUnlockedSkins = newlyUnlockedSkins.filter(s => s !== skinIndex);
          skinChangeAllowed = true;
          // Close skin selection after choosing
          showSkinSelection = false;
        } else if (gameState === "START" || gameState === "GAMEOVER") {
          // Allow changing to any unlocked skin in START/GAMEOVER states
          currentSkin = skinIndex;
          plane.setSkin(currentSkin);
          localStorage.setItem('skyCollectorCurrentSkin', currentSkin.toString());
          showSkinSelection = false;
        }
        // In PLAYING state, only allow changing to newly unlocked skins
      }
    }
  }
  
  // Fullscreen mode
  if (keyCode === 70 || keyCode === 102) { // F key
    let fs = fullscreen();
    fullscreen(!fs);
  }
  
  // Handle Collection Page
  if (gameState === "COLLECTION_PAGE") {
    // Go back to landing
    if (keyCode === ESCAPE || keyCode === 66 || keyCode === 98) { // ESC or B key
      gameState = "LANDING";
      nameInput.show();
      if (collectionButton) collectionButton.show();
      if (storyButton) storyButton.show();
      if (leaderboardButton) leaderboardButton.show();
    }
    
    // Select skin with number keys (1-9, 0 for 10, etc.)
    let skinIndex = -1;
    if (keyCode >= 49 && keyCode <= 57) { // Keys 1-9
      skinIndex = keyCode - 49; // Convert to 0-8
    } else if (keyCode === 48) { // Key 0
      skinIndex = 9;
    }
    
    if (skinIndex >= 0 && skinIndex < airplaneSkins.length) {
      if (unlockedSkins.includes(skinIndex)) {
        currentSkin = skinIndex;
        plane.setSkin(currentSkin);
        localStorage.setItem('skyCollectorCurrentSkin', currentSkin.toString());
        console.log("Skin selected:", skinIndex);
        // Visual feedback - the selected skin will be highlighted in the next draw cycle
      } else {
        console.log("Skin", skinIndex + 1, "is locked. Unlock at", skinIndex * 100, "points");
      }
    }
  }
  
  // Handle Story Page
  if (gameState === "STORY_PAGE") {
    // Go back to landing
    if (keyCode === ESCAPE || keyCode === 66 || keyCode === 98) { // ESC or B key
      gameState = "LANDING";
      nameInput.show();
      if (leaderboardButton) leaderboardButton.show();
    }
  }
}

// ------------------------------
// Reset Game
// ------------------------------
function resetGame() {
  plane.reset();
  // Keep current skin selection, don't reset to 0
  plane.setSkin(currentSkin);
  stars = [];
  bombs = [];
  hearts_items = [];
  score = 0;
  hearts = 3;
  starTimer = 60;
  bombTimer = 80;
  heartSpawnTimer = 600;
  boostEnergy = 100;
  difficulty = 1;
  difficultyTimer = 0;
  // Don't reset currentSkin - keep player's selection
  // Reset unlock animation and newly unlocked skins
  unlockAnimation = null;
  newlyUnlockedSkins = [];
  skinChangeAllowed = false;
  
  // Reset clouds
  clouds = [];
  for (let i = 0; i < 5; i++) {
    clouds.push(new Cloud());
  }
}

// ------------------------------
// Window Resized
// ------------------------------
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Update name input position when canvas resizes
  updateNameInputPosition();
  
  // Update connect button position
  if (connectButton) {
    connectButton.position(scaleSize(10), scaleSize(10));
  }
  
  // Update button positions
  updateLandingPageButtonPositions();
  if (leaderboardButton && gameState === "LANDING") {
    updateLeaderboardButtonPosition();
  }
  if (collectionButton && storyButton && (gameState === "COLLECTION_PAGE" || gameState === "STORY_PAGE")) {
    updateButtonPositions();
  }
}
