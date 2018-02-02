"use strict";

// INITIALIZATION
// Init a game object if one doesn't exist.
var game = game || {};

function Reel(drawX, spinCompletionCallback) {

  // X location this particular reel draws at
  let DRAW_X = drawX;
  // Height of just one of the three panels on the reel image
  let PANEL_HEIGHT = image('reel').height/3;
  // Uses dt so this is 5 rotations per second max
  let MAX_SPEED = image('reel').height/10;
  // The min speed the reel is allowed to go to while in a spinning state. It
  // will stop itself (0 speed) once a reel clicks into place.
  let MIN_SPEED = MAX_SPEED * 0.025;
  // Current rotation speed in radians
  let speed = 0;
  // How much time the reel has spent at max speed. Enters slowdown mode after
  // a timeToSpendAtMax seconds at max speed.
  let timeAtMaxSpeed = 0;
  // How long the reel should spend at max speed before slowing down.
  // Randomized upon first spinning tick to ensure more random result.
  let timeToSpendAtMax = null;

  // Canvas references. 'canvas' is used for location calculations while 'ctx'
  // is the context which is only used for drawing.
  let canvas = game.engine.getCanvas();
  let ctx = game.engine.getCtx();

  // Transform
  let rotation = Math.round(Math.random() * image('reel').height);
      rotation -= rotation % PANEL_HEIGHT;
  let isSpinning = false;

  // Stores which panel the reel was on at the end of the a frame.
  // Used for playing sounds when we tick over to a new panel.
  let lastPanel = Math.floor(rotation/PANEL_HEIGHT);


  function update(dt) {
    // While below max speed and the state is spinning, speed up
    if (game.engine.getGameState() === game.engine.GAME_STATE.SPINNING) {
      // Re-randmomize timeToSpendAtMax if it's not set (first spinning tick)
      if (!timeToSpendAtMax) {
        timeToSpendAtMax = (Math.random()*0.2) + 0.9;
      }

      if (isSpinning && speed < MAX_SPEED && timeAtMaxSpeed === 0) {
        speed = clamp(speed + dt*50, 0, MAX_SPEED);
      }
      else if (speed === MAX_SPEED && timeAtMaxSpeed < timeToSpendAtMax) {
        timeAtMaxSpeed = clamp(timeAtMaxSpeed + dt, 0, timeToSpendAtMax);
      }
      else if (timeAtMaxSpeed === timeToSpendAtMax) {
        // If the reels reached their crawl speed and the rotation is in line
        // with a panel, stop spinning and rotate to 'lock in' the panel.
        if (speed <= MIN_SPEED && (rotation % PANEL_HEIGHT) <= 5) {
          timeAtMaxSpeed = 0;
          rotation -= rotation % PANEL_HEIGHT;
          isSpinning = false;
          speed = 0;
          spinCompletionCallback();
        }
        // Otherwise just slow down while above the min speed
        else if (speed > MIN_SPEED) {
          speed *= 0.975;
        }
      }
    }
    // We want to always rotate regardless of what's going on
    rotation = (rotation + speed) % image('reel').height;

    // Play a sound if we ticked over to a new slice
    if (Math.floor(rotation/PANEL_HEIGHT) != lastPanel) {
      game.engine.playStream('click.mp3', 0.75);
      lastPanel = Math.floor(rotation/PANEL_HEIGHT);
    }
  }

  function render() {
    ctx.drawImage(image('reel'), DRAW_X, canvas.height*.135 + rotation);
    ctx.drawImage(image('reel'), DRAW_X, canvas.height*.135 + rotation - image('reel').height);
  }

  function spin() {
    isSpinning = true;
  }

  function getFace() {
    return Math.floor(rotation/PANEL_HEIGHT);
  }

  return {
    update,
    render,
    spin,
    getFace
  }
}
