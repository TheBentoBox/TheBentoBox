"use strict";

// INITIALIZATION
// Init a game object if one doesn't exist.
var game = game || {};

window.addEventListener('load', function() {
	console.log("Loading game...");
	game.engine.loadAssets();
});

//window.onblur = function() {
//	game.engine.pauseGame();
//};
