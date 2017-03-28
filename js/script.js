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

// Reference to the header at the top of the page
var pageHeader;


// Called when page is updated
function init() {
	// grab all of the project buttons
	projButtons = document.querySelectorAll('.projButton');
	// grab the project info pane and overlay
	projInfo = document.querySelector('.projectContainer');
	// grab the page header so we can modiy its text
	pageHeader = document.querySelector("#pageTitle h1");
	
	// and add a callback for each project button to load their respective page
	for (var i = 0; i < projButtons.length; ++i) {
		
		// grab href and use it to set background image
		var href = projButtons[i].getAttribute('data-href');
		projButtons[i].firstChild.nextSibling.style.backgroundImage = "url('../media/" + href + "/tile.png')";
			
		// make each tile load its respective content
		projButtons[i].addEventListener('click', function(e) {
			loadPage(e.target.getAttribute('data-href'));
		});
	}
	
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
	xmlhttp.open('GET', href + '.html', true);
	xmlhttp.send();
	
	projInfo.setAttribute('data-oldContents', projInfo.innerHTML);
	pageHeader.innerText += " > " + href.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});

	// return the response
	xmlhttp.addEventListener('load', function() {
		projInfo.innerHTML = "<p id='escape'>X</p><div>" + xmlhttp.responseText + "</div>";
		document.querySelector('#escape').addEventListener("click", closeProjectViewer);
		
		setupGallery();
	});
}

// Attempts to close project viewer if it's open
function closeProjectViewer() {
	projInfo.innerHTML = projInfo.getAttribute('data-oldContents');
	init();
}