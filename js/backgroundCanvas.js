window.addEventListener("load", function () {

// Top level main "game" tick function
function mainTick() {
	
	// Increment delta times
    var now = + new Date;
    var dt = now - lastUpdate;
    lastUpdate = now;
	
	// Call tick functions
    update(dt);
    draw();
	
	// Request the next frame from the browser
	requestAnimationFrame(mainTick);
}

// Grab the canvas and set it to be as tall as the page
var canvas = document.getElementById("backgroundDisplay");
canvas.height = window.innerHeight;

/* Animation physics constants*/
// Vertical draw offset of simulation
var Y_OFFSET = 275;
// Spring constant for forces applied by adjacent points
var SPRING_CONSTANT = 0.005;
// Sprint constant for force applied to baseline
var SPRING_CONSTANT_BASELINE = 0.005;
// Damping to apply to speed changes
var DAMPING = 0.99;
// Number of iterations of point-influences-point to do on wave per step
// (this makes the waves animate faster)
var ITERATIONS = 5;

// Prepare canvas appropriately depending on if it's in a sidebar (on a sub-page) or not (AKA on the main page)
if (canvas.className.includes("sidebarDisplay")) {
	// Reduce offset in sidebar
	Y_OFFSET = 50;
	// Width is as wide as the sidebar element
	canvas.width = document.getElementById("mainSidebar").offsetWidth;
}
else {
	canvas.width = window.innerWidth;
}

// Resolution or "detail" of simulation. Larger makes the body of water appear larger.
var NUM_POINTS = Math.ceil(canvas.width/10);

// Grab the context and, once the context is grabbed, get the animation loop running
var ctx = canvas.getContext("2d");

window.requestAnimationFrame(mainTick);
var lastUpdate = +new Date;

// Make points to go on the wave
function makeWavePoints(numPoints) {
    var t = [];
    for (var n = 0; n <= numPoints; n++) {
        // This represents a point on the wave
        var newPoint = {
            x: (n / numPoints) * canvas.width,
            y: Y_OFFSET,
            spd: {y:0}, // speed with vertical component zero
            mass: 1
        }
        t.push(newPoint);
    }
    return t;
}


// A phase difference to apply to each sine
var offset = 0;

var NUM_BACKGROUND_WAVES = 7;
var BACKGROUND_WAVE_MAX_HEIGHT = 3;
var BACKGROUND_WAVE_COMPRESSION = 1/10;
// Amounts by which a particular sine is offset
var sineOffsets = [];
// Amounts by which a particular sine is amplified
var sineAmplitudes = [];
// Amounts by which a particular sine is stretched
var sineStretches = [];
// Amounts by which a particular sine's offset is multiplied
var offsetStretches = [];
for (var i = -0; i < NUM_BACKGROUND_WAVES; i++) {
    var sineOffset = -Math.PI + 2 * Math.PI * Math.random();
    sineOffsets.push(sineOffset);
    var sineAmplitude = Math.random() * BACKGROUND_WAVE_MAX_HEIGHT;
    sineAmplitudes.push(sineAmplitude);
    var sineStretch = Math.random() * BACKGROUND_WAVE_COMPRESSION;
    sineStretches.push(sineStretch)
    var offsetStretch = Math.random() * BACKGROUND_WAVE_COMPRESSION;
    offsetStretches.push(offsetStretch);
}


// This function sums together the sines generated above,
// given an input value x
function overlapSines(x) {
    var result = 0;
    for (var i = 0;i < NUM_BACKGROUND_WAVES; i++) {
        result = result
            + sineOffsets[i]
            + sineAmplitudes[i] 
            * Math.sin(x * sineStretches[i] + offset * offsetStretches[i]); 
    }
    return result;
}

// Generate the wave points
var wavePoints = makeWavePoints(NUM_POINTS);

// Update the positions of each wave point
function updateWavePoints(points, dt) {
  for (var i = 0; i < ITERATIONS; i++) {
		
		for (var n = 0; n < points.length; n++) {
			var p = points[n];
			// force to apply to this point
			var force = 0;

			// forces caused by the point immediately to the left or the right
			var forceFromLeft, forceFromRight;

			if (n == 0) { // wrap to left-to-right
				var dy = points[points.length - 1].y - p.y;
				forceFromLeft = SPRING_CONSTANT * dy;
			} else { // normally
				var dy = points[n - 1].y - p.y;
				forceFromLeft = SPRING_CONSTANT * dy;
			}
			if (n == points.length - 1) { // wrap to right-to-left
				var dy = points[0].y - p.y;
				forceFromRight = SPRING_CONSTANT * dy;
			} else { // normally
				var dy = points[n + 1].y - p.y;
				forceFromRight = SPRING_CONSTANT * dy;
			}

			// Also apply force toward the baseline
			var dy = Y_OFFSET - p.y;
			forceToBaseline = SPRING_CONSTANT_BASELINE * dy;

			// Sum up forces
			force = force + forceFromLeft;
			force = force + forceFromRight;
			force = force + forceToBaseline;

			// Calculate acceleration
			var acceleration = force / p.mass;
     

			// Apply acceleration (with damping)
			p.spd.y = DAMPING * p.spd.y + acceleration;

			// Apply speed
			p.y = p.y + p.spd.y;
		}
    }
}

// Callback for mouse clicks to apply a force at the clicked location
window.addEventListener("mousedown", function (e) {
	// We'll store the point receiving the impulse and the impulse strength here
	var closestPoint = {};
	var closestDistance = -1
	
	// Go through each point and compare horizontal distance from the cursor
	for (var n = 0; n < wavePoints.length; n++) {
		var p = wavePoints[n];
		var distance = Math.abs(e.clientX - p.x);
		if (closestDistance == -1) {
			closestPoint = p;
			closestDistance = distance;
		} 
		else if (distance <= closestDistance) {
			closestPoint = p;
			closestDistance = distance;
		}
	}
	
	// Apply the impulse by updating its y position
	// The spring mechanics will automatically handle this being transferred to the other points
	closestPoint.y += Math.min(Math.max(Math.abs(e.clientY - closestPoint.y), 5)/10, 50)*Math.sign(e.clientY - closestPoint.y);
});


// Callback when updating
function update(dt) {
    offset++;
	
    // Update positions of points
    updateWavePoints(wavePoints, dt)
}


// Callback for drawing
function draw() {
	
	// Clear out the canvas and set up the new draw shape
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.beginPath();
	ctx.fillStyle = "rgb(75, 150, 200)";
  
	// Draw line between each point
	for (var n = 0; n < wavePoints.length - 1; n++) {
		var p1 = wavePoints[n];
		var p2 = wavePoints[n+1];
		if (n == 0) {
			ctx.moveTo(p1.x, p1.y + overlapSines(p1.x));
		} 
		else {
			ctx.lineTo(p2.x, p1.y + overlapSines(p1.x), 5, 5, 0, 0, Math.PI * 2);
			ctx.lineTo(p2.x, p2.y + overlapSines(p2.x), 5, 5, 0, 0, Math.PI * 2);
		}    
	}
	
	// Finish out the bottom of the shape and fill it in
	ctx.lineTo(canvas.width, canvas.height);
	ctx.lineTo(0, canvas.height);
	ctx.fill();
}
});