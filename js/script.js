'use strict';

var mquery = window.matchMedia('(max-width: 800px)'); // get media query

window.addEventListener('load', init);

// Where we'll store the list of my projects
var projButtons;

// Reference to the main project info pane and page blackening overlay
var projInfo;
var globalOverlay;

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
		var href = projButtons[i].getAttribute('data-href').replace(new RegExp(" ", 'g'), "");
		projButtons[i].firstChild.nextSibling.style.backgroundImage = "url('../media/" + href + "/tile.png')";
			
		// make each tile load its respective content
		projButtons[i].addEventListener('click', function(e) {
			var href = e.target.getAttribute('data-href');
			loadPage(href);
		});
	}
}

// Loads HTML from a given href source
function loadPage(href) {
	// open a link to the href and send request to load it
	var xmlhttp = new XMLHttpRequest();
	var trimmedHref = href.replace(new RegExp(" ", 'g'), "");
	xmlhttp.open('GET', trimmedHref + '.html', true);
	xmlhttp.send();
	
	projInfo.setAttribute('data-oldContents', projInfo.innerHTML);
	pageHeader.setAttribute('data-oldContents', pageHeader.innerText);
	pageHeader.innerText += " > " + href.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});

	// return the response
	xmlhttp.addEventListener('load', function() {
		projInfo.innerHTML = "<div>" + xmlhttp.responseText + "</div>";
		var projMediaPanel = document.querySelector(".projMedia");
		projMediaPanel.innerHTML = "<p id='escape'>Return to project listing</p>" + projMediaPanel.innerHTML;
		document.querySelector('#escape').addEventListener("click", closeProjectViewer);
		
		Galleria.loadTheme('galleria/themes/classic/galleria.classic.min.js');
		document.querySelector('.galleria').style.height = document.querySelector('.galleria').clientWidth + "px";
		Galleria.run('.galleria');
	});
}

// Attempts to close project viewer if it's open
function closeProjectViewer() {
	if (projInfo.hasAttribute('data-oldContents')) {
		projInfo.innerHTML = projInfo.getAttribute('data-oldContents');
		projInfo.removeAttribute('data-oldContents');
	}
	if (pageHeader.hasAttribute('data-oldContents'))
		pageHeader.innerText = pageHeader.getAttribute('data-oldContents');
	init();
}