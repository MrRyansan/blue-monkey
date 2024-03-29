$(function () {
  let token = getApiToken();

  if (token == null) {
    window.location.href = 'enter-token.html?returnUrl=vocabulary.html';
  }

  $("#spinner").hide();

  populatePage(token);

  $.fn.dataTable.ext.search.push(
    function( settings, data, dataIndex ) {
      let min = parseInt($("#beginLevelTextBox").val(), 10);
      let max = parseInt($("#endLevelTextBox").val(), 10);

      var level = parseFloat( data[0] ) || 0; // use data for the level column

      if ( ( isNaN( min ) && isNaN( max ) ) ||
            ( isNaN( min ) && level <= max ) ||
            ( min <= level   && isNaN( max ) ) ||
            ( min <= level   && level <= max ) )
      {
          return true;
      }
      
      return false;
    }
  );
});

function toggleCheckboxes() {
  if($("input:checkbox").not(':checked').length > 0) {
    $("input:checkbox").prop("checked", true);  
  } else {
    $("input:checkbox").prop("checked", false);
  }
}

function processFilters() {
  let searchItems = [];

  $("input:checked").each(function () {
    var value = $(this).attr("value");
    searchItems.push(value);
  });

  let searchRegex = searchItems.join("|");

  $('#vocabTable').DataTable().column(1).search(searchRegex, true, false).draw();
}

async function populatePage(apiToken) {
  $("#spinner").show();

  let userData = await getUserData(apiToken);
  let maxUserLevel = userData.level;
  let vocabData = await getVocabData(apiToken, maxUserLevel);

  $("#endLevelTextBox").val(maxUserLevel);

  vocabData.sort(compare)

  vocabData.forEach(item => {

  let htmlData = `
                  <tr>
                    <td scope="col">${item.level}</td>
                    <td scope="col">${item.partsOfSpeech.join(',')}</td>
                    <td scope="col">${item.characters}</td>
                    <td scope="col">${item.reading}</td>
                    <td scope="col">${item.meaning}</td>
                    <td scope="col">${getEndColumnHtml(item)}</td>
                  </tr>
                `;
    $("#tableBody").append(htmlData);
  });

  $("#spinner").hide();

  $('#vocabTable').DataTable();
}

function getEndColumnHtml(item) {

  let returnValue= `<a href="https://www.wanikani.com/vocabulary/${item.characters}" target="_blank">WaniKani</a>`;

  const found = item.partsOfSpeech.some(x => (x.indexOf(" verb") > 0));
  
  if (found) {
    returnValue += `<br/><a href="https://cooljugator.com/ja/${item.characters}" target="_blank">Cooljugator</a>`;
  }

  return returnValue;
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

async function getVocabData(apiToken, endLevel) {
  let levelsToInclude = getLevels(endLevel);
  let apiEndpointPath = 'subjects?types=vocabulary&levels=' + levelsToInclude;
  let keepLooping = true;
  let vocabToReturn = [];
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
      var vocab = {};

      let partsOfSpeech = item.data.parts_of_speech;

      vocab.level = item.data.level;
      vocab.meaning = getMeanings(item.data.meanings);
      vocab.reading = item.data.readings[0].reading;
      vocab.characters = item.data.characters;
      vocab.partsOfSpeech = partsOfSpeech;

      vocabToReturn.push(vocab);
    });

    if (response.pages.next_url) {
      url = response.pages.next_url;
    } else {
      keepLooping = false;
    }
  }

  return Promise.resolve(vocabToReturn);
}

function getMeanings (meaningArray) {
  let meanings = meaningArray.map(x => {
    return x.meaning;
  });

  return meanings.join(", ");
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

function download_csv() {
  let csv = "";

  let rows = $('#vocabTable').DataTable().rows({ filter : 'applied'}).data();

  for (let index = 0; index < rows.length; index++) {
    csv += `${rows[index][2]},${rows[index][3]} ${rows[index][4]}`;
    csv += "\n";
  }

  var hiddenElement = document.createElement('a');
  hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
  hiddenElement.target = '_blank';
  hiddenElement.download = 'vocabulary.csv';
  hiddenElement.click();
}