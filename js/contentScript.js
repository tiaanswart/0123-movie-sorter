const removeInvalidLinks = () => {
	// Establish a base
	let currentProtocol = location.protocol;
	let currentHost = location.host;
	let currentBase = currentProtocol + '//' + currentHost;
	// Get the page links
	$('a:link').each(function( index ) {
		// Get the link
		let theAnchor = $(this);
		let theLink = theAnchor.attr('href');
		// First if the link starts with //
		// Or #
		// Or javascript
		if (theLink.startsWith('//') 
		|| (theLink.startsWith('#') && theAnchor.attr('role') != 'tab' 
			&& theAnchor.parent().find('.sub-container').length == 0)
		|| theLink.startsWith('javascript')) {
			// Remove it
			$(this).remove();
		// Else if the link starts with / (internal link)
		} else if (theLink.startsWith('/')) {
			// Set a base
			$(this).attr('href', currentBase + theLink);
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

const removeOnClickEvents = () => {
	$('*').each(function( index ) {
		this.onclick = '';
		this.mousedown = '';
	});
}

const sortMovies = (theMovieList) => {
    return new Promise(function(resolve, reject) {
        // Run through each and sort it
        theMovieList.find('.ml-item').sort(function(a, b) {
            // Sort decending
            return +b.dataset.sorthandle - +a.dataset.sorthandle;
        })
        // Add back to list
        .appendTo(theMovieList);
        resolve(true);
	});
}

const paginate = (theMovieListWrapper, appendingMovieList) => {
    return new Promise(function(resolve, reject) {
        // Get progress bar
        let theProgressBar = appendingMovieList.find('.progress-bar');
        // Get the progress
        let theProgress = typeof theProgressBar.data('progress') !== 'undefined' ? theProgressBar.data('progress') : 1;
        // If we have pagination and we havent reached the search limit yet
        if (theMovieListWrapper.find('.pagination li.active').length && theProgress < pagesToSearch) {
            // Get the page links
            theMovieListWrapper.find('.pagination li.active').nextAll().each(function( index ) {
                // Get the link
                let theLink = $(this).find('a').attr('href');
                // Now get the page from the link
                $.ajax({
                    url: theLink,
                    method: "GET"
                }).done(function(data) {
                    // We'll increment the progress bar
                    theProgressBar.css('width', (100 / pagesToSearch * theProgress)+'%');
                    // We'll increment the progress
                    theProgressBar.data('progress', theProgress + 1);
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
        }
        // No one likes to go looking for the good ones :)
        resolve(sortMovies(appendingMovieList));
	});
}

const getMoviesInfo = (theMovieListWrappers, appendingMovieList, tabIndex) => {
    return new Promise(function(resolve, reject) {
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
       						'<span style="color:black;padding:10px 0;">Loading</span>'+
       					'</div>'+
       				'</div>'
       			);
       		}
       		// A bit creepy but clone and yeah dig in
       		theMovieList.find('.ml-item').each(function( index ) {
       			// Get the elements we need
       			let theMovieElem = $(this);
       			let theMovieMaskElem = theMovieElem.find('.ml-mask');
       			let thHeadingElem = theMovieElem.find('.mli-info');
       			let theQualityElem = theMovieElem.find('.jtip-quality');
       			let theTootipTopElem = theMovieElem.find('.jtip-top');
       			// Get the title
       			let theMovieTitle = theMovieMaskElem.attr('title');
       			// Get the year
       			let theYear = theTootipTopElem.find('.jt-info:nth-child(2)').text();
       			// Get the IMDB rating
                let theIMDbRating = parseInt(theTootipTopElem.find('.jt-imdb').text().replace('IMDb: ',''));
       			// Get the Quality
                let theQuality = theQualityElem.text().toUpperCase();
                // If the Movie Quality list does not contain this quality
                if (!allMovieQualitiesList.includes(theQuality)) {
                    // Then add it
                    allMovieQualitiesList.push(theQuality);
                }
       			// Get the full movie name
       			let fullMovieName = theMovieTitle + ' (' + theYear + ')';
       			// Check that its the right quality, has no duplicate and has not been marked as watched
       			if (theAppendingList.find('.ml-item[title="'+theMovieTitle+'"]').length == 0
       				&& theIMDbRating >= minIMBDRating
       				&& movieQualitiesList.includes(theQuality.toUpperCase())
       				&& !watchedMoviesList.includes(fullMovieName)) {
       				// Okay we have a good quality movie
       				// Now the fun starts
       				// Get the info we want so badly from the tooltip top
       				let theNewInfoElem = theTootipTopElem.clone()
       													 .removeClass('jtip-top')
       													 .addClass('mli-quality')
       													 .css({'left' : 8, 'right' : 'auto'});
       				// Now add the info right after the heading elem
       				thHeadingElem.after(theNewInfoElem);
       				// We need to record the IMDB rating + the year for sorting
       				theMovieElem.attr('data-sorthandle', theYear+theIMDbRating);
       				// Set the title
       				theMovieElem.attr('title', fullMovieName);
       				// Set the mask target and set the link to play mode
       				theMovieMaskElem.attr('target','_blank')
       								.attr('href', theMovieMaskElem.attr('href') + '?play=1');
       				// Add the movie back in
       				theAppendingList.append(theMovieElem);
       				// Make sure the thumb is visible
       				theMovieElem.find('.mli-thumb').attr('style','');
       				// Add button to top for removing
       				let theButton = $('<a>Remove</a>').addClass('jtip-quality markAsWatchedBtn text-center')
       									 			  .css({'top':0,'width':'100%','height':18,'border-radius':'5px 5px 0 0','padding-top':'5px','z-index':9});
       				theMovieElem.prepend(theButton);
       				// Set additional styling
       				theMovieMaskElem.css({'padding-top':'18px'});
       				theMovieMaskElem.find('.mli-quality, .mli-eps').css({'top':'26px'});
       				theButton.hover(function() {
       				    $(this).css({'cursor':'pointer'});
       				})
       			} else {
       				theMovieElem.remove();
       			}
       		});
       		// Now some more helpfulness, no one likes to go clicking buttons for the next page!
       		resolve(paginate(theMovieListWrapper, theAppendingList));
       	});
    });
}

var pagesToSearch;
var minIMBDRating;
var allMovieQualitiesList;
var movieQualitiesList;
var watchedMoviesList;

const init = () => {
	// Some virus protection
	removeInvalidLinks(),
	removeIframes(),
	removeKnownAds(),
	removeOnClickEvents(),
	// If the extention is enabled
	chrome.storage.sync.get({
		enabled: true,
    	pagesToSearch: 10,
    	minIMBDRating: 6,
    	allMovieQualities: ['HD','SD'],
    	movieQualities: ['HD'],
    	watchedMovies: []
	}, function(items) {
		pagesToSearch = parseInt(items.pagesToSearch);
		minIMBDRating = parseInt(items.minIMBDRating);
		allMovieQualitiesList = items.allMovieQualities;
		movieQualitiesList = items.movieQualities;
		watchedMoviesList = items.watchedMovies;
		if (items.enabled) {
			// Get the info from movies
			let getMoviesInfoPromise = getMoviesInfo($('.movies-list-wrap'), null, null);
			// Update the All Movie Qualities List
			getMoviesInfoPromise.then(function(value) {
			    // Store all the movie qualities in the list
                chrome.storage.sync.set({
                    allMovieQualities: allMovieQualitiesList
                }, function() {});
            });
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
					// Wait 3 seconds (I'd much rather wait for DOMSubtreeModified trigger but I am lazy)
					setTimeout(function(){
						// Get the info from movies
						getMoviesInfo(theInlaws, theMovieList, theIndex);
					}, 3000);
				}
			});
			// First remove all onclick events again for inserted elements
			// @TODO check - still happening
			removeOnClickEvents();
			// Add button events
			$(document).delegate('.markAsWatchedBtn', 'click', function(){
				// Get the elements we need
				let theMovieElem = $(this).closest('.ml-item');
				let theMovieMaskElem = theMovieElem.find('.ml-mask');
				let theTootipTopElem = theMovieElem.find('.jtip-top');
				// Get the data we need
				let theMovieTitle = theMovieMaskElem.attr('title');
				let theYear = theTootipTopElem.find('.jt-info:nth-child(2)').text();
				// Get the full movie name
				let fullMovieName = theMovieTitle + ' (' + theYear + ')';
				// Get the movie list again
				chrome.storage.sync.get({
					watchedMovies: []
				}, function(items) {
					watchedMoviesList = items.watchedMovies;
					// Add the movie to the list if not already there
					if (!watchedMoviesList.includes(fullMovieName)) {
						watchedMoviesList.push(fullMovieName);
					}
					// Store the movie name in the list
					chrome.storage.sync.set({
						watchedMovies: watchedMoviesList
					}, function() {
						// Remove it
						theMovieElem.remove();
					});
				});
			});
		}
	});
}

// Init when loaded
init();