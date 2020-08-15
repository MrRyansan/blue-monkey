$(function () {
  let token = getApiToken();

  if (token == null) {
    window.location.href = 'enter-token.html?returnUrl=verbs.html';
  }

  populatePage(token);

  $("#spinner").hide();
});

async function populatePage(apiToken) {
  let userData = await getUserData(apiToken);
  let maxUserLevel = userData.level;
  let verbData = await getVerbData(apiToken, maxUserLevel);

  verbData.sort(compare)

  verbData.forEach(item => {

  let htmlData = `
                  <tr>
                    <td scope="col">${item.level}</td>
                    <td scope="col">${item.partsOfSpeech.join(',')}</td>
                    <td scope="col">${item.characters}</td>
                    <td scope="col">${item.reading}</td>
                    <td scope="col">${item.meaning}</td>
                    <td scope="col"><a href="https://cooljugator.com/ja/${item.characters}" target="_blank">Conjugate</a></td>
                  </tr>
                `;
    $("#tableBody").append(htmlData);
  });

  $('#verbTable').DataTable();
}

async function getUserData(apiToken) {
  let sessionStorageKey = "WaniKaniUserData";
  let requestHeaders =
      new Headers({
        'Wanikani-Revision': '20170710',
        Authorization: 'Bearer ' + apiToken,
      });

  if (!sessionStorage.getItem(sessionStorageKey)) {
    let apiEndpoint =
        new Request('https://api.wanikani.com/v2/user', {
          method: 'GET',
          headers: requestHeaders
        });

    return fetch(apiEndpoint)
      .then(response => response.json())
      .then(responseBody => {
        sessionStorage.setItem(sessionStorageKey, JSON.stringify(responseBody.data));
        return responseBody.data;
      });
  } else {
    return Promise.resolve(JSON.parse(sessionStorage.getItem(sessionStorageKey)));
  }
}

function getApiToken() {
  let localStorageKey = "WaniKaniUserToken";
  return localStorage.getItem(localStorageKey);
}

async function getVerbData(apiToken, endLevel) {
  let levelsToInclude = getLevels(endLevel);
  let apiEndpointPath = 'subjects?types=vocabulary&levels=' + levelsToInclude;
  let keepLooping = true;
  let verbsToReturn = [];
  let requestHeaders =
      new Headers({
        'Wanikani-Revision': '20170710',
        Authorization: 'Bearer ' + apiToken,
      });

  let url = "https://api.wanikani.com/v2/" + apiEndpointPath;

  while (keepLooping) {
    let apiEndpoint = new Request( url, {
      method: 'GET',
      headers: requestHeaders
    });

    let response = await fetch(apiEndpoint)
      .then(response => response.json())
      .then(responseBody => {
        return responseBody;
    });

    response.data.forEach(item => {
      var verb = {};

      let partsOfSpeech = item.data.parts_of_speech;

      if (partsOfSpeech.includes("ichidan verb") || partsOfSpeech.includes("godan verb")) {
        verb.level = item.data.level;
        verb.meaning = item.data.meanings[0].meaning;
        verb.reading = item.data.readings[0].reading;
        verb.characters = item.data.characters;
        verb.partsOfSpeech = partsOfSpeech;

        verbsToReturn.push(verb);
      }
    });

    if (response.pages.next_url) {
      url = response.pages.next_url;
    } else {
      keepLooping = false;
    }
  }

  return Promise.resolve(verbsToReturn);
}

function getLevels(end) {
  var list = [];
  for (var i = 1; i <= end; i++) {
      list.push(i);
  }

  return list.join(",")
}

function compare(a, b) {
  // Use toUpperCase() to ignore character casing
  const bandA = a.level;
  const bandB = b.level;

  let comparison = 0;
  if (bandA > bandB) {
    comparison = 1;
  } else if (bandA < bandB) {
    comparison = -1;
  }
  return comparison;
}