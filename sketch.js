let gameState = "LANDING"; // game state to control the game
let plane;
let stars = [];
let bombs = [];
let score = 0;
let hearts = 3; // set the number of hearts to 3
let starTimer = 0;
let bombTimer = 0;
let boostEnergy = 100; // boost energy to boost the plane up
let boostRecoveryRate = 0.15; // rate at which the boost energy recovers
let boostDrainRate = 1.5; // rate at which the boost energy drains
let difficulty = 1; // difficulty level of the game
let difficultyTimer = 0;
let hearts_items = []; // array to store the heart items
let heartSpawnTimer = 0;
let playerName = "";
let currentSkin = 0;
let clouds = [];
let nameInput;
let leaderboard = [];
let showLeaderboard = false;
let buttonPressed = false;
let collectionButton, storyButton;
let leaderboardButton;
let unlockAnimation = null;
let newlyUnlockedSkins = []; // array to store the newly unlocked skins
let highestScore = 0;

// variables for serial communication
let port;
let connectButton;
let baudrate = 9600;
let sensorValue = 337;
let useSensor = false;

// dimensions for responsive scaling
const BASE_WIDTH = 800;
const BASE_HEIGHT = 600;

// variables for sprites 
let spritesheet;
let airplaneSkins = [];
let unlockedSkins = [0];

// variables for background music
let bgMusicMenu;
let bgMusicPlaying;
let previousGameState = "";
let isFadingOut = false; // flag to check if the background music is fading out or not
let isFadingIn = false;
let fadeSpeed = 0.02;
let targetVolume = 0.5;

// function to preload the images and audio files 
function preload(){
  spritesheet = loadImage("planes.png");
  bgMusicMenu = loadSound("studio_ghibli.mp3");
  bgMusicPlaying = loadSound("spirited_away1.mp3");
}

// function to control the airplane's movement 
function updateControls() {
  let moveUp = false;
  let moveDown = false;
  // detect whether the space bar or the button is pressed or not
  let boosting = keyIsDown(32) || buttonPressed;
  
  // if the sensor is connected and the port is open
  if (useSensor && port && port.opened()) {
    // map the sensor value from the accelerometer to the plane's y position 
    let targetY = map(sensorValue, 285, 380, plane.size / 2, height - plane.size / 2);
    // store the current y position of the plane
    let currentY = plane.y;
    // get the difference 
    let diff = targetY - currentY;
    
    // the plane only moves if the difference is larger than the threshold 
    let threshold = 3;
    if (abs(diff) > threshold) {
      if (diff > 0) {
        moveDown = true;
      } else {
        moveUp = true;
      }
    }
  } else {
    // if the sensor is not connected, then use keyboards to control
    moveUp = keyIsDown(UP_ARROW);
    moveDown = keyIsDown(DOWN_ARROW);
  }
  
  return { moveUp, moveDown, boosting };
}

// function to make the screen responsive
function getScale() {
  return min(width / BASE_WIDTH, height / BASE_HEIGHT);
}

// function to scale the size accordingly
function scaleSize(size) {
  return size * getScale();
}

// function to update the button position so that they are in the right position on the screen regardless of screen size
function updateButtonPositions() {
  if (!collectionButton || !storyButton) return;
  
  // get the canvas element to align the button with the canvas 
  let canvas = document.querySelector('canvas');
  let centerX, centerY;
  if (canvas) {
    let rect = canvas.getBoundingClientRect();
    centerX = rect.left + rect.width / 2;
    centerY = rect.top + rect.height / 2;
  } else {
    // if the canvas is not found, then use the window width and height to center the button
    centerX = windowWidth / 2;
    centerY = windowHeight / 2;
  }
  
  // scale the button size accordingly 
  let buttonWidth = scaleSize(200);
  let buttonSpacing = scaleSize(20);
  
  // set the size and position of the buttons accordingly
  collectionButton.size(buttonWidth, scaleSize(50));
  collectionButton.position(centerX - buttonWidth - buttonSpacing / 2, centerY + scaleSize(20));
  storyButton.size(buttonWidth, scaleSize(50));
  storyButton.position(centerX + buttonSpacing / 2, centerY + scaleSize(20));
}

function updateLeaderboardButtonPosition() {
  if (!leaderboardButton) return;
  
  // get the canvas element
  let canvas = document.querySelector('canvas');
  let centerX, centerY;
  if (canvas) {
    // if the canvas is found, then 
    let rect = canvas.getBoundingClientRect();
    centerX = rect.left + rect.width / 2;
    centerY = rect.top + rect.height / 2;
  } else {

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

// function to update the name input button position according to the window size
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

// function to unlock skins
function loadUnlockedSkins() {
  // get the highest score 
  let savedScore = localStorage.getItem('skyCollectorHighestScore');
  // if there are scores saved, then we parse it into integer and get the score
  if (savedScore !== null) {
    highestScore = parseInt(savedScore);
  } else {
    highestScore = 0;
  }

  // the first skin is always unlocked
  unlockedSkins = [0];
  // unlock the skin every 100 score
  let skinsToUnlock = floor(highestScore / 100) + 1;
  let maxSkins = airplaneSkins.length;
  
  // push the unlocked skins into the array
  for (let i = 1; i < min(skinsToUnlock, maxSkins); i++) {
    unlockedSkins.push(i);
  }
  
  // get the saved skin from the local storage where we store the skins
  let savedSkin = localStorage.getItem('skyCollectorCurrentSkin');
  if (savedSkin !== null) {
    // get the index
    let skinIndex = parseInt(savedSkin);
    if (skinIndex >= 0 && skinIndex < airplaneSkins.length && unlockedSkins.includes(skinIndex)) {
      currentSkin = skinIndex;
      // set the skin to the selected one
      plane.setSkin(currentSkin);
    }
  }
}

// function to save unlocked skins into the local storage 
function saveUnlockedSkins() {
  localStorage.setItem('skyCollectorUnlockedSkins', JSON.stringify(unlockedSkins));
}

// function to unlock skins
function checkAndUnlockSkins(score) {
  // unlock the skins every 100 score, starting from the first skin
  let skinsToUnlock = floor(score / 100) + 1;
  let maxSkins = airplaneSkins.length;
  
  let previousUnlockedCount = unlockedSkins.length;
  
  // check if the skin is already unlocked or not
  for (let i = 0; i < min(skinsToUnlock, maxSkins); i++) {
    if (!unlockedSkins.includes(i)) {
      unlockedSkins.push(i);
      newlyUnlockedSkins.push(i);
      
      // trigger the unlocking animation 
      if (!unlockAnimation) {
        unlockAnimation = {
          active: true,
          skinIndex: i,
          timer: 0,
          duration: 120,
          scale: 0,
          rotation: 0
        };
      }
    }
  }
  
  // sort the skins and save them
  unlockedSkins.sort((a, b) => a - b);
  saveUnlockedSkins();
}

// functions to manage the leaderboard 
function loadLeaderboard() {
  // get the leaderboard from the local storage
  let saved = localStorage.getItem('skyCollectorLeaderboard');
  if (saved) {
    // parse the leaderboard
    leaderboard = JSON.parse(saved);
  } else {
    // if there is no leaderboard, then create a new one
    leaderboard = [];
  }
  // sort the leaderboard by score
  leaderboard.sort((a, b) => b.score - a.score);
}

// function to save the score to the leaderboard 
function saveToLeaderboard(name, score) {
  // if the name is not provided, then set the name to who is this
  if (!name || name.trim() === "") {
    name = "who is this";
  }
  // push the score to the leaderboard
  leaderboard.push({ name: name.trim(), score: score, date: new Date().toLocaleDateString() });
  leaderboard.sort((a, b) => b.score - a.score);

  // keep only the top 10 scores
  if (leaderboard.length > 10) {
    leaderboard = leaderboard.slice(0, 10);
  }
  localStorage.setItem('skyCollectorLeaderboard', JSON.stringify(leaderboard));
  
  // update the highest score 
  if (score > highestScore) {
    highestScore = score;
    localStorage.setItem('skyCollectorHighestScore', highestScore.toString());
    // recalculate the unlocked skins 
    loadUnlockedSkins();
  }
}

// function to handle the background music 
function handleBackgroundMusic() {
  // if the game state changed to the playing mode 
  if (gameState !== previousGameState) {
    if (gameState === "PLAYING") {
      // switch to the playing music 
      switchToPlayingMusic();
    } else {
      // else always play the default music 
      switchToMenuMusic();
    }
    previousGameState = gameState;
  }
  
  // if the music is fading out
  if (isFadingOut) {
    // if the game is in playing mode 
    if (gameState === "PLAYING") {
      // if the menu music is playing
      if (bgMusicMenu.isPlaying()) {
        // get the current volume of the menu music 
        let currentVol = bgMusicMenu.getVolume();
        // calculate the new volume
        let newVol = max(0, currentVol - fadeSpeed);
        bgMusicMenu.setVolume(newVol);
        if (newVol <= 0) {
          bgMusicMenu.stop();
          isFadingOut = false;
          // if the playing music is not playing, then start playing it
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
      // if the backgroud music is playing
      if (bgMusicPlaying.isPlaying()) {
        // get the current volume of the playing music 
        let currentVol = bgMusicPlaying.getVolume();
        let newVol = max(0, currentVol - fadeSpeed);
        // set the new volume
        bgMusicPlaying.setVolume(newVol);
        if (newVol <= 0) {
          bgMusicPlaying.stop();
          isFadingOut = false;
          // if the menu music is not playing, then start playing it
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
  
  // if the music is fading in
  if (isFadingIn) {
    if (gameState === "PLAYING") {
      if (bgMusicPlaying.isPlaying()) {
        let currentVol = bgMusicPlaying.getVolume();
        let newVol = min(targetVolume, currentVol + fadeSpeed);
        // set the new volume
        bgMusicPlaying.setVolume(newVol);
        if (newVol >= targetVolume) {
          isFadingIn = false;
        }
      }
    } else {
      // if the game is not in playing mode, then fade in the menu music
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

// function to switch to the playing music
function switchToPlayingMusic() {
  // if the menu music is playing, then fade it out
  if (bgMusicMenu.isPlaying()) {
    isFadingOut = true;
  } else {
    // if the playing music is not playing, then start playing it
    if (!bgMusicPlaying.isPlaying()) {
      bgMusicPlaying.setVolume(0);
      bgMusicPlaying.loop();
      isFadingIn = true;
    }
  }
}

// function to switch to the menu music
function switchToMenuMusic() {
  // if the playing music is playing, then fade it out
  if (bgMusicPlaying.isPlaying()) {
    isFadingOut = true;
  } else {
    // if the menu music is not playing, then start playing it
    if (!bgMusicMenu.isPlaying()) {
      bgMusicMenu.setVolume(0);
      bgMusicMenu.loop();
      isFadingIn = true;
    }
  }
}

// main function
function setup() {
  createCanvas(windowWidth, windowHeight);
  plane = new Plane();

  // get the width and height of the spritesheet
  let imageWidth = spritesheet.width;
  let imageHeight = spritesheet.height;
  
  // get the number of images in row and col
  let cols = 5;
  let rows = 6;
  let cellWidth = imageWidth / cols;
  let cellHeight = imageHeight / rows;
  
  // some padding between the images
  let padding = 5;
  
  airplaneSkins = [];
  
  // use the template from the class slides 
  // extract each plane from the spritesheet
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // get the position and the size of each image 
      let x = col * cellWidth + padding;
      let y = row * cellHeight + padding;
      let w = cellWidth - (padding * 2);
      let h = cellHeight - (padding * 2);
      
      // ensure we don't go outside the image bounds
      x = max(0, min(x, imageWidth - w));
      y = max(0, min(y, imageHeight - h));
      w = min(w, imageWidth - x);
      h = min(h, imageHeight - y);
      
      // extract the image if it is not empty
      if (w > 0 && h > 0) {
        let img = spritesheet.get(x, y, w, h);
        airplaneSkins.push(img);
      }
    }
  }

  // load the unlocked skins from the local storage
  loadUnlockedSkins();
  
  // create the username input field
  nameInput = createInput('');
  nameInput.size(scaleSize(300));
  nameInput.style('font-size', scaleSize(20) + 'px');
  nameInput.style('text-align', 'center');
  nameInput.style('padding', scaleSize(10) + 'px');
  nameInput.style('border', scaleSize(3) + 'px solid brown');
  nameInput.style('border-radius', scaleSize(10) + 'px');
  nameInput.style('background-color', '#FFF8DC');
  nameInput.style('font-family', 'serif');
  nameInput.attribute('placeholder', 'Enter your name');
  updateNameInputPosition();
  nameInput.show();
  
  // create the collection button
  collectionButton = createButton('Plane Collection');
  collectionButton.size(scaleSize(200), scaleSize(50));
  collectionButton.style('font-size', scaleSize(18) + 'px');
  collectionButton.style('padding', scaleSize(10) + 'px');
  collectionButton.style('border', scaleSize(3) + 'px solid brown');
  collectionButton.style('border-radius', scaleSize(10) + 'px');
  collectionButton.style('background-color', '#FFF8DC');
  collectionButton.style('font-family', 'serif');
  collectionButton.style('cursor', 'pointer');
  collectionButton.style('z-index', '1000');
  // when the collection button is pressed, hide all other buttons and show the collection page
  collectionButton.mousePressed(function() {
    gameState = "COLLECTION_PAGE";
    nameInput.hide();
    collectionButton.hide();
    if (storyButton) storyButton.hide();
    if (leaderboardButton) leaderboardButton.hide();
  });
  collectionButton.hide();
  
  // create the story button
  storyButton = createButton('Wind Rises Story');
  storyButton.size(scaleSize(200), scaleSize(50));
  storyButton.style('font-size', scaleSize(18) + 'px');
  storyButton.style('padding', scaleSize(10) + 'px');
  storyButton.style('border', scaleSize(3) + 'px solid brown');
  storyButton.style('border-radius', scaleSize(10) + 'px');
  storyButton.style('background-color', '#FFF8DC');
  storyButton.style('font-family', 'serif');
  storyButton.style('cursor', 'pointer');
  storyButton.style('z-index', '1000');
  // when the story button is pressed, hide all other buttons and show the story page
  storyButton.mousePressed(function() {
    gameState = "STORY_PAGE";
    nameInput.hide();
    if (collectionButton) collectionButton.hide();
    storyButton.hide();
  });
  storyButton.hide();
  
  // create the leaderboard button
  leaderboardButton = createButton('Leaderboard');
  leaderboardButton.size(scaleSize(200), scaleSize(50));
  leaderboardButton.style('font-size', scaleSize(18) + 'px');
  leaderboardButton.style('padding', scaleSize(10) + 'px');
  leaderboardButton.style('border', scaleSize(3) + 'px solid brown');
  leaderboardButton.style('border-radius', scaleSize(10) + 'px');
  leaderboardButton.style('background-color', '#FFF8DC');
  leaderboardButton.style('font-family', 'serif');
  leaderboardButton.style('cursor', 'pointer');
  leaderboardButton.style('z-index', '1000');
  // when the leaderboard button is pressed, show the leaderboard
  leaderboardButton.mousePressed(function() {
    showLeaderboard = !showLeaderboard;
  });
  leaderboardButton.hide();
  
  // create the serial communication
  port = createSerial(); 
  
  
  // try opening previously used port
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
  
  // load the leaderboard
  loadLeaderboard();
  
  // create 5 clouds at the beginning
  for (let i = 0; i < 5; i++) {
    clouds.push(new Cloud());
  }
  
  // initialize the background music
  previousGameState = gameState;
  if (bgMusicMenu && !bgMusicMenu.isPlaying()) {
    bgMusicMenu.setVolume(targetVolume);
    bgMusicMenu.loop();
  }
}

// function to connect to the serial port
function connectSerial() {
  if (!port.opened()) {
    // open the port
    port.open(baudrate);
    useSensor = true;
  } else {
    // close the port
    port.close();
    useSensor = false;
  }
}

// function to read sensor values 
function readSerialValue() {
  let str = port.readUntil("\n");
  if (str.length > 0) {
    str = str.trim();

    // expect the string to be in the format of "ACC:400,BTN:0"
    let parts = str.split(",");

    // if the string is in the right format
    if (parts.length === 2) {
      // get the accelerometer value
      let accelerometerValue = parseInt(parts[0].split(":")[1]);
      // get the button value
      let buttonValue = parseInt(parts[1].split(":")[1]);

      if (!isNaN(accelerometerValue)) sensorValue = accelerometerValue;
      if (!isNaN(buttonValue)) buttonPressed = (buttonValue === 1);
      
      useSensor = true;
    }
  }
}

function draw() {
  // read the serial value
  if (port && port.opened()) {
    readSerialValue();
  }

  // check if the port is open or not
  if (port.opened()) {
    console.log("port is open");
  } else {
    console.log("port is CLOSED");
  }

  console.log("sensorValue =", sensorValue);

  // handle the background music
  handleBackgroundMusic();
  
  // update the connect button based on the connection status
  if (connectButton) {
    if (!port || !port.opened()) {
      connectButton.html("Connect Serial");
      connectButton.style('background-color', '#4CAF50');
    } else {
      connectButton.html("Disconnect Serial");
      connectButton.style('background-color', '#f44336');
    }
  }
  
  // draw the game state
  if (gameState === "LANDING") {
    drawLandingPage();
  } else if (gameState === "INSTRUCTIONS") {
    drawInstructionsPage();
  } else if (gameState === "PLAYING") {
    playGame();
  } else if (gameState === "GAMEOVER") {
    drawGameOverScreen();
  } else if (gameState === "COLLECTION_PAGE"){
    drawCollectionPage(); 
  } else if (gameState === "STORY_PAGE"){
    drawStoryPage(); 
  }
  
  // check and unlock skins based on the score (every 100 points)
  checkAndUnlockSkins(score);
  
  // update the unlock animation
  if (unlockAnimation && unlockAnimation.active) {
    unlockAnimation.timer++;
    unlockAnimation.scale = sin(unlockAnimation.timer * 0.1) * 0.3 + 1.0;
    unlockAnimation.rotation += 0.05;
    
    // if the timer is greater than the duration, then deactivate the animation
    if (unlockAnimation.timer >= unlockAnimation.duration) {
      unlockAnimation.active = false;
      unlockAnimation = null;
    }
  }

}

// function to draw the landing page
function drawLandingPage() {
  // draw a gradient background (ghibli-style)
  for (let i = 0; i < height; i++) {
    let inter = map(i, 0, height, 0, 1);
    let c = lerpColor(color(135, 206, 250), color(255, 250, 240), inter);
    stroke(c);
    line(0, i, width, i);
  }
  
  // draw the clouds
  for (let cloud of clouds) {
    cloud.update();
    cloud.draw();
  }
  
  // draw the title
  fill(255, 255, 240);
  stroke(139, 69, 19);
  strokeWeight(scaleSize(5));
  textAlign(CENTER, CENTER);
  textSize(scaleSize(56));
  textFont('serif');
  text("Tokyo Flight", width / 2, height / 2 - scaleSize(200));
  
  textSize(scaleSize(32));
  fill(255, 255, 240);
  text("Inspired by Wind Rises", width / 2, height / 2 - scaleSize(150));
  
  // draw the username input instruction
  textSize(scaleSize(20));
  fill(139, 69, 19);
  stroke(255, 255, 240);
  strokeWeight(scaleSize(2));
  text("Please enter your name to start the game", width / 2, height / 2 - scaleSize(80));
  
  // update and show the input field
  updateNameInputPosition();
  nameInput.show();
  
  // show all buttons on the landing page
  updateLandingPageButtonPositions();
  if (collectionButton) collectionButton.show();
  if (storyButton) storyButton.show();
  if (leaderboardButton) leaderboardButton.show();
  
  // draw the instructions
  textSize(scaleSize(18));
  fill(139, 69, 19);
  stroke(255, 255, 240);
  strokeWeight(scaleSize(1));
  text("Press enter to continue", width / 2, height / 2 + scaleSize(200));
  
  // show the leaderboard if active
  if (showLeaderboard) {
    drawLeaderboard();
  }
}

// function to draw the instructions page
function drawInstructionsPage() {
  // draw a gradient background (ghibli-style)
  for (let i = 0; i < height; i++) {
    let inter = map(i, 0, height, 0, 1);
    let c = lerpColor(color(135, 206, 250), color(255, 250, 240), inter);
    stroke(c);
    line(0, i, width, i);
  }
  
  // draw the clouds
  for (let cloud of clouds) {
    cloud.update();
    cloud.draw();
  }
  
  // draw the title
  fill(255, 255, 240);
  stroke(139, 69, 19);
  strokeWeight(scaleSize(4));
  textAlign(CENTER, CENTER);
  textSize(scaleSize(40));
  textFont('serif');
  text("How to Play", width / 2, height * 0.15);
  
  // draw the instructions container
  textAlign(LEFT, TOP);
  
  // draw the goal section
  textSize(scaleSize(22));
  fill(139, 69, 19);
  stroke(255, 255, 240);
  strokeWeight(scaleSize(1));
  let goalY = height * 0.25;
  text("🏆 Goal", width / 2 - scaleSize(280), goalY);
  
  textSize(scaleSize(18));
  fill(139, 69, 19);
  noStroke();
  text("Collect as many stars as you can!!!", width / 2 - scaleSize(280), goalY + scaleSize(35));
  
  // draw the how to play section
  textSize(scaleSize(22));
  fill(139, 69, 19);
  stroke(255, 255, 240);
  strokeWeight(scaleSize(1));
  let playY = height * 0.40;
  text("🎮 How to Play", width / 2 - scaleSize(280), playY);
  
  // draw the instructions list
  textSize(scaleSize(18));
  fill(139, 69, 19);
  noStroke();
  let instructions = [
    "• Tilt your plane up or down to move it vertically on the screen.",
    "• Press the boost button to speed up!",
    "• Avoid bombs as much as possible since getting hit will cost you one heart.",
    "• You start with 3 hearts",
    "• Collect heart items to restore your hearts.",
    "• Finally and most importantly, enjoy your experienced as an aviation engineer!"
  ];
  
  // draw the instructions list
  let instructionStartY = playY + scaleSize(40);
  for (let i = 0; i < instructions.length; i++) {
    text(instructions[i], width / 2 - scaleSize(280), instructionStartY + i * scaleSize(32));
  }
  
  // draw the continue button
  textAlign(CENTER, CENTER);
  textSize(scaleSize(24));
  fill(255, 215, 0);
  stroke(139, 69, 19);
  strokeWeight(scaleSize(3));
  text("Press ENTER to Start Game", width / 2, height * 0.85);
  
  // hide the input and buttons
  if (nameInput) nameInput.hide();
  if (collectionButton) collectionButton.hide();
  if (storyButton) storyButton.hide();
}

// function to draw the collection page
function drawCollectionPage() {
  // draw a gradient background (ghibli-style)
  for (let i = 0; i < height; i++) {
    let inter = map(i, 0, height, 0, 1);
    let c = lerpColor(color(135, 206, 250), color(255, 250, 240), inter);
    stroke(c);
    line(0, i, width, i);
  }
  
  // draw the clouds
  for (let cloud of clouds) {
    cloud.update();
    cloud.draw();
  }
  
  // draw the title
  fill(255, 255, 240);
  stroke(139, 69, 19);
  strokeWeight(scaleSize(4));
  textAlign(CENTER, CENTER);
  textSize(scaleSize(36));
  textFont('serif');
  text("✈️ Airplane Collection", width / 2, height * 0.08);
  
  // display the highest score and the number of unlocked skins
  textSize(scaleSize(16));
  fill(139, 69, 19);
  stroke(255, 255, 240);
  strokeWeight(scaleSize(1));
  text(`Highest Score: ${highestScore} points`, width / 2, height * 0.13);
  text(`Unlocked: ${unlockedSkins.length}/${airplaneSkins.length} skins`, width / 2, height * 0.16);
  
  // display the skins in a grid - calculate responsive sizing
  let cols = 5; // Reduced columns for more space
  let totalRows = ceil(airplaneSkins.length / cols);
  
  // calculate the available space
  let topMargin = height * 0.30; 
  let bottomMargin = height * 0.25; 
  let availableHeight = height - topMargin - bottomMargin;
  // use 95% of the width
  let availableWidth = width * 0.95;
  
  // calculate the optimal skin size and spacing
  let maxSkinSize = min(availableWidth / cols * 1.1, availableHeight / totalRows * 0.85);
  let skinSize = min(scaleSize(90), maxSkinSize);
  // increase the spacing in between each box
  let horizontalSpacing = skinSize * 4;
  let verticalSpacing = skinSize * 2.7;
  
  let startX = width / 2 - (cols - 1) * horizontalSpacing / 2;
  let startY = topMargin;
  
  // draw the skins in the grid
  for (let i = 0; i < airplaneSkins.length; i++) {
    let col = i % cols;
    let row = floor(i / cols);
    let x = startX + col * horizontalSpacing;
    let y = startY + row * verticalSpacing;
    
    // skip drawing if outside visible area
    if (y + skinSize/2 + 50 > height - bottomMargin) {
      continue;
    }
    
    let isUnlocked = unlockedSkins.includes(i);
    let isSelected = currentSkin === i;
    
    // draw the skin preview
    push();
    translate(x, y);
    
    // draw the background box
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
    
    // draw the "SELECTED" label for selected skin
    if (isSelected) {
      fill(139, 69, 19);
      textSize(scaleSize(12));
      textAlign(CENTER, CENTER);
      noStroke();
      text("✅ SELECTED", 0, -skinSize/2 - 18);
    }
    
    // draw the sprite
    if (isUnlocked && airplaneSkins[i]) {
      imageMode(CENTER);
      let scaleFactor = (skinSize * 0.7) / max(airplaneSkins[i].width, airplaneSkins[i].height);
      image(airplaneSkins[i], 0, 0, airplaneSkins[i].width * scaleFactor, airplaneSkins[i].height * scaleFactor);
    } else {
      // draw the locked icon
      fill(150, 150, 150);
      textSize(scaleSize(30));
      textAlign(CENTER, CENTER);
      text("🔒", 0, 0);
    }
    
    // draw the skin number and status
    noStroke();
    fill(139, 69, 19);
    textSize(scaleSize(14));
    textAlign(CENTER, CENTER);
    text(`Skin ${i + 1}`, 0, skinSize/2 + 20);
    
    pop();
  }
  
  // draw the instructions
  textAlign(CENTER, CENTER);
  textSize(scaleSize(14));
  fill(139, 69, 19);
  stroke(255, 255, 240);
  strokeWeight(scaleSize(1));
  text("Press number keys (1-" + min(airplaneSkins.length, 9) + (airplaneSkins.length > 9 ? ", 0 for 10+" : "") + ") to select unlocked skin", width / 2, height * 0.8);
  
  // draw the current selection
  if (currentSkin >= 0 && currentSkin < airplaneSkins.length) {
    textSize(scaleSize(14));
    fill(255, 215, 0);
    stroke(139, 69, 19);
    strokeWeight(scaleSize(1));
    text(`Currently selected: Skin ${currentSkin + 1}`, width / 2, height * 0.88);
  }
  
  // draw the instructions
  textSize(scaleSize(14));
  fill(139, 69, 19);
  stroke(255, 255, 240);
  strokeWeight(scaleSize(1));
  text("Press ESC or B to go back to the main page", width / 2, height * 0.92);
}

// function to draw the story page
function drawStoryPage() {
  // draw a gradient background (ghibli-style)
  for (let i = 0; i < height; i++) {
    let inter = map(i, 0, height, 0, 1);
    let c = lerpColor(color(135, 206, 250), color(255, 250, 240), inter);
    stroke(c);
    line(0, i, width, i);
  }
  
  // draw the clouds
  for (let cloud of clouds) {
    cloud.update();
    cloud.draw();
  }
  
  // draw the title
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
  
  // draw the story about the film
  textAlign(LEFT, TOP);
  textSize(scaleSize(16));
  fill(139, 69, 19);
  stroke(255, 255, 240);
  strokeWeight(scaleSize(1));
  
  let storyText = [
    "“The Wind Rises” is a 2013 Studio Ghibli film directed by Hayao Miyazaki.",
    "The movie talks about the life of Jirō Horikoshi, the aviation engineer who designed fighter",
    "aircraft for World War II.",
    "",
    "Since childhood, Jirō has been pursuing his dream of becoming an aviation engineer.",
    "The film also talks about his romantic relationship with Nahoko, who suffers",
    "from a serious illness.",
    "",
    "Through Jirō’s journey, the movie beautifully depicts the harsh realities",
    "of war, and the authentic, beautiful connections",
    "between people."
  ];
  
  // draw the story text
  let startY = height / 2 - scaleSize(150);
  for (let i = 0; i < storyText.length; i++) {
    text(storyText[i], width / 2 - scaleSize(350), startY + i * scaleSize(25));
  }
  
  // draw the back button
  textAlign(CENTER, CENTER);
  textSize(scaleSize(18));
  fill(139, 69, 19);
  stroke(255, 255, 240);
  strokeWeight(scaleSize(1));
  text("Press ESC or B to go back", width / 2, height / 2 + scaleSize(200));
  
  // hide the leaderboard button on the story page
  if (leaderboardButton) leaderboardButton.hide();
  if (collectionButton) collectionButton.hide();
  if (storyButton) storyButton.hide();
  if (nameInput) nameInput.hide();
}
  
// function to draw the leaderboard
function drawLeaderboard() {
  // hide all buttons and name input as well when the leaderboard is shown
  if (leaderboardButton) leaderboardButton.hide();
  if (collectionButton) collectionButton.hide();
  if (storyButton) storyButton.hide();
  if (nameInput) nameInput.hide();
  
  // draw the background overlay
  fill(0, 0, 0, 150);
  noStroke();
  rect(0, 0, width, height);
  
  // draw the leaderboard box
  let boxWidth = scaleSize(500);
  let boxHeight = scaleSize(400);
  fill(255, 250, 240);
  strokeWeight(scaleSize(4));
  rect(width / 2 - boxWidth / 2, height / 2 - boxHeight / 2, boxWidth, boxHeight, scaleSize(20));
  
  // draw the title
  fill(139, 69, 19);
  textAlign(CENTER, CENTER);
  textSize(scaleSize(32));
  text("🏆 Leaderboard", width / 2, height / 2 - scaleSize(160));
  
  // draw the rankings
  textSize(scaleSize(20));
  fill(139, 69, 19);
  textAlign(LEFT, CENTER);
  
  // draw the rankings
  if (leaderboard.length === 0) {
    textAlign(CENTER, CENTER);
    text("No records yet", width / 2, height / 2);
  } else {
    let startY = height / 2 - scaleSize(100);
    // go through each entry in the leaderboard
    for (let i = 0; i < min(leaderboard.length, 10); i++) {
      let entry = leaderboard[i];
      let y = startY + i * scaleSize(30);
      
      // draw the rank
      fill(139, 69, 19);
      text(`${i + 1}.`, width / 2 - scaleSize(220), y);
      
      // draw the name
      fill(50, 50, 50);
      text(entry.name, width / 2 - scaleSize(180), y);
      
      // draw the score
      fill(200, 50, 50);
      textAlign(RIGHT, CENTER);
      text(`${entry.score} pts`, width / 2 + scaleSize(200), y);
      textAlign(LEFT, CENTER);
    }
  }
  
  // draw the close button
  textAlign(CENTER, CENTER);
  textSize(scaleSize(18));
  fill(139, 69, 19);
  text("Press L to close", width / 2, height / 2 + scaleSize(150));
}

// function to draw the game
function playGame() {
  // draw a gradient background (ghibli-style)
  for (let i = 0; i < height; i++) {
    let inter = map(i, 0, height, 0, 1);
    let c = lerpColor(color(135, 206, 250), color(255, 250, 240), inter);
    stroke(c);
    line(0, i, width, i);
  }
  
  // draw the clouds
  for (let cloud of clouds) {
    cloud.update();
    cloud.draw();
  }

  let controls = updateControls();

  // check if the plane is boosting and if the boost energy is greater than 0
  if (controls.boosting && boostEnergy > 0) {
    boostEnergy -= boostDrainRate;
    boostEnergy = max(0, boostEnergy);
  } else if (!controls.boosting && boostEnergy < 100) {
    boostEnergy += boostRecoveryRate;
    boostEnergy = min(100, boostEnergy);
  }

  // update the plane
  plane.update(controls.moveUp, controls.moveDown);
  // draw the plane
  plane.draw();

  // update the difficulty timer
  difficultyTimer++;
  if (difficultyTimer >= 900) {
    // increase the difficulty
    difficulty += 0.2;
    // reset the difficulty timer
    difficultyTimer = 0;
  }

  // spawn stars
  starTimer--;
  if (starTimer <= 0) {
    stars.push(new Star());
    starTimer = random(10, 30) / difficulty;
  }

  // spawn bombs
  bombTimer--;
  if (bombTimer <= 0) {
    bombs.push(new Bomb());
    // increase bomb frequency by shortening the spawn interval
    bombTimer = random(10, 30) / difficulty;
  }

  // spawn hearts
  heartSpawnTimer--;
  if (heartSpawnTimer <= 0) {
    hearts_items.push(new HeartItem());
    heartSpawnTimer = random(600, 1200);
  }

  // update stars
  for (let i = stars.length - 1; i >= 0; i--) {
    stars[i].update();
    stars[i].draw();

    if (plane.collidesWith(stars[i])) {
      score += 10;
      stars.splice(i, 1);
      // send signal (1, 0) to Arduino to light up LEDs when star is collected
      if (port && port.opened()) {
        port.write('1');
      }
      continue;
    }

    if (stars[i].offScreen()) stars.splice(i, 1);
  }

  // update bombs
  for (let i = bombs.length - 1; i >= 0; i--) {
    bombs[i].update();
    bombs[i].draw();

    // if the plane collides with a bomb, decrease the number of hearts and remove the bomb
    if (plane.collidesWith(bombs[i])) {
      hearts--;
      bombs.splice(i, 1);

      // if the number of hearts is less than or equal to 0, end the game
      if (hearts <= 0) {
        gameState = "GAMEOVER";
      }
      continue;
    }

    // if the bomb is off the screen, remove it
    if (bombs[i].offScreen()) bombs.splice(i, 1);
  }

  // update heart items
  for (let i = hearts_items.length - 1; i >= 0; i--) {
    hearts_items[i].update();
    hearts_items[i].draw();

    // if the plane collides with a heart item, increase the number of hearts and remove the heart item
    if (plane.collidesWith(hearts_items[i])) {
      hearts = min(hearts + 1, 3);
      hearts_items.splice(i, 1);
      continue;
    }

    // if the heart item is off the screen, remove it
    if (hearts_items[i].offScreen()) hearts_items.splice(i, 1);
  }

  drawUI();
  
  // draw the unlock animation
  if (unlockAnimation && unlockAnimation.active) {
    drawUnlockAnimation();
  }
}

// function to draw the UI
function drawUI() {
  // calculate the dimensions of the connect serial button
  let buttonHeight = scaleSize(40); 
  let buttonWidth = scaleSize(140); 
  let scoreY = scaleSize(10) + buttonHeight + scaleSize(10);
  
  // draw the score text
  fill(255);
  stroke(0);
  strokeWeight(scaleSize(3));
  textAlign(LEFT, TOP);
  textSize(scaleSize(24));
  text(`Score: ${score}`, scaleSize(20), scoreY);

  // draw the hearts section
  textAlign(RIGHT, TOP);
  textSize(scaleSize(20));
  fill(255);
  stroke(0);
  strokeWeight(scaleSize(2));
  
  // calculate the position of the hearts to avoid overlap
  let heartsLabelX = width - scaleSize(20);
  let heartIconSize = scaleSize(20);
  let heartSpacing = scaleSize(25); 
  let heartsStartX = heartsLabelX - (hearts * heartSpacing);
  
  text("Hearts:", heartsStartX - scaleSize(10), scaleSize(20));
  
  // draw the heart icons with proper spacing
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

  // draw the boost section
  textAlign(LEFT, TOP);
  textSize(scaleSize(16));
  stroke(139, 69, 19);
  fill(255, 250, 240);
  text("Boost:", scaleSize(20), scoreY + scaleSize(35));

  noFill();
  stroke(139, 69, 19);
  strokeWeight(scaleSize(2));
  rect(scaleSize(80), scoreY + scaleSize(35), scaleSize(120), scaleSize(15), scaleSize(5));

  // draw the boost energy bar and change color based on the boost energy
  let energyColor =
    boostEnergy > 66 ? color(100, 200, 100) :
    boostEnergy > 33 ? color(255, 200, 100) :
                       color(255, 150, 100);

  fill(energyColor);
  noStroke();
  rect(scaleSize(80), scoreY + scaleSize(35), (boostEnergy / 100) * scaleSize(120), scaleSize(15), scaleSize(5));
  
  // draw the skin info
  textSize(scaleSize(14));
  fill(255, 250, 240);
  stroke(139, 69, 19);
  strokeWeight(scaleSize(1));
  text(`Skin: ${currentSkin + 1}/${airplaneSkins.length}`, scaleSize(20), scoreY + scaleSize(65));
  let nextUnlockScore = (unlockedSkins.length) * 100;
  // draw the next skin info
  if (unlockedSkins.length < airplaneSkins.length) {
    let pointsNeeded = nextUnlockScore - score;
    if (pointsNeeded > 0) {
      text(`Next skin in: ${pointsNeeded} pts`, scaleSize(20), scoreY + scaleSize(85));
    } else {
      // if all skins are unlocked, draw the text "All skins are unlocked! Great Job!"
      text(`All skins are unlocked! Great Job!`, scaleSize(20), scoreY + scaleSize(85));
    }
  } else {
    // if all skins are unlocked, draw the text "All skins are unlocked! Great Job!"
    text(`All skins are unlocked! Great Job!`, scaleSize(20), scoreY + scaleSize(85));
  }
  
  // draw the fullscreen button hint
  textSize(scaleSize(12));
  fill(139, 69, 19);
  stroke(255, 250, 240);
  strokeWeight(scaleSize(1));
  text("F: Fullscreen", width - scaleSize(150), height - scaleSize(30));
  
  // draw the sensor status
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
    text("Use ↑/↓ keys", scaleSize(20), height - scaleSize(15));
  }
}

// function to draw the unlock animation
function drawUnlockAnimation() {
  if (!unlockAnimation || !unlockAnimation.active) return;
  
  // draw a semi-transparent overlay
  fill(0, 0, 0, 180);
  noStroke();
  rect(0, 0, width, height);
  
  // draw the animation box
  let boxWidth = scaleSize(400);
  let boxHeight = scaleSize(300);
  fill(255, 250, 240);
  stroke(255, 215, 0);
  strokeWeight(scaleSize(5));
  rect(width / 2 - boxWidth / 2, height / 2 - boxHeight / 2, boxWidth, boxHeight, scaleSize(20));
  
  // draw the title
  fill(255, 215, 0);
  textAlign(CENTER, CENTER);
  textSize(scaleSize(36));
  textFont('serif');
  text("🎉 NEW SKIN UNLOCKED!", width / 2, height / 2 - scaleSize(100));
  
  // draw the unlocked skin with animation
  push();
  translate(width / 2, height / 2);
  rotate(unlockAnimation.rotation);
  scale(unlockAnimation.scale);
  
  // draw the unlocked skin
  if (airplaneSkins[unlockAnimation.skinIndex]) {
    imageMode(CENTER);
    let skinImg = airplaneSkins[unlockAnimation.skinIndex];
    let displaySize = scaleSize(120);
    let scaleFactor = displaySize / max(skinImg.width, skinImg.height);
    image(skinImg, 0, 0, skinImg.width * scaleFactor, skinImg.height * scaleFactor);
  }
  pop();
  
  // draw the instructions
  textSize(scaleSize(18));
  fill(139, 69, 19);
  text("Visit Airplane Collection to select this skin!", width / 2, height / 2 + scaleSize(80));
  
  // draw the progress indicator
  let progress = unlockAnimation.timer / unlockAnimation.duration;
  if (progress < 0.3) {
    textSize(scaleSize(14));
    fill(100, 100, 100);
    text("Press S to open Collection", width / 2, height / 2 + scaleSize(120));
  }
}

// function to draw the game over screen
function drawGameOverScreen() {
  // draw a gradient background (ghibli-style)
  for (let i = 0; i < height; i++) {
    let inter = map(i, 0, height, 0, 1);
    let c = lerpColor(color(135, 206, 250), color(255, 250, 240), inter);
    stroke(c);
    line(0, i, width, i);
  }
  
  // draw the clouds
  for (let cloud of clouds) {
    cloud.update();
    cloud.draw();
  }

  // draw the game over text
  fill(200, 50, 50);
  stroke(139, 69, 19);
  textAlign(CENTER, CENTER);
  textSize(scaleSize(64));
  textFont('serif');
  text("GAME OVER", width / 2, height / 2 - scaleSize(100));

  fill(139, 69, 19);
  textSize(scaleSize(36));
  text(`Final Score: ${score} pts`, width / 2, height / 2 - scaleSize(30));
  
  // draw the player name
  if (playerName) {
    textSize(scaleSize(24));
    fill(139, 69, 19);
    text(`You are a nice aviator, ${playerName}!`, width / 2, height / 2 + scaleSize(20));
  }

  textSize(scaleSize(24));
  fill(255, 215, 0);
  stroke(139, 69, 19);
  text("Press ENTER to Restart", width / 2, height / 2 + scaleSize(100));
  
  textSize(scaleSize(18));
  fill(139, 69, 19);
  stroke(255, 250, 240);
  text("Press L to view Leaderboard", width / 2, height / 2 + scaleSize(140));
  
  // show the leaderboard if active
  if (showLeaderboard) {
    drawLeaderboard();
  }
}

// function to handle the key presses
function keyPressed() {
  if (keyCode === ENTER) {
    if (gameState === "LANDING") {
      // get the username
      playerName = nameInput.value();
      if (!playerName || playerName.trim() === "") {
        playerName = "Anonymous";
      }
      // move to the instructions page
      nameInput.hide();
      // hide all buttons on the landing page
      if (collectionButton) collectionButton.hide();
      if (storyButton) storyButton.hide();
      if (leaderboardButton) leaderboardButton.hide();
      gameState = "INSTRUCTIONS";
    } else if (gameState === "INSTRUCTIONS") {
      // start the game immediately
      resetGame();
      gameState = "PLAYING";
    } else if (gameState === "GAMEOVER") {
      // save the score to the leaderboard and return to the landing page
      saveToLeaderboard(playerName, score);
      nameInput.show();
      // show all buttons on the landing page
      if (collectionButton) collectionButton.show();
      if (storyButton) storyButton.show();
      if (leaderboardButton) leaderboardButton.show();
      resetGame();
      gameState = "LANDING";
    }
  }

  // toggle the leaderboard
  if (keyCode === 76 || keyCode === 108) { // L key
    if (gameState === "LANDING" || gameState === "GAMEOVER") {
      showLeaderboard = !showLeaderboard;
    }
  }
  
  // toggle the fullscreen mode
  if (keyCode === 70 || keyCode === 102) { // F key
    let fs = fullscreen();
    fullscreen(!fs);
  }
  
  // handle the collection page
  if (gameState === "COLLECTION_PAGE") {
    // go back to the landing page
    if (keyCode === ESCAPE || keyCode === 66 || keyCode === 98) { // ESC or B key
      gameState = "LANDING";
      nameInput.show();
      if (collectionButton) collectionButton.show();
      if (storyButton) storyButton.show();
      if (leaderboardButton) leaderboardButton.show();
    }
    
    // select the skin with the number keys
    let skinIndex = -1;
    // if the key is a number key, then set the skin index to the key code minus 49
    if (keyCode >= 49 && keyCode <= 57) { 
      skinIndex = keyCode - 49;
    } else if (keyCode === 48) {
      skinIndex = 9;
    }

    // if the skin index is valid, then set the current skin to the skin index
    if (skinIndex >= 0 && skinIndex < airplaneSkins.length) {
      if (unlockedSkins.includes(skinIndex)) {
        currentSkin = skinIndex;
        plane.setSkin(currentSkin);
        localStorage.setItem('skyCollectorCurrentSkin', currentSkin.toString());
        console.log("Skin selected:", skinIndex);
        // draw the selected skin in the next draw cycle
      } else {
        console.log("Skin", skinIndex + 1, "is locked. Unlock at", skinIndex * 100, "points");
      }
    }
  }
  
  // handle the story page
  if (gameState === "STORY_PAGE") {
    // go back to the landing page
    if (keyCode === ESCAPE || keyCode === 66 || keyCode === 98) { // ESC or B key
      gameState = "LANDING";
      nameInput.show();
      if (leaderboardButton) leaderboardButton.show();
    }
  }
}

// function to reset the game
function resetGame() {
  plane.reset();
  // keep the current skin selection, don't reset to 0 though
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
  // reset the unlock animation and newly unlocked skins
  unlockAnimation = null;
  newlyUnlockedSkins = [];
  
  // reset the clouds
  clouds = [];
  for (let i = 0; i < 5; i++) {
    clouds.push(new Cloud());
  }
}

// function to handle resizing the window
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // update the name input position when the canvas resizes
  updateNameInputPosition();
  
  // update the connect button position
  if (connectButton) {
    connectButton.position(scaleSize(10), scaleSize(10));
  }
  
  // update the button positions
  updateLandingPageButtonPositions();
  if (leaderboardButton && gameState === "LANDING") {
    updateLeaderboardButtonPosition();
  }
  // update the button positions for the landing page
  if (collectionButton && storyButton && (gameState === "COLLECTION_PAGE" || gameState === "STORY_PAGE")) {
    updateButtonPositions();
  }
}
