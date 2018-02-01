"use strict";

// INITIALIZATION
// Init a game object if one doesn't exist.
var game = game || {};

function SlotMachine() {

  let reels = [];
  let ctx, canvas;
  let machineOffset, machineWidth, heightRatio;
  let leverFlipped = false;
  let reelsFinished = 0;

  (function ctor() {
    ctx = game.engine.getCtx();
    canvas = game.engine.getCanvas();

    // Calculate some numbers used for rendering and calculation below
    machineOffset = (canvas.width - image('slotOverlay').width)/4;
    heightRatio = canvas.height / image('slotOverlay').height;
    machineWidth = image('slotOverlay').width * heightRatio;

    // Generate the reels, passing in their drawn X position based on the
    // machine sizing variables above
    for (let i = 0; i < 3; ++i) {
      reels.push(Reel(machineOffset + (150) + (image('reel').width + 10)*i, onSpinComplete));
    }
  })();

  // Run by a reel when it finishes spinning.
  function onSpinComplete() {
    ++reelsFinished;
    if (reelsFinished === reels.length) {
      reelsFinished = 0;
      // Get bools representing the matching faces for score checking
      const leftMatch = (reels[0].getFace() === reels[1].getFace());
      const rightMatch = (reels[1].getFace() === reels[2].getFace());
      const outerMatch = (reels[0].getFace() === reels[2].getFace());
      // Left matches middle which matchs right -- all match!
      if (leftMatch && rightMatch) {
        game.engine.modifyBalance(25)
      }
      // If only the outer two match, give a smaller reward
      else if (outerMatch) {
        game.engine.modifyBalance(5);
      }
      // If the left & middle or right & middle match, give a tiny reward
      else if (leftMatch || rightMatch) {
        game.engine.modifyBalance(1);
      }
      // If they don't have enough money to spin, go to game over, else reset
      // to idle so they can spin again.
      if (game.engine.getBalance() < game.engine.SPIN_COST) {
        game.engine.setGameState(game.engine.GAME_STATE.GAME_OVER);
      }
      else {
        game.engine.setGameState(game.engine.GAME_STATE.IDLE);
      }
    }
  }

  // Starts spinning by timing the reel spin activations and lever unflipping.
  function spin(event) {
    let timeout = 0;
    reels.forEach(function (reel) {
      setTimeout(function () {
        reel.spin();
      }, timeout);
      timeout += 250;
    })
    leverFlipped = true;
    setTimeout(function () {
      leverFlipped = false;
    }, 500);
  }

  function update(dt) {
    reels.forEach(function(reel) {
      reel.update(dt);
    })
    render();
  }

  function render() {
    // The dark 'inside' of the slot machine
    ctx.fillStyle = 'rgb(12,12,12)';
    ctx.fillRect(machineOffset * heightRatio, 0, image('slotOverlay').width * heightRatio, canvas.height);

    // Place the lever between the reels and the exterior
    ctx.save();
      ctx.translate(0, canvas.height/2);
      if (leverFlipped) {
        ctx.scale(1, -1);
      }
      ctx.drawImage(image('lever'), machineOffset + machineWidth - 50, -canvas.height/2, image('lever').width * heightRatio, canvas.height);
    ctx.restore();

    ctx.save();
      ctx.scale(heightRatio, heightRatio);

      // Draw each reel on top of the dark inside
      reels.forEach(function(reel) {
        reel.render();
      })

      // Draw the 'case' on top of the reels
      ctx.drawImage(image('slotOverlay'), machineOffset, 0);
    ctx.restore();
  }

  return {
    update,
    render,
    spin,
    machineOffset,
    machineWidth
  }
}
