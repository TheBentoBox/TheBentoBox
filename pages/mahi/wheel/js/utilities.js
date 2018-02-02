"use strict";

// Get mouse pos relative to top corner of the clicked element.
// A valid mouse click event object must be passed in.
function getMouse(e) {
	return {
		x: e.pageX - e.target.offsetLeft,
		y: e.pageY - e.target.offsetTop
	}
}

// returns random within a range
function rand(min, max) {
  	return Math.random() * (max - min) + min;
}

// returns a value that is constrained between min and max (inclusive)
function clamp(val, min, max){
	return Math.max(min, Math.min(max, val));
}

// fills a text with correct CSS and cleans up after itself
function fillText(ctx, string, x, y, size, color) {
	ctx.save();
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.font = size + 'pt Oswald';
		ctx.fillStyle = color;
		ctx.fillText(string, x, y);
	ctx.restore();
}

// fills a text with correct CSS and cleans up after itself
function fillTextAligned(ctx, string, x, y, size, color) {
	ctx.save();
		ctx.textAlign = "left";
		ctx.textBaseline = "top";
		ctx.font = size + 'pt Oswald';
		ctx.fillStyle = color;
		ctx.fillText(string, x, y);
	ctx.restore();
}

// Gets the  distance between two point objects. Points are assumed to
// have an x property and y property to represent their position.
// I'd normally return dist squared for the sake of performance but this
// game doesn't check distance in high frequency events.
function distance(p1, p2) {
	return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}
