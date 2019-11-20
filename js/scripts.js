/**
 * @file
 */

// Initialize our object into the window for later use.
var pac12_vod = pac12_vod || {};

(($, Drupal, drupalSettings, pac12_vod) => {
  // List page settings
  var vod_list_limit = drupalSettings.pac12_vod.vod_list_limit ? drupalSettings.pac12_vod.vod_list_limit : 10;
  var vod_list_sport = drupalSettings.pac12_vod.vod_list_sport ? drupalSettings.pac12_vod.vod_list_sport : '';
  var vod_infinite = drupalSettings.pac12_vod.vod_infinite ? drupalSettings.pac12_vod.vod_infinite : false;
  // List block settings
  var vod_block_list_limit = drupalSettings.pac12_vod.vod_block_list_limit ? drupalSettings.pac12_vod.vod_block_list_limit : 10;
  var vod_block_list_sport = drupalSettings.pac12_vod.vod_block_list_sport ? drupalSettings.pac12_vod.vod_block_list_sport : '';
  // API Settings
  var schoolURL = 'https://api.pac-12.com/v3/schools/';
  var sportsURL = 'https://api.pac-12.com/v3/sports';
  var vodURL = 'https://api.pac-12.com/v3/vod?';
  // Local containers
  var vodData;
  var schools = {};
  pac12_vod.sports = {};

  /**
   * Converts an object of parameters into a URL encoded query string
   *
   * @param {object} obj
   *  The object of parameters
   *
   * @return string
   */
  function buildParams(obj) {
    return Object.keys(obj).map(key => {
      return key + '=' + encodeURIComponent(obj[key]);
    }).join('&');
  }

  /**
   * Make a XHR request to a URL and return a JSON object
   *
   * @param {string} url
   *  The API URL to call
   *
   * @return {object}
   *  The JSON response
   */
  function callApi(url) {
   return  fetch(url).then(response => {
      if (response.headers.get('content-type') != 'application/json') {
        throw new TypeError();
      }
      return response.json();
    });
  }

  /**
   * Tries to make an API call and reports any errors
   *
   * @param {string} url
   *  The URL to call
   *
   * @return {object}
   *  The JSON response object
   */
  async function getData(url) {
    var res;
    try {
      res = await callApi(url); 
    } catch(e) {
      console.error(e);
    }
    return res;
  }

  /**
   * Calls the API to get a listing of schools based on
   * an array of IDs.
   *
   * @param {array} schoolIds
   *
   * @return
   *  The promise
   */
  async function getSchools(schoolIds) {
    return getData(schoolURL + encodeURIComponent(schoolIds.join(";"))).then(data => {
      if (data.schools && data.schools.length) {
        data.schools.forEach(school => {
          schools[school.id] = school;
        });
      }

      return;
    });
  }

  /**
   * Calls the API to get a listing of sports.
   *
   * @return
   *  The promise
   */
  async function getSports() {
    return getData(sportsURL).then(data => {
      if (data.sports.length) {
        data.sports.forEach(sport => {
          pac12_vod.sports[sport.id] = sport.name;
        });
      }

      return;
    });
  }

  /**
   * The main promise function for gathering and parsing
   * VOD list data. First collects a list of VODs and then
   * updates the School and Sport data.
   *
   * @param {string} type
   *  The type of list we are getting, either 'page' or 'block'
   *
   * @return {array}
   *  The array of VOD objects
   */
  pac12_vod.loadVods = async function(type) {
    var schoolIds = [];
    var vodParams = {
      page: '',
      pagesize: vod_list_limit,
      sort: 'DESC',
      sports: vod_list_sport
    };

    if (type === 'block') {
      vodParams['pagesize'] = vod_block_list_limit;
      vodParams['sports'] = vod_block_list_sport;
    }

    // Call the API and return a promise
    return getData(vodURL + buildParams(vodParams))
      .then(data => {
        // If results were returned continue
        if (data.programs.length) {
          // Loop over each VOD returned.
          data.programs.forEach(vod => {
            // If the VOD has school(s) listed, get the IDs
            if (vod['schools']) {
              vod['schools'].forEach(school => {
                if (schoolIds.indexOf(school['id']) === -1) {
                  schoolIds.push(school['id']);
                }
              });
            }
          });

          if (data.next_page) {
            vodURL = data.next_page;
          }

          // Return the VODs objects
          return data.programs;
        }
      })
      .then(vods => {
        // If we collected school IDs, we need to go get the school details.
        if (schoolIds.length) {

          // Call the API for school details and return a promise
          return getSchools(schoolIds).then(data => {
            // Loop over each VOD and return the vods object
            return vods = vods.map(vod => {
              // Set up some new keys
              vod.sportsList = '';
              vod.schoolsList = '';

              // If the video has school data
              if (vod.schools) {
                // Loop over the school IDs and merge in the school data
                vod.schools = vod.schools.map(school => {
                  if (school.id) {
                    return schools[school.id];
                  }
                });

                // Then create an array of school names
                vod.schoolsList = vod.schools.map(school => {
                  if (school.name) {
                    return school.name;
                  }
                });

                // Convert the school array into a comma separated string
                if (vod.schoolsList.length > 1) {
                  vod.schoolsList = vod.schoolsList.join(', ');
                }
              }

              // If the video has sport data
              if (vod.sports) {
                // Loop over the sport IDs and replace with the sport name
                vod.sports = vod.sports.map(sport => {
                  if (sport.id) {
                    return pac12_vod.sports[sport.id];
                  }
                });

                // Convert the sport array into a comma separated string
                vod.sportsList = vod.sports.join(', ');
              }

              // Return the item in the map loop
              return vod;
            });
          });
        }
      });
  }

  /**
   * Converts a string of millisecond value to an array
   * in the format [HH,MM,SS] if greater than one hour,
   * or [MM,SS] if less than one hour
   *
   * @param {string} sec
   *
   * @return {array}
   *  The array of time values
   */
  function parseDuration(sec) {
    // Convert miliseconds to seconds
    sec = sec / 1000;
    // Convert to int
    sec = parseInt(sec, 10);
    var duration = [];

    // Hours
    duration[0] = Math.floor(sec / 3600);
    // Minutes
    duration[1] = Math.floor(sec / 60) % 60;
    // Seconds
    duration[2] = sec % 60;

    // return an array of (hh),mm,ss
    return duration.map(val => {
      // We want the format to be 2 characters always, so add leading zero if needed
      if (val < 10) {
        return '0' + val;
      }
      return val;
    });;
  }

  /**
   * Here's the render function that takes the parsed
   * VOD objects and appends them to the correct element
   * on the page.
   *
   * @param {string} id
   *  The HTML #ID of the element to append to
   *
   * @param {object} vods
   *  The array of VOD objects
   */
  pac12_vod.renderVods = function(id, vods) {
    $.each(vods, (i, item) => {
      // Build the duration array and remove hours if it is '00'
      var duration = parseDuration(item.duration);
      duration = duration.filter((val, i) => {
        if (i === 0 && val === '00') {
          return;
        }
        return val;
      });
      $(id).append(
        `<li class="vod-item-wrapper">
          <div class="vod-item">
            <a class="vod-image-a" href="${item.url}"><img class="vod-thumb" src="${item.images.small}" /></a>
            <a class="vod-title-a" href="${item.url}">${item.title}</a>
            <div class="vod-item-schools">${item.schoolsList}</div>
            <div class="vod-details-wrapper"><span class="vod-item-duration">Duration: ${duration.join(':')}</span>
            <span class="vod-item-sports">${item.sportsList}</span></div>
          </div>
        </li>`
      );
    });
  }

  if (vod_infinite) {
    $(window).on('scroll', _.throttle(() => {
      // // End of the document reached?
      if ($(document).height() - $(this).height() == $(this).scrollTop()) {
        pac12_vod.loadVods('page').then(vods => {
          // Now we build the content element and render it
          pac12_vod.renderVods('#list-container', vods);
        });
      }
    }, 100));
  }

  /**
   * On page ready, start things off.
   */
  $(function() {
    // First, we need to get a list of all sports
    getSports().then(() => {
      // Then we get the VODs
      pac12_vod.loadVods('page').then(vods => {
        // Now we build the content element and render it
        pac12_vod.renderVods('#list-container', vods);
      });
      pac12_vod.loadVods('block').then(vods => {
        // Now we build the content element and render it
        pac12_vod.renderVods('#list-block-container', vods);
      });
    });
  });
})(jQuery, Drupal, drupalSettings, pac12_vod);
