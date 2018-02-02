'use strict';

// INITIALIZATION
// Init a game object if one doesn't exist.
var game = game || {};

// Small getter to make engine interaction easier
function image(name) {
  return game.engine.images[name];
}


game.engine = (function() {

  // An 'enum' of the various game states with friendly forward names (never know if you'll need it);
  const GAME_STATE = {
    IDLE: 'Waiting to spin',
    SPINNING: 'Spinning wheel',
    GAME_OVER: 'Game over'
  }

  // Logic variables
  // Used to control update and game flow
  let canvas, ctx;
  let lastTime = (+new Date);
  let currentGameState = GAME_STATE.IDLE;
  let images = {};
  let numImages = 0;
  let numImagesLoaded = 0;

  // Game objects
  let mouse = {};
  let slotMachine = {};

  // Scoring variables
  let balance = 20;
  const SPIN_COST = 3;


  // Creates the slot machcine and begins the game update loop
  function init() {
    // First thing to do is nab the canvas and its context for drawing
    // Some objects need the canvas set for drawing in their inits
    canvas = document.querySelector('.main-canvas');
    ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Registers event listeners for canvas interaction events (i.e. clicks)
    registerEventListeners();

    slotMachine = new SlotMachine();
    requestAnimationFrame(update);
  }

  // Loads in all images and sounds used by the game using preloadImage.
  // Keeps track of number that have successfully loaded and initializes the
  // game once all are loaded.
  function loadAssets() {
    images['background'] = preloadImage('background.jpg');
    images['slotOverlay'] = preloadImage('slotOverlay.png');
    images['lever'] = preloadImage('lever.png');
    images['reel'] = preloadImage('reel.png');
    images['coin'] = preloadImage('coin.png');

		// Don't initialize until images are loaded
		(function initOnLoad() {
			if (numImagesLoaded >= numImages) {
				init();
      }
			else {
				requestAnimationFrame(initOnLoad);
      }
		}());
	}

	// Preloads an image into a new canvas and returns the canvas. Also increments
  // the numImages and numImagesLoaded variables at the appropriate times to
  // allow the game to track the progress of image loading.
	function preloadImage(src) {
		// Create the image and the canvas to draw it to, then load it in
		let newImg = new Image();
    newImg.src = 'assets/' + src;
		let newCanvas = document.createElement('canvas');
		++numImages;

		// Configure canvas once it's loaded
		newImg.addEventListener('load', function() {
			newCanvas.width = newImg.width;
			newCanvas.height = newImg.height;
			newCanvas.getContext('2d').drawImage(newImg, 0, 0);
			++numImagesLoaded;
		});

		return newCanvas;
	}

	// Play a sound effect at the specified volume.
	function playStream(source, vol) {
		var audioPlayer = new Audio('../' + source);
		audioPlayer.volume = vol;
		audioPlayer.play();
	}

  // Self-calling game update loop
  function update() {
    drawGameState();
    slotMachine.update(calculateDeltaTime());
    postDrawGameState();
    requestAnimationFrame(update);
  }

  // Draws background, overlays, and stats related to the game state.
  function drawGameState() {
    // Background casino image
    ctx.drawImage(images['background'], 0, 0, canvas.width, canvas.height);

    // Darken the background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Balance overlay
    ctx.drawImage(images['coin'], 10, 10);
    fillTextAligned(ctx, 'x' + balance, 90, 65, 24, '#EEE');
  }

  // Draws overlays atop the rest of the game, i.e. 'game over' state
  function postDrawGameState() {
    ctx.save();
    switch (currentGameState) {
      case GAME_STATE.GAME_OVER:
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        fillText(ctx, 'Game Over', canvas.width/2, canvas.height/2, 40, '#EEE');
        fillText(ctx, 'Click to restart', canvas.width/2, canvas.height/2 + 70, 24, '#EEE');
        break;
      case GAME_STATE.IDLE:
        fillTextAligned(ctx, 'Click to spin', canvas.width - 215, 10, 20, '#EEE');
        break;
    }
    ctx.restore();
  }

  // General getters & setters which are exported in the interface for other
  // .objects to use.
  function getGameState() {
    return currentGameState;
  }
  function setGameState(newState) {
    currentGameState = newState;
  }
  function getCtx() {
    return ctx;
  }
  function getCanvas() {
    return canvas;
  }
  function getBalance() {
    return balance;
  }
  function setBalance(newValue) {
    balance = Math.ceil(newValue);
  }
  function modifyBalance(amount) {
    balance += amount;
  }

	// Updates the internal timing variables and returns the delta time since this was last called. Used for animation and physics.
	function calculateDeltaTime() {
		let now, fps;
		now = (+new Date);
		fps = 1000 / (now - lastTime);
		fps = clamp(fps, 12, 60);
		lastTime = now;
		return 1/fps;
	}

  // Listen for canvas clicks for starting the game.
  function registerEventListeners() {
    canvas.addEventListener('mousedown', function(e) {
			e.preventDefault();
      // If game over, reset the game
      if (currentGameState === GAME_STATE.GAME_OVER) {
        currentGameState = GAME_STATE.IDLE;
        balance = 20;
      }
      // If we're idle, clicking starts a spin
      else if (game.engine.getGameState() === game.engine.GAME_STATE.IDLE) {
        game.engine.modifyBalance(-SPIN_COST);
        game.engine.setGameState(game.engine.GAME_STATE.SPINNING);
        slotMachine.spin();
      }
		}.bind(this));
  }

  function getHeightRatio() {
    return heightRatio
  }

	// return public interface for engine module
	return {
    loadAssets,
    playStream,
    images,
    GAME_STATE,
    SPIN_COST,
    getGameState,
    setGameState,
    getCtx,
    getCanvas,
    getBalance,
    setBalance,
    modifyBalance,
    getHeightRatio
	}

}());
