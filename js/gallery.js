"use strict";

function setupGallery() {
	var gallery = document.querySelector('#gallery');
	var galleryCaption = document.querySelector('#galleryCaption');
	var prevImgButton = document.querySelector('#prevImgButton');
	var nextImgButton = document.querySelector('#nextImgButton');
	var href = gallery.getAttribute("data-href");
	var maxImgNumber = parseInt(gallery.getAttribute("data-maxImg"));
	var imgNumber = 1;

	prevImgButton.addEventListener("click", function() {
		imgNumber = (imgNumber - 1 < 1 ? maxImgNumber : imgNumber - 1);
		
		gallery.src = "../media/" + href + "/" + href + imgNumber + ".png";
		gallery.onerror = function() {
			gallery.src = "../media/" + href + "/" + href + imgNumber + ".gif";
		}
	});
	
	nextImgButton.addEventListener("click", function() {
		imgNumber = (imgNumber + 1 > maxImgNumber ? 1 : imgNumber + 1);
		
		gallery.src = "../media/" + href + "/" + href + imgNumber + ".png";
		gallery.onerror = function() {
			gallery.src = "../media/" + href + "/" + href + imgNumber + ".gif";
		}
	});
};