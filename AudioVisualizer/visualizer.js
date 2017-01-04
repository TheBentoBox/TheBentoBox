// Global IFFE
(function(){
	"use strict";
	
	/* 'GLOBAL' VARIABLES */
	// Sound Control Variables
	var NUM_SAMPLES = 256;
	var SOUND;
	var audioElement;
	var analyserNode, delayNode;
	var useWaveform = false;
	
	// Canvas Variables (main canvas, color palette, gradient & circle customizers)
	var canvas, ctx, palette, paletteCtx, gradSel, gradSelCtx, circleSel, circleSelCtx, oldCanvasSize;
	
	// User input
	var mouseDown;				
	var mouse = { // mouse position object
		x: 0,
		y: 0
	};
	
	// Visualizer Customization
	var grad = []; // gradient data values
	var selected = 0; // color tab currently selected, used in gradient customizer
	var pulses = []; // audio pulses
	var previousVolume = 255; // stores previous starting volume level, starts at 255 to prevent an initial audio pulse
	var currentPulseColor = 0; // pulse colors loop through gradient colors, stores index to get color from
	var invert = false, tintRed = false, grayscale = false, alphaSwap = false, maxRadius, time = 0, data;
	var arrowImg = new Image();
	var circleColorLarge = "rgb(0, 0, 255)",
		circleColorMedium = "rgb(255, 50, 50)",
		circleColorSmall = "rgb(250, 250, 0)";
	
	/* FUNCTION: init 
	- Stores canvas elements and their contexts
	- Sets up page columns
	- Loads images
	- Loads initial visualization options
	- Prepares music for playing
	*/
	function init(){
		// set up canvas stuff
		canvas = document.querySelector('#canvas');
		ctx = canvas.getContext("2d");
		palette = document.querySelector('#palette');
		paletteCtx = palette.getContext("2d");
		gradSel = document.querySelector('#gradientSelector');
		gradSelCtx = gradSel.getContext("2d");
		circleSel = document.querySelector('#circleSelector');
		circleSelCtx = circleSel.getContext("2d");
		maxRadius = 125;
		
		// prevent general page selection, helps with interactable canvas functionality
		document.onselectstart = function() { return false; };
		
		// create an 8-bit array to store volume data in
		data = new Uint8Array(NUM_SAMPLES/2); 
		
		// setup columns
		/* STABLE WINDOW WIDTH RETRIEVAL
		- Meant to work well cross-browser
		- SOURCE: http://stackoverflow.com/questions/5484578/how-to-get-document-height-and-width-without-using-jquery
		- Provided by: Dan from stackoverflow
		*/
		var windowWidth = Math.max(document.documentElement["clientWidth"], document.body["scrollWidth"], document.documentElement["scrollWidth"], document.body["offsetWidth"], document.documentElement["offsetWidth"]);
		document.querySelector('#rightColumn').style.height = document.querySelector('#leftColumn').getBoundingClientRect().height + "px";
		
		// set up color palette
		var paletteImg = new Image();
		paletteImg.src = "media/palette.png";
		paletteImg.addEventListener("load", function(e) {
			paletteCtx.drawImage(paletteImg, 0, 0, paletteImg.width, paletteImg.height);
		});
		
		// load arrow image
		arrowImg.src = "media/arrow.png";
		
		// add starting gradient tabs
		grad[0] = {	pcnt: 0, col: "rgb(185, 25, 25)" };
		grad[1] = {	pcnt: 0.2, col: "rgb(235, 215, 25)" };
		grad[2] = {	pcnt: 0.4, col: "rgb(65, 160, 35)" };
		grad[3] = {	pcnt: 0.6, col: "rgb(65, 160, 255)" };
		grad[4] = {	pcnt: 0.8, col: "rgb(135, 20, 135)" };
		
		// get reference to <audio> element on page
		audioElement = document.querySelector('audio');
		
		// load first song
		SOUND = document.querySelector('option').value
		
		// call our helper function and get an analyser node
		analyserNode = hookupAudio(audioElement);
		
		// callbacks to always store if the mouse is down
		window.onmouseup = function() { mouseDown = false; };
		window.onmousedown = function() { mouseDown = true; };
		
		// get sound track <select> and Full Screen button working
		setupUI();
		
		// load and play default sound into audio element
		playStream(audioElement, SOUND);
		
		// start animation loop
		update();
	}
		
	/* FUNCTION: hookupAudio
	- Gets an audio context
	- Creates audio distortion and analysis nodes
	- Connects nodes to the analyser and returns it
	*/
	function hookupAudio(audioElement) {
		// node and context variables
		var audioCtx, analyserNode, sourceNode;
		
		// create new AudioContext with attempted cross-browser support
		audioCtx = new (window.AudioContext || window.webkitAudioContext);
		
		// create audio nodes
		analyserNode = audioCtx.createAnalyser(); // analyser node
		delayNode = audioCtx.createDelay(); // delay node
		delayNode.delayTime.value = 0.0; // set delay time to 0 initially
		
		// fft stands for Fast Fourier Transform
		analyserNode.fftSize = NUM_SAMPLES;
		
		// this is where we hook up the <audio> element to the analyserNode
		sourceNode = audioCtx.createMediaElementSource(audioElement);
		sourceNode.connect(audioCtx.destination);
		sourceNode.connect(delayNode);
		delayNode.connect(analyserNode);
		analyserNode.connect(audioCtx.destination);
		
		return analyserNode;
	}
	
	/* FUNCTION: setupUI
	- Sets up all page UI elements and function callbacks
	- Includes track selectors/options and canvas modification sliders/palette choices
	*/
	function setupUI(){
		// track selector callback
		document.querySelector('#trackSelect').onchange = function(e) {
			playStream(audioElement, e.target.value);
		};
		// preset gradient selector callback
		document.querySelector('#presetSelect').onchange = function(e) {
			// reset gradient data array
			grad = [];
				
			// change gradient depending on value
			switch (e.target.value) { 
				case "rainbow":
					grad[0] = {	pcnt: 0, col: "rgb(185, 25, 25)" };
					grad[1] = {	pcnt: 0.2, col: "rgb(235, 215, 25)" };
					grad[2] = {	pcnt: 0.4, col: "rgb(65, 160, 35)" };
					grad[3] = {	pcnt: 0.6, col: "rgb(65, 160, 255)" };
					grad[4] = {	pcnt: 0.8, col: "rgb(135, 20, 135)" };
					circleColorLarge = "rgb(0, 0, 255)";
					circleColorMedium = "rgb(255, 50, 50)";
					circleColorSmall = "rgb(250, 250, 0)";
					break;
				case "redHanded":
					grad[0] = { pcnt: 0, col: "rgb(255, 255, 255)" };
					grad[1] = { pcnt: 0.5, col: "rgb(200, 0, 0)" };
					grad[2] = { pcnt: 0.57, col: "rgb(200, 0, 0)" };
					grad[3] = { pcnt: 0.6, col: "rgb(0, 255, 0)" };
					grad[4] = { pcnt: 0.61, col: "rgb(100, 100, 100)" };
					grad[5] = { pcnt: 1, col: "rgb(0, 0, 0)" };
					circleColorLarge = "rgb(255, 0, 0)";
					circleColorMedium = "rgb(255, 255, 255)";
					circleColorSmall = "rgb(100, 100, 100)";
					break;
				case "pridelands":
					grad[0] = { pcnt: 0, col: "rgb(255, 100, 50)" };
					grad[1] = { pcnt: 0.25, col: "rgb(220, 220, 25)" };
					grad[2] = { pcnt: 0.5, col: "rgb(220, 150, 0)" };
					grad[3] = { pcnt: 0.5, col: "rgb(200, 100, 0)" };
					grad[4] = { pcnt: 1.0, col: "rgb(100, 50, 0)" };
					circleColorLarge = "rgb(255, 255, 0)";
					circleColorMedium = "rgb(255, 170, 0)";
					circleColorSmall = "rgb(255, 0, 0)";
					break;
			}
			
			// pull selected tab down within size of gradient tab list
			if (selected > grad.length - 1)
				selected = grad.length - 1;
		};
		// background image callback
		document.querySelector('#backgroundSelector').onchange = function(e) {
			if (e.target.value == "") {
				canvas.style.backgroundImage = "url('media/default.png')";
			}
			else {
				canvas.style.backgroundImage = "url('" + e.target.value + "')";
			}
		};
		
		// fullscreen button callback
		document.querySelector('#fsButton').onclick = function() {
			requestFullscreen(canvas);
			canvas.style.width = "100%";
			canvas.style.height = "auto";
		};
		
		// shrink canvas again on un-fullscreen
		function resetCanvasSize() {
			if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {
				canvas.style.width = "840px";
				canvas.style.height = "525px";
			}
		}
		// event listeners for shrinking canvas
		document.addEventListener("webkitfullscreenchange", resetCanvasSize);
		document.addEventListener("mozfullscreenchange", resetCanvasSize);
		document.addEventListener("fullscreenchange", resetCanvasSize);
		
		// canvas click to pause/play
		canvas.onclick = function () {
			if (audioElement.paused)
				audioElement.play();
			else
				audioElement.pause();
		}
		// callback to store mouse position in a mouse object
		window.addEventListener("mousemove", function(e) {
			mouse.x = e.pageX - document.body.scrollLeft;
			mouse.y = e.pageY - document.body.scrollTop;
		});
		
		// set callbacks for options sliders
		document.querySelector('#averageSlider').addEventListener("change", function(e) { analyserNode.smoothingTimeConstant = e.target.value; }); // visualization smoothness
		document.querySelector('#maxRadSlider').addEventListener("change", function(e) { maxRadius = e.target.value; }); // circle radius
		document.querySelector('#delaySlider').addEventListener("change", function(e) { delayNode.delayTime.value = e.target.value; }); // sound delay
		
		// set callbacks for option checkboxes
		document.querySelector('#waveformBox').addEventListener("change", function() { useWaveform = !useWaveform } );
		document.querySelector('#tintRedBox').addEventListener("change", function() { tintRed = !tintRed } );
		document.querySelector('#invertBox').addEventListener("change", function() { invert = !invert } );
		document.querySelector('#grayscaleBox').addEventListener("change", function() { grayscale = !grayscale } );
		document.querySelector('#alphaSwapBox').addEventListener("change", function() { alphaSwap = !alphaSwap } );
		
		// gradient selector click event to select tabs
		gradSel.addEventListener("mousedown", function(e) {
			// only attempt an update if there are any gradient tabs
			if (grad.length > 0) {
				// get variables representing size and position of gradient selector
				var rect = e.target.getBoundingClientRect();
				var width = rect.right - rect.left;
				var height = rect.bottom - rect.top;
				var percent = (e.clientY + document.body.scrollTop - rect.top)/height;
				
				// loop through selector tabs
				for (var i = 0; i < grad.length; ++i) {
					// if they clicked in the tab's bounds
					if (grad[i].pcnt <= percent && grad[i].pcnt + .04 >= percent) {
						// set the tab at that position as the current tab
						selected = i;
						break;
					}
				}
			}
		});
		// gradient selector mouse over event to drag tabs
		gradSel.addEventListener("mousemove", function(e) {
			// only attempt an update if there are any gradient tabs
			if (grad.length > 0) {
				// if the mouse is held down
				if (mouseDown) {
					var rect = e.target.getBoundingClientRect();
					var height = rect.bottom - rect.top;
					var percent = (e.clientY - rect.top)/height;
					
					// clamp below 0.96 so they can't be dragged off canvas
					grad[selected].pcnt = Math.min(percent, 0.97);
				}
			}
		});
		// gradient selector right click event to delete tabs
		gradSel.addEventListener("contextmenu", function(e) {
			// only attempt an update if there are any gradient tabs
			if (grad.length > 0) {
				// prevent default context menu
				e.preventDefault();
				
				// get variables representing size and position of gradient selector
				var rect = e.target.getBoundingClientRect();
				var width = rect.right - rect.left;
				var height = rect.bottom - rect.top;
				var percent = (e.clientY + document.body.scrollTop - rect.top)/height;
				
				// loop through selector tabs
				for (var i = 0; i < grad.length; ++i) {
					// if they clicked in the tab's bounds
					if (grad[i].pcnt <= percent && grad[i].pcnt + .04 >= percent) {
						grad.splice(i, 1);
						break;
					}
				}
				
				// if we had the last tab in the array selected, select the new last one
				if (selected >= grad.length)
					selected = grad.length - 1;
			}
		});	
		
		// circle selector click event to select circle
		circleSel.addEventListener("mousedown", function(e) {
			// get bounding rectangle of circle selector canvas
			var rect = e.target.getBoundingClientRect();
			// get its width and height
			var width = rect.right - rect.left;
			var height = rect.bottom - rect.top;
			
			// get distance they clicked from the center
			var distance = Math.sqrt(Math.pow(mouse.x - rect.left - width/2, 2) + Math.pow(mouse.y - rect.top - height/2, 2));
			
			// check if they clicked on one of the circles
			if (distance < 75) {
				// set the selected variable to the negative of the one they clicked
				// negative so we can differentiate from if they have a gradient color tab selected
				selected = -Math.ceil(distance/25);
			}
		});
		
		// color palette click event to update tab or circle colors
		palette.addEventListener("click", function(e) {
			// get the color at the location they clicked
			// first, get image data
			var imageData = paletteCtx.getImageData(0, 0, palette.width, palette.height).data;
			var rect = e.target.getBoundingClientRect();
			// then get mouse position within canvas
			var relativePos = {
				x: Math.floor(e.clientX + document.body.scrollLeft - rect.left),
				y: Math.floor(e.clientY - rect.top)
			};
			// offset within data array to retrieve data from
			var offset = ((relativePos.y*palette.width) + relativePos.x)*4;
			// create the color object
			var color = {
				r: imageData[offset],
				g: imageData[offset + 1],
				b: imageData[offset + 2]
			};
					
			// check which tab or circle in the customizer(s) is selected and update it
			switch (selected) {
				case -1:
					// small circle is slected
					circleColorSmall = "rgb(" + color.r + ", " + color.g + ", " + color.b + ")";
					break;
				case -2:
					// medium circle is selected
					circleColorMedium = "rgb(" + color.r + ", " + color.g + ", " + color.b + ")";
					break;
				case -3:
					// large circle is selected
					circleColorLarge = "rgb(" + color.r + ", " + color.g + ", " + color.b + ")";
					break;
				default:
					// only attempt an update to the color tabs if there are any gradient tabs
					if (grad.length > 0) {
						grad[selected].col = "rgb(" + color.r + ", " + color.g + ", " + color.b + ")";
					}
					break;
			}
		});

		// new color tab button click callback
		document.querySelector('#newColorTab').addEventListener("click", function() {
			// add new white stop in the center
			grad[grad.length] = {
				pcnt: 0.5,
				col: "white"
			};
			
			// if there were no tabs previously, select the new one
			if (grad.length == 1)
				selected = 0;
		});
	}
	
	/* FUNCTION: playStream
	- Begins playing a song from a pth
	- Updates the visualizer header with the song info
	*/
	function playStream(audioElement, path){
		audioElement.src = path;
		audioElement.play();
		audioElement.volume = 0.35;
		document.querySelector('#status').innerHTML = "<strong>Currently Visualizing</strong>: " + path.replace("media/", "").replace(".mp3", "");
	}
	
	/* FUNCTION: update
	- Main draw call; draws all screen objects based on volume and time
	- Creates and destroys audio pulses based on volume of previous frame
	*/
	function update() { 
		// schedule a call to the next update() method
		requestAnimationFrame(update);
		
		// populate the array with data
		if (useWaveform) {
			// waveform data if that option is selected
			analyserNode.getByteTimeDomainData(data);
		}
		else {
			// otherwise, use frequency data
			analyserNode.getByteFrequencyData(data);
		}
		
		// GRADIENT CUSTOMIZER
		// map mouse y within gradient selector
		var rect = document.querySelector('#gradientSelector').getBoundingClientRect();
		var percent = Math.min(Math.max((mouse.y - rect.top)/(rect.bottom - rect.top), 0), 1);
		
		// update gradient selector (draw background and tabs)
		gradSelCtx.fillStyle = "gray";
		gradSelCtx.fillRect(0, 0, gradSel.width, gradSel.height);
		// tabs
		for (var i = 0; i < grad.length; ++i) {
			var height = rect.bottom - rect.top;
			gradSelCtx.fillStyle = grad[i].col;
			gradSelCtx.fillRect(arrowImg.width/2, height*grad[i].pcnt + 1, arrowImg.width*1.5, arrowImg.height-2);
			gradSelCtx.drawImage(arrowImg, 0, height*grad[i].pcnt, arrowImg.width, arrowImg.height);
		}
	
		// CIRCLE CUSTOMIZER
		// draw large circle preview in the circle customizer
		circleSelCtx.clearRect(0, 0, circleSel.width, circleSel.height);
		circleSelCtx.beginPath();
		circleSelCtx.fillStyle = circleColorLarge;
		circleSelCtx.arc(circleSel.width/2, circleSel.height/2, 75, 0, 2*Math.PI, false);
		circleSelCtx.fill();
		// draw medium circle preview in the circle customizer
		circleSelCtx.beginPath();
		circleSelCtx.fillStyle = circleColorMedium;
		circleSelCtx.arc(circleSel.width/2, circleSel.height/2, 50, 0, 2*Math.PI, false);
		circleSelCtx.fill();
		// draw small circle preview in the circle customizer
		circleSelCtx.beginPath();
		circleSelCtx.fillStyle = circleColorSmall;
		circleSelCtx.arc(circleSel.width/2, circleSel.height/2, 25, 0, 2*Math.PI, false);
		circleSelCtx.fill();
		
		// SELECTED OBJECT: draw a black arrow at currently selected customizer object
		// a gradient tab is selected
		if (selected >= 0) {
			gradSelCtx.strokeStyle = "black";
			gradSelCtx.lineWidth = 2;
			gradSelCtx.beginPath();
			gradSelCtx.moveTo(arrowImg.width*1.75, height*grad[selected].pcnt + arrowImg.height/2);
			gradSelCtx.lineTo(arrowImg.width*.8, height*grad[selected].pcnt + arrowImg.height/2);
			gradSelCtx.lineTo(arrowImg.width, height*grad[selected].pcnt + 2);
			gradSelCtx.moveTo(arrowImg.width*.8, height*grad[selected].pcnt + arrowImg.height/2);
			gradSelCtx.lineTo(arrowImg.width, height*grad[selected].pcnt + arrowImg.height - 2);
			gradSelCtx.stroke();
			gradSelCtx.closePath();
		}
		// a customizer circle is selected
		else {
			circleSelCtx.strokeStyle = "black";
			circleSelCtx.lineWidth = 2;
			circleSelCtx.beginPath();
			circleSelCtx.moveTo(18, 18);
			circleSelCtx.lineTo(circleSel.width/2 + selected*18, circleSel.height/2 + selected*18);
			circleSelCtx.lineTo(circleSel.width/2 + selected*18 - 15, circleSel.height/2 + selected*18);
			circleSelCtx.moveTo(circleSel.width/2 + selected*18, circleSel.height/2 + selected*18);
			circleSelCtx.lineTo(circleSel.width/2 + selected*18, circleSel.height/2 + selected*18 - 15);
			circleSelCtx.stroke();
			circleSelCtx.closePath();
		}
		
		// MAIN CANVAS DRAW
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		var topSpacing = 3 + Math.sin(time)*3;
		
		// BEZIERS: draw pulsing beziers based on the average volume
		// scaled volume based on canvas width and a set volume cap
		var volumeScale = previousVolume/(128*data.length) * canvas.width/4;
		var rootPoint = canvas.width * .2;
		var farRootPoint = canvas.width - canvas.width * .2;
		// save the canvas state
		ctx.save();
			// lower alpha for beziers
			ctx.globalAlpha = 0.35;
			
			// FIRST BEZIERS: outer curves, colored based on large circle
			ctx.strokeStyle = circleColorLarge;
				ctx.beginPath();
				ctx.moveTo(rootPoint, 0);
				ctx.bezierCurveTo(rootPoint - volumeScale, canvas.height/3, rootPoint - volumeScale, canvas.height*2/3, rootPoint, canvas.height);
				ctx.moveTo(farRootPoint, 0);
				ctx.bezierCurveTo(farRootPoint + volumeScale, canvas.height/3, farRootPoint + volumeScale, canvas.height*2/3, farRootPoint, canvas.height);
				ctx.stroke();
			// scale volumeScale down a bit for weaker curves
			volumeScale *= .75;
			// SECOND BEZIERS: middle curves, colored based on medium circle
			ctx.strokeStyle = circleColorMedium;
				ctx.beginPath();
				ctx.moveTo(rootPoint, 0);
				ctx.bezierCurveTo(rootPoint - volumeScale, canvas.height/3, rootPoint - volumeScale, canvas.height*2/3, rootPoint, canvas.height);
				ctx.moveTo(farRootPoint, 0);
				ctx.bezierCurveTo(farRootPoint + volumeScale, canvas.height/3, farRootPoint + volumeScale, canvas.height*2/3, farRootPoint, canvas.height);
				ctx.stroke();
			// scale volumeScale down a bit more for weaker curves
			volumeScale *= .75;
			// THIRD BEZIERS: central curves, colored based on small circle
			ctx.strokeStyle = circleColorSmall;
				ctx.beginPath();
				ctx.moveTo(rootPoint, 0);
				ctx.bezierCurveTo(rootPoint - volumeScale, canvas.height/3, rootPoint - volumeScale, canvas.height*2/3, rootPoint, canvas.height);
				ctx.moveTo(farRootPoint, 0);
				ctx.bezierCurveTo(farRootPoint + volumeScale, canvas.height/3, farRootPoint + volumeScale, canvas.height*2/3, farRootPoint, canvas.height);
				ctx.stroke();
		ctx.restore();
		
		// AUDIO PULSES: draw outwards pulses
		ctx.save();
		// loop through pulse object array
		for(var i = 0; i < pulses.length; ++i) {
			ctx.beginPath();
			// scale alpha of pulse down as it gets larger (fade away)
			ctx.globalAlpha = Math.max(0.0, 0.2 - (pulses[i].radius/(canvas.width*2.5)));
			
			// draw the pulse
			ctx.fillStyle = pulses[i].color;
			ctx.arc(canvas.width/2, canvas.height/2, pulses[i].radius, 0, Math.PI*2, false);
			
			// make the pulse bigger (expands outwards)
			pulses[i].radius += 7;
			ctx.fill();
			
			// if the pulse is well outside the canvas, delete it
			if (pulses[i].radius > canvas.width)
				pulses.splice(i, 1);
		}
		// reset canvas state
		ctx.restore();
		
		// variable to store total volume of current data
		// used to create audio pulses at the end of the frame
		var volume = 0;
		
		// MAIN DRAWING LOOP
		for( var i = 0; i < data.length; ++i) { 
			var percent = data[i] / 255;
			volume += data[i];
			
			// save canvas state before it's modified for drawing circles
			ctx.save();
			// CENTRAL CIRCLES: mods i by 2 to draw less circles (every other sample)	
			if (i % 2 == 0) {				
				// large circles, more transparent
				var circleRadius = percent * maxRadius;
				ctx.beginPath();
				ctx.fillStyle = circleColorLarge;
				ctx.globalAlpha = (percent)/10.0;
				ctx.arc(canvas.width/2, canvas.height/2, circleRadius*1.5, 0, 2*Math.PI, false);
				ctx.fill();
				
				// middle circles
				ctx.beginPath();
				ctx.fillStyle = circleColorMedium;
				ctx.globalAlpha = (percent)/8.0;
				ctx.arc(canvas.width/2, canvas.height/2, circleRadius, 0, 2*Math.PI, false);
				ctx.fill();
				
				// small circles
				ctx.beginPath();
				ctx.fillStyle = circleColorSmall;
				ctx.globalAlpha = (percent)/3.0;
				ctx.arc(canvas.width/2, canvas.height/2, circleRadius * 0.5, 0, 2*Math.PI, false);
				ctx.fill();
			}
			ctx.restore();
			
			// get height value of line
			// scale values differently based on volume
			var scale = Math.pow(percent, 0.6+percent)*data[i]*(1.75 - percent/2);
			
			// GRADIENT: set up the gradient for the line based on the gradient object array
			var gradient = ctx.createLinearGradient(0, canvas.height - scale, 0, canvas.height - topSpacing);
			for (var ii = 0; ii < grad.length; ++ii) {
				// Gradient tabs are locked to 0.96 percent down visually, so we
				// multiply by 1.03 to scale it up to (roughly) 1
				gradient.addColorStop(Math.min(1, grad[ii].pcnt*1.03), grad[ii].col);
			}
		
			// VOLUME LINES: the actual main lines that represent the sample
			// thick lines, left side
			ctx.beginPath();
			ctx.fillStyle = ctx.strokeStyle = gradient;
			ctx.arc(canvas.width*(i/data.length), canvas.height - topSpacing - scale, Math.max(2, scale/20), 0, Math.PI, true);
			ctx.arc(canvas.width*(i/data.length), canvas.height - topSpacing, 2, 0, 2*Math.PI, false);
			ctx.fill();
			
			// thin lines, right side
			ctx.beginPath();
			ctx.arc(canvas.width - canvas.width*(i/data.length), canvas.height - topSpacing - scale, Math.max(2, scale/30), 0, 2*Math.PI, true);
			ctx.moveTo(canvas.width - canvas.width*(i/data.length), canvas.height - topSpacing - scale);
			ctx.lineTo(canvas.width - canvas.width*(i/data.length), canvas.height - topSpacing);
			ctx.arc(canvas.width - canvas.width*(i/data.length), canvas.height - topSpacing, 2, 0, 2*Math.PI, false);
			ctx.fill();
			ctx.stroke();
		}
		
		// AUDIO PULSES: attempt to create outwards pulses if volume jumped enough from last frame or if volume is high overall
		if (volume > previousVolume*1.1 || (volume > 12000 && time % 2 < 0.1) && volume <= previousVolume*1.1) {
			// color to create new pulse at
			var pulseColor;
			
			// pulses are the color of the smallest circle if there's no gradient tabs
			if (grad.length == 0) {
				pulseColor = circleColorSmall;
			}
			// wrap pulse color around to first gradient
			else {
				currentPulseColor %= grad.length;
				pulseColor = grad[currentPulseColor].col;
			}
			
			// create the new pulse
			pulses[pulses.length] = {
				radius: 50,
				color: pulseColor
			}
			
			// increment to the next pulse color
			++currentPulseColor;
		}
		
		// store current volume in previous variable
		previousVolume = volume;
		 
		// increment time and apply filters
		time += 0.1;
		applyFilters();
	}
	
	/* FUNCTION: applyFilters
	- Loops through pixels on canvas and applies filters
	*/
	function applyFilters() {			
		// if any filters are enabled
		if (tintRed || invert || grayscale || alphaSwap) {
			// get canvas data
			var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			
			// split image data into components
			var data = imageData.data;
			var length = data.length;
			var width = imageData.width;
		
			// loop through each pixel
			for (var i = 0; i < length; i += 4) { // iterate by 4, rgba for each pixel
				// red tint
				if (tintRed) {
					data[i] += 100;
				}
				
				// inverted colors
				if (invert) {
					data[i] = 255-data[i];
					data[i+1] = 255-data[i+1];
					data[i+2] = 255-data[i+2];
				}
				
				// grayscale, average brightness and set to gray
				if (grayscale) {
					// get average color values
					var total = data[i] + data[i +1] + data[i+2];
					total /= 3;
					// set all three to average
					data[i] = data[i+1] = data[i+2] = total;
				}
				
				// swap green with blue and red with alpha
				if (alphaSwap) {
					if (i % 4 == 0) {
						var red = data[i], green = data[i+1]
						data[i] = data[i+3];
						data[i+1] = data[i+2]
						data[i+2] = green;
						data[i+3] = red;
					}
				}
			}
			
			// read modified data back to the canvas
			ctx.putImageData(imageData, 0, 0);
		}
	}
	
	/* FUNCTION HELPER:
	- Returns color string in usable rgb() form
	*/
	function makeColor(red, green, blue, alpha) {
		return 'rgba(' + red + ',' + green + ',' + blue + ', ' + alpha + ')';
	}
	
	 /* FUNCTION: requestFullscreen
	 - Attemps to fullscreen an element (the canvas)
	 - Will fall through to nothing if the broswer doesn't support it
	 */
	function requestFullscreen(element) {
		if (element.requestFullscreen) {
		  element.requestFullscreen();
		} else if (element.mozRequestFullscreen) {
		  element.mozRequestFullscreen();
		} else if (element.mozRequestFullScreen) { // camel-cased 'S' was changed to 's' in spec
		  element.mozRequestFullScreen();
		} else if (element.webkitRequestFullscreen) {
		  element.webkitRequestFullscreen();
		}
		// do nothing if the method is not supported
	}
	
	// set init to get called once the page is loaded
	window.addEventListener("load", init);
}());