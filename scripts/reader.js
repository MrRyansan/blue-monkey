$(function () {
  let token = getApiToken();

  if (token == null) {
    window.location.href = 'enter-token.html?returnUrl=reader.html';
  }
})

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

  $('[data-toggle="popover"]').popover();
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
  let localStorageKey = "WaniKaniUserData";
  let requestHeaders =
      new Headers({
        'Wanikani-Revision': '20170710',
        Authorization: 'Bearer ' + apiToken,
      });


  if (!sessionStorage.getItem(localStorageKey)) {
    let apiEndpoint =
        new Request('https://api.wanikani.com/v2/user', {
          method: 'GET',
          headers: requestHeaders
        });

    return fetch(apiEndpoint)
      .then(response => response.json())
      .then(responseBody => {
        sessionStorage.setItem(localStorageKey, JSON.stringify(responseBody.data));
        return responseBody.data;
      });
  } else {
    return Promise.resolve(JSON.parse(sessionStorage.getItem(localStorageKey)));
  }
}

async function getVocabularyData(apiToken, endLevel) {
  let localStorageKey = "WaniKaniVocab";

  if (!localStorage.getItem(localStorageKey)) {
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
        vocabItem.meaning = item.data.meanings[0].meaning;
        vocabItem.reading = item.data.readings[0].reading;

        vocabItems.push(vocabItem);
      });

      if (response.pages.next_url) {
        url = response.pages.next_url;
      } else {
        keepLooping = false;
      }
    }

    localStorage.setItem(localStorageKey, JSON.stringify(vocabItems));
    return Promise.resolve(vocabItems);
  } else {
    return Promise.resolve(JSON.parse(localStorage.getItem(localStorageKey)));
  }
}

function displaySentencesOnPage(sentences, shouldShuffle, highlightVocab, numberOfSentencesPerParagraph, fontSize){
  $("#mainContent").empty();
  
  let formattedSentences = getSentencesForDisplay(sentences, highlightVocab);
  let sentencesToIterate = shouldShuffle ? shuffleArray(formattedSentences) : formattedSentences;

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
  let text = "<b>Level:</b> " + vocab.level + "<br/><b>English reading:</b> " + vocab.meaning + "<br/><b>Japanese reading:</b> " + vocab.reading + "<br/><b>Sentence reading:</b> " + vocab.englishSentence;
  text = text.replace("'", "");

  let highlightedText = "<span class='vocab-word' data-toggle='popover' data-html='true' container='body' data-content='" + text + "'>" + vocab.vocabWord + "</span>";
  let formattedSentence = vocab.japaneseSentence.replace(vocab.vocabWord, highlightedText);

  return formattedSentence;
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
      let japaneseSentence = sentenceData[i].ja;
      let englishSentence = sentenceData[i].en;

      sentences.push({ level, vocabWord, meaning, reading, japaneseSentence, englishSentence });

      if (shouldOnlyIncludeOneSentence) break;
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