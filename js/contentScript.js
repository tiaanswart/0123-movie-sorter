const removeInvalidImages = (currentHost, currentBase) => {
	// Get the images
	$('img').each(function( index ) {
		// Get the img
		let theImage = $(this);
		let theSrc = theImage.attr('src');
		// Only try
		try {
		    // If the host is not the same
			if (!(new URL(theSrc)).host.endsWith(currentHost)) {
				// Remove it
				$(this).remove();
				return true;
			}
		}
		// Else remove
		catch(err) {
			// Remove it
			$(this).remove();
			return true;
		}
	});
}

const removeInvalidLinks = (currentHost, currentBase) => {
	// Get the page links
	$('a:link').each(function( index ) {
		// Get the link
		let theAnchor = $(this);
		let theLink = theAnchor.attr('href');
		// First if the link starts with //
		// Or #
		// Or javascript
		if (theLink.startsWith('//') 
		|| (theLink.startsWith('#') && theAnchor.attr('role') != 'tab')
		|| theLink.startsWith('javascript')) {
			// Remove it
			$(this).remove();
			return true;
		// Else if the link starts with / (internal link)
		} else if (theLink.startsWith('/')) {
			// Set a base
			theLink = currentBase + theLink;
			$(this).attr('href', theLink);
		}
		// Now that we know we have a proper link
		// If the host is not the same
		if ((new URL(theLink)).host != currentHost) {
			// Remove it
			$(this).remove();
			return true;
		}
	});
}

const removeIframes = () => {
	$('iframe').remove();
}

const removeKnownAds = () => {
	$('[class*="ads"]').remove();
	$('[class*="addthis"]').remove();
}

const sortMovies = (theMovieList) => {
	// Run through each and sort it
	theMovieList.find('.ml-item').sort(function(a, b) {
		// Sort decending
	    return +b.dataset.sorthandle - +a.dataset.sorthandle;
	})
	// Add back to list
	.appendTo(theMovieList);
}

const paginate = (theMovieListWrapper, appendingMovieList) => {
	// Get progress bar
	let theProgressBar = appendingMovieList.find('.progress-bar');
	// Get the progress
	let theProgress = theProgressBar.width() / theProgressBar.parent().width() * 100;
	// If we have pagination
	if (theMovieListWrapper.find('.pagination li.active').length && theProgress < 100) {
		// Get the page links
		theMovieListWrapper.find('.pagination li.active').nextAll().each(function( index ) {
			// Get the link
			let theLink = $(this).find('a').attr('href');
			// Now get the page from the link
			$.ajax({
				url: theLink,
				method: "GET"
			}).done(function(data) {
				// We only want to go down 10 pages (no one really goes down more... right?)
				theProgressBar.css('width', (theProgress+10)+'%');
				// We have the next set of movies, so get the info
				getMoviesInfo($(data).find('.movies-list-wrap'), appendingMovieList);
			})
			.fail(function(xhr) {
				// Log the error
				console.log('error', xhr);
			});
			return false;
		});
		// We're done with it so remove it
		theMovieListWrapper.find('#pagination').remove();
	} else {
		// Remove the progress bar. We are done
		theProgressBar.parent().remove();
		$(".jt").cluetip({
			positionBy: 'fixed'
		});
	}
	// No one likes to go looking for the good ones :)
	sortMovies(appendingMovieList);
}

const getMoviesInfo = (theMovieListWrappers, appendingMovieList, tabIndex) => {
	// For each list on the page with movies
	theMovieListWrappers.each(function( index ) {
		// Get the wrapped list of movies
		let theMovieListWrapper = $(this);
		// Help handle tabbing here
		let theChild = typeof tabIndex === 'undefined' || appendingMovieList == null ? 
							(theMovieListWrapper.find('.movies-list').length > 1 ? ':first-child' : '') : ':nth-child('+tabIndex+')';
		// Get the full list of movies, show it incase we lost it
		let theMovieList = theMovieListWrapper.find('.movies-list'+theChild).show();
		// Set the list that needs to be applied to
		let theAppendingList = typeof appendingMovieList === 'undefined' || appendingMovieList == null ? theMovieList : appendingMovieList;
		// Add the progress bar if we dont have one
		if (!theAppendingList.find('.progress').length) {
			theAppendingList.prepend(
				'<div class="progress">'+
					'<div class="progress-bar progress-bar-striped active" role="progressbar" style="width:0%">'+
						'<span style="color:black">Loading</span>'+
					'</div>'+
				'</div>'
			);
		}
		// A bit creepy but dig in
		theMovieList.find('.ml-item').each(function( index ) {
			// Get the elements we need
			let theMovieElem = $(this);
			let theMovieMaskElem = theMovieElem.find('.ml-mask');
			let thHeadingElem = theMovieElem.find('.mli-info');
			let theQualityElem = theMovieElem.find('.jtip-quality');
			let theTootipTopElem = theMovieElem.find('.jtip-top');
			// Get the title
			let theMovieTitle = theMovieMaskElem.attr('title');
			// If it's not HD then why bother? Also duplicate control
			if (theQualityElem.text() == 'HD' && theAppendingList.find('.ml-item[title="'+theMovieTitle+'"]').length == 0) {
				// Okay we have a good quality movie
				// Now the fun starts
				// Get the info we want so badly from the tooltip top
				let theNewInfoElem = theTootipTopElem.clone().removeClass('jtip-top').addClass('mli-quality').css({'left' : 8, 'right' : 'auto'});
				// Now add the info right after the heading elem
				thHeadingElem.after(theNewInfoElem);
				let theIMDbRating = theTootipTopElem.find('.jt-imdb').text().replace('IMDb: ','');
				let theYear = theTootipTopElem.find('.jt-info:nth-child(2)').text();
				// We need to record the IMDB rating + the year for sorting
				theMovieElem.attr('data-sorthandle', theYear+theIMDbRating);
				// Set the title
				theMovieElem.attr('title', theMovieTitle);
				// Set the mask target and set the link to play mode
				theMovieMaskElem.attr('target','_blank').attr('href', theMovieMaskElem.attr('href') + '?play=1');
				// Add the movie back in
				theAppendingList.append(theMovieElem);
				// Make sure the thumb is visible
				theMovieElem.find('.mli-thumb').attr('style','');
			} else {
				theMovieElem.remove();
			}
		});
		// Now some more helpfulness, no one likes to go clicking buttons for the next page!
		paginate(theMovieListWrapper, theAppendingList);
	});
}

const init = () => {
	// Establish a base
	let currentProtocol = location.protocol;
	let currentHost = location.host;
	let currentBase = currentProtocol + '//' + currentHost;
	// Some virus protection
	removeInvalidImages(currentHost, currentBase),
	removeInvalidLinks(currentHost, currentBase),
	removeIframes(),
	removeKnownAds(),
	// Get the info from movies
	getMoviesInfo($('.movies-list-wrap'), null, null),
	// Handle nav tab clicks
	$(".nav-tabs").delegate('li', 'click', function () {
		// Get the index
		let theIndex = $(this).index() + 1;
		// Get the parents
		let theInlaws = $(this).parents('.movies-list-wrap');
		// Get the list
		let theMovieList = theInlaws.find('.movies-list:nth-child('+theIndex+')');
		// If this list has no childen (still needs to be loaded)
		if (!theMovieList.find('.ml-item').length) {
			// Hide and seek
			theMovieList.hide();
			// Create loading animation
			theInlaws.append($('<div class="cssload-center"><div class="cssload"><span></span></div></div>'));
			// Wait 3 seconds (I'd much rather wait for DOMSubtreeModified trigger but I am lazy)
			setTimeout(function(){
				// Get the info from movies
				getMoviesInfo(theInlaws, theMovieList, theIndex);
				// Remove loading animation
				$('.cssload-center').remove();
			}, 3000);
		}
	});
}

init();