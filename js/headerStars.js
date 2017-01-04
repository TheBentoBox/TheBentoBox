window.addEventListener("load", init);

// Variables relating to stars in background
var stars = [];				// the list of star objects
var numStars = 3500;		// number of stars to create on page load
var starImg = new Image();	// reference to the star image

// Variables relating to other objects - currently just clouds
var objects = [];			// the list of other miscellaneous objects
var numObjects = 25;		// the number of other objects to generate
var objImgs = [];			// an array of the object images
var shootingStarImg = new Image(); // the image used for shooting stars
var earthImg = new Image();

// Canvas and canvas sizes, used to draw and position stars
var canvas, ctx, cw, ch;
var time = 0; 				// used to animate spinning Earth

// Randomly creates stars and begins update loop
function init () {
	// load in the non-object images
	starImg.src = "media/starImg.png";
	shootingStarImg.src = "media/shootingStarImg.png";
	earthImg.src = "media/earthImg.png";
	
	// get the canvas width and height
	canvas = document.querySelector('canvas');
	ctx = canvas.getContext('2d');
	canvas.width = cw = window.innerWidth;
	ch = canvas.height;
	
	// add all of the object images to the array
	objImgs.push(new Image());
	objImgs[0].src = "media/cloudImg.png";
	
	// create a bunch of stars
	for (var i = 0; i < numStars; ++i) {
		stars.push({
			// how far from the center the star is
			// somewhere between width/5 and edge
			distance: (cw*0.125) + Math.random()*(cw*0.875),
			// the rotation angle of the star
			// randomly rotated between 0 and a full circle (2PI)
			angle: Math.random()*2*Math.PI,
			// randomly scale the stars
			scale: Math.random() + 0.5
		});
	}
	
	// create some objects
	for (var j = 0; j < numObjects; ++j) {
		// get a random image out of the obj images array
		var randObjImg = objImgs[Math.floor(Math.random()*objImgs.length)];
		
		objects.push({
			// how far from the center the object is
			// objects spawn close to earth
			distance: (cw*0.075)+Math.pow(Math.random(),2)*(cw*0.05),
			// the rotation angle of the object
			// randomly rotated between 0 and a full circle (2PI)
			angle: Math.random()*2*Math.PI,
			// give it the randomly chosen img
			img: randObjImg
		});
		
		// now that distance is set, make its scale based on dist
		objects[j].scale = objects[j].distance/(cw*0.2);
	}
	
	// only start the update loop once the star image loads
	starImg.addEventListener("load", function() {
		requestAnimationFrame(update);
	});
}

function update() {
	// reset canvas drawing and position
	ctx.clearRect(0, 0, cw, ch);
	canvas.width = cw = window.innerWidth;
	ch = canvas.height;
	
	// loop each star to update and draw them
	for (var i = 0; i < numStars; ++i) {
		// use trig to get the position we should draw the star at
		var drawPos = {
			x: cw/2 + stars[i].distance*Math.cos(stars[i].angle),
			y: ch*1.25 + stars[i].distance*Math.sin(stars[i].angle)
		};
		
		// only draw stars that'll actually be on the canvas
		if (drawPos.y > -starImg.height && drawPos.y < ch) {
			// draw the star
			ctx.drawImage(starImg, drawPos.x, drawPos.y, starImg.width*stars[i].scale, starImg.height*stars[i].scale);
		}
		
		// rotate star slightly
		stars[i].angle -= 0.0004;
	}
	
	// draw the earth in front of stars but below clouds
	ctx.save();
		time += 0.0004;
		ctx.translate(cw/2, ch);
		ctx.rotate(-time);
		ctx.drawImage(earthImg, -earthImg.width/2, -earthImg.height/2);
	ctx.restore();
	
	// loop each object to update and draw them
	ctx.save();
	ctx.translate(cw/2, ch);
	for (var j = 0; j < objects.length; ++j) {	
		ctx.save();
		ctx.globalAlpha = 0.8;
		
		// rotate based on object's angle
		ctx.rotate(objects[j].angle);
		
		// if it's a shooting star, handle it differently
		// shooting stars fade in/out, move faster, and die
		if (objects[j].img === shootingStarImg) {
			++objects[j].age;
		
			// rotate star quickly
			objects[j].angle -= 0.02;
			
			// check if the star is ready to die
			if (objects[j].age >= 360) {
				objects.splice(j, 1);
			}
			// if not, set opacity based on age and draw it
			else {
				// new - fade in
				if (objects[j].age < 60) {
					ctx.globalAlpha = objects[j].age/60;
				}
				// old - fade out
				else if (objects[j].age > 300) {
					ctx.globalAlpha = 1 - ((objects[j].age - 300)/60);
				}
				// otherwise, draw at full opacity
				else {
					ctx.globalAlpha = 1;
				}
				
				ctx.drawImage(objects[j].img, objects[j].distance - objects[j].img.width/2, -objects[j].img.height/2, objects[j].img.width*objects[j].scale, objects[j].img.height*objects[j].scale);
			}
		}
		// always draw the object if it's not a star
		else {
			// rotate object slightly
			objects[j].angle -= 0.0004;
		
			// draw the object
			ctx.drawImage(objects[j].img, objects[j].distance - objects[j].img.width/2, -objects[j].img.height/2, objects[j].img.width*objects[j].scale, objects[j].img.height*objects[j].scale);
		}
		
		ctx.restore();
	}
	ctx.restore();
	
	// random chance to add a shooting star
	if (Math.random() < 0.003) {
		objects.push({
			// how far from the center the object is
			// objects spawn at least 1/3rd out towards the edge
			distance: cw/4 + Math.pow(Math.random(),2)*(cw/4),
			// the rotation angle of the object
			// randomly rotated between 0 and a full circle (2PI)
			angle: Math.random()*2*Math.PI,
			// shooting star is always scale 1
			scale: 1,
			// give it the shooting star img
			img: shootingStarImg,
			// how long the star has lived for, dies at 1000
			age: 0
		});
	}
	
	// draw an overlay to dim stars
	ctx.fillStyle = "rgba(25, 50, 120, 0.65)";
	ctx.fillRect(0, 0, cw, ch);

	requestAnimationFrame(update);
}