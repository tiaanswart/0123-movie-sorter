// Builds Watched Movie list input
const buildWatchedMovies = function(watchedMovies) {
    // Clear container
    $('.watchedMoviesListContainer').show();
    $('.watchedMoviesList').html('');
    // If we have movies
    if (typeof watchedMovies !== 'undefined' && watchedMovies.length) {
        // For each movie
        watchedMovies.forEach(function(watchedMovie) {
            $('.watchedMoviesList').append(
                '<label>'+
                    '<input type="checkbox" name="watchedMovies[]" value="'+watchedMovie+'" checked="checked"/>'+
                    '&nbsp;' + watchedMovie +
                '</label><br/>'
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
    let watchedMovies = [];
    $('input[name^="watchedMovies"]').each(function() {
        if ($(this).prop('checked')) {
            watchedMovies.push($(this).val());
        }
    });
    chrome.storage.sync.set({
        enabled: enabled,
        pagesToSearch: pagesToSearch,
        watchedMovies: watchedMovies
    }, function() {
        // Rebuild the watched movies
        buildWatchedMovies(watchedMovies);
        // Update status to let user know options were saved.
        $('.status').text('Options saved.');
        setTimeout(function() {
            $('.status').text('');
        }, 750);
    });
}

// Restores with default or stored options
const restoreOptions = function() {
    chrome.storage.sync.get({
        enabled: true,
        pagesToSearch: 10,
        watchedMovies: []
    }, function(items) {
        $('#enabled').prop('checked', items.enabled);
        $('#pagesToSearch').val(items.pagesToSearch);
        buildWatchedMovies(items.watchedMovies);
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
$(document).delegate('.save', 'click', saveOptions);