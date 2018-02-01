"use strict";

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
