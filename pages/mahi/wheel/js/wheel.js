"use strict";

// INITIALIZATION
// Init a game object if one doesn't exist.
var game = game || {};

function Wheel() {

  // Wheel's circumference, used to get rotations, 'selected' segment, etc.
  const CIRCUMFERENCE = Math.PI * image('wheel').height;
  // Uses dt so this is 5 rotations per second max
  const MAX_SPEED = Math.PI/8;
  // If the wheel falls below this value, it stops.
  const MIN_SPEED = MAX_SPEED * 0.002;
  // While the wheel is rigged, it won't fall below this speed until it reaches
  // its target slice.
  const MIN_RIGGED_SPEED = MAX_SPEED * 0.02;
  // Current rotation speed in radians
  let speed = 0;
  // How much time the wheel has spent at max speed. Enters slowdown mode after
  // a timeToSpendAtMax seconds at max speed.
  let timeAtMaxSpeed = 0;
  // How long the wheel should spend at max speed before slowing down.
  // Randomized upon first spinning tick to ensure more random result.
  let timeToSpendAtMax = null;
  // The slice the wheel is currently rigged for, meaning it will always land
  // on it.
  let rigTarget = null;

  // Canvas references. 'canvas' is used for location calculations while 'ctx'
  // is the context which is only used for drawing.
  let canvas = game.engine.getCanvas();
  let ctx = game.engine.getCtx();

  // Transform
  let rotation = rand(0, Math.PI * 2);
  let pos = {
    x: canvas.width/2,
    y: canvas.height - image('wheel').height/2 - image('ticker').height/2
  }
  let tickerPointPos = {
    x: canvas.width/2,
    y: canvas.height - image('ticker').height
  }
  // Stores which slice the ticker was on at the end of the a frame.
  // Used for playing sounds when we tick over to a new slice.
  let lastSlice = getSliceAt(tickerPointPos);

  // The 'rewards' (multipliers) tied to each wheel slice, with eachc taking
  // 1/12th of the wheel (much like an hour on a clock). Slice 0 is at the
  // right (where 2 to 3 would be on a clock), progressing counter-clockwise.
  // abs(numbers) < 5 are considered multipliers as opposed to additive rewards.
  const REWARDS = [0.5, -10, 2, 3, 2, 1, -10, 1, 5, 15, 5, -10];


  // Main update loop. NOT self-calling; the engine calls the wheel update.
  function update(dt) {
    // While below max speed and the state is spinning, speed up
    if (game.engine.getGameState() === game.engine.GAME_STATE.SPINNING) {
      // Re-randmomize timeToSpendAtMax if it's not set (first spinning tick)
      if (!timeToSpendAtMax) {
        timeToSpendAtMax = rand(0.75, 1.25);
      }

      if (speed < MAX_SPEED && timeAtMaxSpeed === 0) {
        speed = clamp(speed + dt/5, 0, MAX_SPEED);
      }
      else if (speed === MAX_SPEED && timeAtMaxSpeed < timeToSpendAtMax) {
        timeAtMaxSpeed = clamp(timeAtMaxSpeed + dt, 0, timeToSpendAtMax);
      }
      else {
        // If the wheel has reached its min speed, stop spinning entirely and
        // determine what slice the wheel has landed on.
        if (speed <= MIN_SPEED) {
          game.engine.setGameState(game.engine.GAME_STATE.IDLE);
          speed = 0;
          timeToSpendAtMax = null;
          const reward = REWARDS[getSliceAt(tickerPointPos)];
          if (Math.abs(reward) < 5) {
            game.engine.setBalance(game.engine.getBalance() * reward);
          }
          else {
            game.engine.setBalance(game.engine.getBalance() + reward);
          }
          if (game.engine.getBalance() < game.engine.SPIN_COST) {
            game.engine.setGameState(game.engine.GAME_STATE.GAME_OVER);
          }
        }
        // Otherwise just slow down while above the min speed
        else if (rigTarget && getSliceAt(tickerPointPos) != rigTarget) {
          if (speed > MIN_RIGGED_SPEED) {
            speed *= 0.975;
          }
        }
        else if (speed > MIN_SPEED) {
            speed *= 0.975;
        }
      }
    }
    // We want to always rotate regardless of what's going on
    // rotation = (rotation + (speed * dt)) % (Math.PI * 2);
    rotation = (rotation + speed) % (Math.PI * 2);

    // Play a sound if we ticked over to a new slice
    if (getSliceAt(tickerPointPos) != lastSlice) {
      game.engine.playStream('click.mp3', 1);
      lastSlice = getSliceAt(tickerPointPos);
    }

    // Render after all calculations
    render();
  }

  // Draws the wheel in the center of the canvas based on its rotation, then
  // the ticker at the bottom which shows what's selected.
  function render() {
    ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(-rotation);
      ctx.drawImage(image('wheel'), -image('wheel').width/2, -image('wheel').height/2);
    ctx.restore();
    ctx.drawImage(image('ticker'), canvas.width/2 - image('ticker').width/2, canvas.height - image('ticker').height);
  }

  // Event listener called from the engine which is used to either start the
  // wheel spin or choose a slice to rig the wheel for.
  function onCanvasClick(mouse) {
    // Have to click on the wheel to do anything, of course
    if (distance(pos, mouse) < image('wheel').width/2) {
      if (game.engine.getGameState() === game.engine.GAME_STATE.IDLE) {
        timeAtMaxSpeed = 0;
        game.engine.setBalance(game.engine.getBalance() - game.engine.SPIN_COST);
        game.engine.setGameState(game.engine.GAME_STATE.SPINNING);
      }
      else if (game.engine.getGameState() === game.engine.GAME_STATE.RIGGING) {
        rigTarget = getSliceAt(mouse);
        game.engine.setGameState(game.engine.GAME_STATE.IDLE);
      }
    }
    else if (game.engine.getGameState() === game.engine.GAME_STATE.RIGGING) {
      rigTarget = null;
      game.engine.setGameState(game.engine.GAME_STATE.IDLE);
    }
  }

  // Gets the angle between the vector representing the currrent wheel rotation
  // and the vector from the wheel's center to the passed in location.
  function angleToLoc(location) {
    // Get the angle from the wheel's right to the passed location
    let angle = Math.acos((location.x - pos.x)/distance(pos, location));
    // Want to update the angle to be from 0 to 2*pi instead of 0 to pi and
    // back as would normally be returned by cos.
    if (location.y > pos.y) {
      angle = (Math.PI * 2) - angle;
    }
    // If the wheel is rotated past the location, we need to get the distance
    // the wheel would loop around to each the location again
    if (rotation > angle) {
      angle = (Math.PI * 2) + (angle - rotation);
    }
    else {
      angle -= rotation;
    }
    return angle;
  }

  // Gets the slice of the wheel beneath the given location.
  function getSliceAt(location) {
    let angle = angleToLoc(location);
    let sliceNum = Math.floor(angle/(Math.PI/6));
    return sliceNum;
  }

  // Gets a prettified version of the targeted reward slice for use in the
  // engine component
  function getTargetReward() {
    let reward = REWARDS[rigTarget];
    if (Math.abs(reward) < 5) {
      if (reward === 0.5) {
        return '1/2';
      }
      else {
        return reward + 'x';
      }
    }
    else if (reward > 0) {
      return '+' + reward;
    }
    else {
      return reward;
    }
  }

  // Give back an interface for using the object.
  return {
    update,
    render,
    onCanvasClick,
    getTargetReward
  }
}
