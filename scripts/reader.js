$(function () {
  let token = getApiToken();

  if (token == null) {
    window.location.href = 'enter-token.html?returnUrl=reader.html';
  }

  $("#spinner").hide();

  loadFilterPrefs();
});

async function processFilters() {
  // ===========================
  // input variables
  // ===========================
  let shuffle =  $("#shuffleCheckbox").is(":checked");
  let includeOnlyOneContextSentence =  $("#oneContextSentenceCheckbox").is(":checked");
  let highlightVocab = $("#highlightVocabCheckbox").is(":checked");
  let startLevel = $("#beginLevelTextBox").val();
  let endLevel = $("#endLevelTextBox").val();
  let numberOfSentencesPerParagraph = $("#numOfSentencesPerParagraphTextBox").val();
  let fontSize = $("#fontSizeDropdown").val();
  // ===========================

  $("#spinner").show();
  $("#mainContent").empty();

  let apiToken = getApiToken();
  let userData = await getUserData(apiToken);
  let maxUserLevel = userData.level;
  let vocabularyData = await getVocabularyData(apiToken, maxUserLevel);

  let sentences = getSentences(vocabularyData, includeOnlyOneContextSentence, startLevel, endLevel);

  adjustLevelFiltersIfNeeded(startLevel, endLevel, maxUserLevel);

  displaySentencesOnPage(sentences,
                         shuffle, 
                         highlightVocab, 
                         numberOfSentencesPerParagraph, 
                         fontSize);

  $('.popover-dismiss').popover({
    trigger: 'focus'
  })

  $('[data-toggle="popover"]').popover();

  $("#spinner").hide();

  saveFilterPrefs();
}

function saveFilterPrefs() {
  let shuffle =  $("#shuffleCheckbox").is(":checked");
  let includeOnlyOneContextSentence =  $("#oneContextSentenceCheckbox").is(":checked");
  let highlightVocab = $("#highlightVocabCheckbox").is(":checked");
  let startLevel = $("#beginLevelTextBox").val();
  let endLevel = $("#endLevelTextBox").val();
  let numberOfSentencesPerParagraph = $("#numOfSentencesPerParagraphTextBox").val();
  let fontSize = $("#fontSizeDropdown").val();
  let localStorageKey = "WaniKaniReaderPreferences"

  let prefs = shuffle + ',' + includeOnlyOneContextSentence + ',' + highlightVocab + ',' + startLevel + ',' + endLevel + ',' + numberOfSentencesPerParagraph + ',' + fontSize;

  localStorage.setItem(localStorageKey, prefs);
}

function loadFilterPrefs() {
  let localStorageKey = "WaniKaniReaderPreferences"

  if (!localStorage.getItem(localStorageKey)) return;

  let prefs = localStorage.getItem(localStorageKey);
  let prefsArray = prefs.split(',');

  $("#shuffleCheckbox").prop("checked", prefsArray[0] === 'true');
  $("#oneContextSentenceCheckbox").prop("checked", prefsArray[1] === 'true');
  $("#highlightVocabCheckbox").prop("checked", prefsArray[2] === 'true');
  $("#beginLevelTextBox").val(prefsArray[3]);
  $("#endLevelTextBox").val(prefsArray[4]);
  $("#numOfSentencesPerParagraphTextBox").val(prefsArray[5]);
  $("#fontSizeDropdown").val(prefsArray[6]);
}

function adjustLevelFiltersIfNeeded(startLevel, endLevel, maxLevel) {
  if (startLevel > maxLevel) {
    $("#beginLevelTextBox").val(maxLevel);
  }

  if (endLevel > maxLevel) {
    $("#endLevelTextBox").val(maxLevel);
  }
}

function getApiToken() {
  let localStorageKey = "WaniKaniUserToken";
  return localStorage.getItem(localStorageKey);
}

async function getUserData(apiToken, startPage = 1) {
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

async function getVocabularyData(apiToken, endLevel) {
  let levelsToInclude = getLevels(endLevel);
  let apiEndpointPath = 'subjects?types=vocabulary&levels=' + levelsToInclude;
  let keepLooping = true;
  let vocabItems = [];
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
      var vocabItem = {};

      vocabItem.level = item.data.level;
      vocabItem.characters = item.data.characters;
      vocabItem.context_sentences = item.data.context_sentences;
      vocabItem.meaning = getMeanings(item.data.meanings);
      vocabItem.reading = getReadings(item.data.readings);

      vocabItems.push(vocabItem);
    });

    if (response.pages.next_url) {
      url = response.pages.next_url;
    } else {
      keepLooping = false;
    }
  }

  return Promise.resolve(vocabItems);
}

function getMeanings (meaningArray) {
  let meanings = meaningArray.map(x => {
    return x.meaning;
  });

  return meanings.join(", ");
}

function getReadings (readingArray) {
  let readings = readingArray.map(x => {
    return x.reading;
  });

  return readings.join(" or ");
}

function displaySentencesOnPage(sentences, shouldShuffle, highlightVocab, numberOfSentencesPerParagraph, fontSize){
  let sortedSentences = shouldShuffle ? shuffleArray(sentences) : sentences.sort((a, b) => (a.level > b.level) ? 1 : -1);
  
  let sentencesToIterate = getSentencesForDisplay(sortedSentences, highlightVocab);

  let mainDiv = $("#mainContent");

  let sentenceCounter = numberOfSentencesPerParagraph;
  let sentenceBlock = "";

  sentencesToIterate.forEach(sentence => {
    if (sentenceCounter === 0) {
      mainDiv.append("<p>" + sentenceBlock + "</p>");
      sentenceCounter = numberOfSentencesPerParagraph;
      sentenceBlock = "";
    } else {
      sentenceBlock += sentence;
      sentenceCounter--;
    }
  });

  mainDiv.css("font-size", fontSize);
}

function getSentenceWithVocabHighlighted(vocab){
  let html = `<b>Level:</b> ${vocab.level}<br/>
              <b>English Reading:</b> ${ formatForHtml(vocab.meaning) }<br/>
              <b>Japanese Reading:</b> ${ formatForHtml(vocab.reading) }<br/>
              <b>Sentence Reading:</b> ${ formatForHtml(vocab.englishSentence) }<br/>
              <b>Open In:</b> <a href="https://www.wanikani.com/vocabulary/${ formatForHtml(vocab.vocabWord) }" target="_blank">WaniKani</a>
  `;

  let highlightedText = "<span tabindex='0' data-trigger='focus' class='vocab-word' data-toggle='popover' data-html='true' container='body' data-content='" + html + "'>" + vocab.vocabWord + "</span>";
  let formattedSentence = vocab.japaneseSentence.replace(vocab.vocabWord, highlightedText);

  return formattedSentence;
}

function formatForHtml(str) {
  str = str.replace(/&/g, "&amp;");
  str = str.replace(/>/g, "&gt;");
  str = str.replace(/</g, "&lt;");
  str = str.replace(/"/g, "&quot;");
  str = str.replace(/'/g, "&#039;");
  return str;
}

function getSentences(vocabItems, shouldOnlyIncludeOneSentence, startLevel, endLevel) {
  let sentences = [];

  vocabItems.forEach(vocabItem => {
    let vocabLevel = vocabItem.level;
    if(vocabLevel < startLevel || vocabLevel > endLevel) {
      return;
    }

    let sentenceData = vocabItem.context_sentences;

    for (let i=0; i<sentenceData.length; i++) {
      let level = vocabItem.level;
      let vocabWord = vocabItem.characters;
      let meaning = vocabItem.meaning;
      let reading = vocabItem.reading;
      let japaneseSentence = "";
      let englishSentence = ""

      if (shouldOnlyIncludeOneSentence) {
        let randomIndex = Math.floor(Math.random() * sentenceData.length);
        japaneseSentence = sentenceData[randomIndex].ja;
        englishSentence = sentenceData[randomIndex].en;
      } else {
        japaneseSentence = sentenceData[i].ja;
        englishSentence = sentenceData[i].en;
      }

      sentences.push({ level, vocabWord, meaning, reading, japaneseSentence, englishSentence });

      if (shouldOnlyIncludeOneSentence) {
        break;
      }
    }
  });

  return sentences;
}

function getSentencesForDisplay(sentences, highlightVocab) {
  let formattedSentences = [];
  sentences.forEach(sentence => {
    let formattedSentence = highlightVocab ? getSentenceWithVocabHighlighted(sentence) : sentence.japaneseSentence;
    formattedSentences.push(formattedSentence);
  });

  return formattedSentences;
}

function shuffleArray(array) {
  let shuffledArray = array.slice(0);

  for (var i = shuffledArray.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = shuffledArray[i];
        shuffledArray[i] = shuffledArray[j];
        shuffledArray[j] = temp;
    }

  return shuffledArray;
}

function getLevels(end) {
  var list = [];
  for (var i = 1; i <= end; i++) {
      list.push(i);
  }

  return list.join(",")
}