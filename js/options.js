// Builds Quality list input
const buildMovieQualityList = function(movieQualityList) {
    chrome.storage.sync.get({
        allMovieQualities: ['HD','SD']
    }, function(items) {
        // Clear container
        $('.movieQualityListContainer').show();
        $('.movieQualityList').html('');
        // If we have qualities
        if (typeof items.allMovieQualities !== 'undefined' && items.allMovieQualities.length
            && typeof movieQualityList !== 'undefined' && movieQualityList.length) {
            // Separate checked and unchecked markup
            let theChecked = '';
            let theUnchecked = '';
            // Sort first
            items.allMovieQualities.sort();
            // For each movie
            items.allMovieQualities.forEach(function(movieQuality) {
                let checked = movieQualityList.includes(movieQuality);
                let theMarkup = '<label>'+
                                    '<button class="removeLabel" '+(checked ? 'disabled="disabled"' : '')+'>Remove</button>&nbsp;' +
                                    '<input type="checkbox" name="movieQualityList[]" value="'+movieQuality+'" '+(checked ? 'checked="checked"' : '')+'/>'+
                                    '&nbsp;' + movieQuality +
                                '</label>'
                if (checked) {
                    theChecked += theMarkup;
                } else {
                    theUnchecked += theMarkup;
                }
            });
            // Checked first then Unchecked
            $('.movieQualityList').append(theChecked+theUnchecked);
        } else {
            $('.movieQualityListContainer').hide();
        }
    });
}

// Builds Watched Movie list input
const buildWatchedMoviesList = function(watchedMoviesList) {
    // Clear container
    $('.watchedMoviesListContainer').show();
    $('.watchedMoviesList').html('');
    // If we have movies
    if (typeof watchedMoviesList !== 'undefined' && watchedMoviesList.length) {
        // Sort first
        watchedMoviesList.sort();
        // For each movie
        watchedMoviesList.forEach(function(watchedMovie) {
            $('.watchedMoviesList').append(
                '<label>'+
                    '<input type="checkbox" name="watchedMoviesList[]" value="'+watchedMovie+'" checked="checked"/>'+
                    '&nbsp;' + watchedMovie +
                '</label>'
            );
        });
    } else {
        $('.watchedMoviesListContainer').hide();
    }
}

// Saves options to chrome.storage.sync.
const saveOptions = function() {
    let enabled = $('#enabled').prop('checked');
    let pagesToSearch = parseInt($('#pagesToSearch').val());
    let minIMBDRating = parseInt($('#minIMBDRating').val());
    let allMovieQualityList = [];
    let movieQualityList = [];
    $('input[name^="movieQualityList"]').each(function() {
        allMovieQualityList.push($(this).val());
        if ($(this).prop('checked')) {
            movieQualityList.push($(this).val());
        }
    });
    let watchedMoviesList = [];
    $('input[name^="watchedMoviesList"]').each(function() {
        if ($(this).prop('checked')) {
            watchedMoviesList.push($(this).val());
        }
    });
    chrome.storage.sync.set({
        enabled: enabled,
        pagesToSearch: pagesToSearch,
        minIMBDRating: minIMBDRating,
        allMovieQualities: allMovieQualityList,
        movieQualities: movieQualityList,
        watchedMovies: watchedMoviesList
    }, function() {
        // Rebuild the lists
        buildMovieQualityList(movieQualityList);
        buildWatchedMoviesList(watchedMoviesList);
        // Update status to let user know options were saved.
        $('.status').text('Options saved.');
        setTimeout(function() {
            $('.status').text('');
        }, 750);
    });
}

// Filters lists of Quality and Movie Names
const filterList = function() {
    // Get the search input
    let theSearchInput = $(this).val();
    // If we have something to filter with
    if (theSearchInput.length) {
        // Run through elements and check
        $(this).parent().find('div label').each(function() {
            // Get the label and input
            let theLabel = $(this);
            let theInput = theLabel.find('input');
            let theInputVal = theLabel.find('input').val();
            // If the input value contains the filter criteria
            if (theInputVal.toLowerCase().indexOf(theSearchInput.toLowerCase()) >= 0) {
                // Then show the Label
                theLabel.removeClass('hideLabel');
            } else {
                // Else hide
                theLabel.addClass('hideLabel');
            }
        });
    } else {
        // Show all inputs
        $(this).parent().find('div label').removeClass('hideLabel');
    }
}

// Handle Label Clicks correctly
const labelClick = function(e) {
    // Prevent default behaviour
    e.preventDefault();
    // Now toggle any checkbox in the label
    $(this).find('input[type="checkbox"]').prop('checked',!$(this).find('input[type="checkbox"]').prop('checked'));
    // Based on the checkbox disable any buttons
    $(this).find('button').prop('disabled',$(this).find('input[type="checkbox"]').prop('checked'));
}

// Remove Item from Quality List
const removeLabel = function(e) {
    // Remove the label
    $(this).parent().remove();
}

// Init the lists
const restoreOptions = function() {
    // Restores with default or stored options
    chrome.storage.sync.get({
        enabled: true,
        pagesToSearch: 10,
        minIMBDRating: 6,
        movieQualities: ['HD'],
        watchedMovies: []
    }, function(items) {
        $('#enabled').prop('checked', items.enabled);
        $('#pagesToSearch').val(items.pagesToSearch);
        $('#minIMBDRating').val(items.minIMBDRating);
        buildMovieQualityList(items.movieQualities);
        buildWatchedMoviesList(items.watchedMovies);
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
$(document).delegate('.save', 'click', saveOptions);
$(document).delegate('#movieQualityListSearch, #watchedMoviesListSearch', 'keyup', filterList);
$(document).delegate('label', 'click', labelClick);
$(document).delegate('.removeLabel', 'click', removeLabel);