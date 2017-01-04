window.onscroll = scrollUpdate;
window.onresize = scrollUpdate;

// Updates the header/nav bar display when the user scrolls
function scrollUpdate() {
	// grab the header and get our scroll distance
	var scroll = document.body.scrollTop;
	var header = document.querySelector('header');
	var banner = document.querySelector('#banner');
	var canvas = document.querySelector('#headerCanvas');
	
	// slide header up based on our scroll distance
	if (header) {
		header.style.top = '-' + (scroll*2/3) + 'px';
		headerCanvas.style.top = '-' + scroll + 'px';
	}
	
	// make the nav banner visible if we're scrolled down far enough
	if (banner)
	if (scroll > 270) {
		banner.style.visibility = 'visible';
		header.style.visibility = 'hidden';
		headerCanvas.style.visibility = 'hidden';
	}
	else {
		banner.style.visibility = 'hidden';
		header.style.visibility = 'visible';
		headerCanvas.style.visibility = 'visible';
	}
}