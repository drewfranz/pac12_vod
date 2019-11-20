/**
 * @file
 */
(($, Drupal, drupalSettings) => {
  var vod_list_limit = drupalSettings.pac12_vod.vod_list_limit ? drupalSettings.pac12_vod.vod_list_limit : 10;
  var schoolURL = 'https://api.pac-12.com/v3/schools/';
  var sportsURL = 'https://api.pac-12.com/v3/sports';
  var vodURL = 'https://api.pac-12.com/v3/vod?';
  var vodParams = {
        page: '',
        pagesize: vod_list_limit,
        sort: 'DESC',
        sports: ''
      };
  var vodData;
  var schoolIds = [];
  var schools = {};
  var sports = {};

  function buildParams(obj) {
    return Object.keys(obj).map(key => {
      return key + '=' + encodeURIComponent(obj[key]);
    }).join('&');
  }

  function callApi(url) {
   return  fetch(url).then(response => {
      if (response.headers.get('content-type') != 'application/json') {
        throw new TypeError();
      }
      return response.json();
    });
  }

  async function getData(url) {
    var res;
    try {
      res = await callApi(url); 
    } catch(e) {
      console.error(e);
    }
    return res;
  }

  async function getSchools() {
    return getData(schoolURL + encodeURIComponent(schoolIds.join(";"))).then(data => {
      if (data.schools.length) {
        data.schools.forEach(school => {
          schools[school.id] = school;
        });
      }

      return;
    });
  }

  async function getSports() {
    return getData(sportsURL).then(data => {
      if (data.sports.length) {
        data.sports.forEach(sport => {
          sports[sport.id] = sport.name;
        });
      }

      return;
    });
  }

  async function loadVods() {
    return getData(vodURL + buildParams(vodParams))
      .then(data => {
        if (data.programs.length) {
          data.programs.forEach(vod => {
            if (vod['schools']) {
              vod['schools'].forEach(school => {
                if (schoolIds.indexOf(school['id']) === -1) {
                  schoolIds.push(school['id']);
                }
              });
            }
          });
          vodData = data.programs;
          if (data.next_page) {
            vodURL = data.next_page;
          }
          return;
        }
      })
      .then(() => {
        if (schoolIds.length) {
          return getSchools().then(data => {
            vodData = vodData.map(vod => {
              vod.sportsList = '';
              vod.schoolsList = '';
              if (vod.schools) {
                vod.schools = vod.schools.map(school => {
                  return schools[school.id];
                });
                vod.schoolsList = vod.schools.map(school => school.name);
                if (vod.schoolsList.length > 1) {
                  vod.schoolsList = vod.schoolsList.join(', ');
                }
              }
              if (vod.sports) {
                vod.sports = vod.sports.map(sport => {
                  return sports[sport.id];
                });
                vod.sportsList = vod.sports.join(', ');
              }
              return vod;
            });
          });
        }
      });
  }

  function parseDuration(sec) {
    // Convert miliseconds to seconds
    sec = sec / 1000;
    // Convert to int
    sec = parseInt(sec, 10);
    var duration = [];
    // Hours - Only add if the duration is 1 hour or greater
    // if (sec >= 3600) {
      duration[0] = Math.floor(sec / 3600);
    // }
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

  function renderVods() {
    $.each(vodData, (i, item) => {
      // Build the duration array and remove hours if it is '00'
      var duration = parseDuration(item.duration);
      duration = duration.filter((val, i) => {
        if (i === 0 && val === '00') {
          return;
        }
        return val;
      });
      $('#list-container').append(
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

  $(function() {
    // First, we need to get a list of all sports
    getSports().then(() => {
      // Then we get the VODs
      loadVods().then(() => {
        // Now we build the content element and render it
        renderVods();
      });
    });
  });
})(jQuery, Drupal, drupalSettings);
