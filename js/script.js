'use strict';

var mquery = window.matchMedia('(max-width: 800px)'); // get media query

window.addEventListener('load', init);

// Where we'll store the list of my projects
var projButtons;

// Reference to the main project info pane and page blackening overlay
var projInfo;
var globalOverlay;

// References to the left/right arrow buttons
var leftScrollButton;
var rightScrollButton;


// Called when page is updated
function init() {
	// grab all of the project buttons
	projButtons = document.querySelectorAll('.projButton');
	
	// grab the project info pane and overlay
	projInfo = document.querySelector('#projInfo');
	globalOverlay = document.querySelector('#globalOverlay');
	
	// and add a callback for each project button to load their respective page
	for (var i = 1; i < projButtons.length; ++i) {
		
		// grab href and use it to set background image
		var href = projButtons[i].getAttribute('data-href');
		projButtons[i].firstChild.nextSibling.style.backgroundImage = "url('media/" + href + "/tile.png')";
			
		// make each tile load its respective content
		projButtons[i].addEventListener('click', function(e) {
			loadPage(e.target.getAttribute('data-href'));
		});
	}
		
	// Lowers proj viewer on window click
	globalOverlay.addEventListener("click", function(e) {
		closeProjectViewer();
	});
	
	// other options for closing windows
	window.addEventListener("keyup", function(e) {
		// escape can close gallery
		if (e.keyCode == 27) {
			closeProjectViewer();
		}
	});
}

// Loads HTML from a given href source
function loadPage(href) {
	// open a link to the href and send request to load it
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open('GET', 'pages/' + href + '.html', true);
	xmlhttp.send();
	
	// return the response
	xmlhttp.addEventListener('load', function() {
		projInfo.innerHTML = "<p id='escape'>X</p><div>" + xmlhttp.responseText + "</div>";
		projInfo.style.display = "block";
		globalOverlay.style.opacity = "0.65";
		globalOverlay.setAttribute("data-noPointer", "false");
		document.querySelector('#escape').addEventListener("click", closeProjectViewer);
		
		setupGallery();
	});
}

// Attempts to close project viewer if it's open
function closeProjectViewer() {
	if (projInfo.style.display == "block") {
		projInfo.style.display = "none";
		globalOverlay.style.opacity = "0";
		globalOverlay.setAttribute("data-noPointer", "true");
	}
}