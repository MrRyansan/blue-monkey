$(function () {
  $('[data-toggle="tooltip"]').tooltip()
})

async function processFilters() {
  // ===========================
  // input variables
  // ===========================
  let shuffle =  document.getElementById("shuffleCheckbox").checked;
  let includeOnlyOneContextSentence =  document.getElementById("oneContextSentenceCheckbox").checked;
  let highlightVocab = document.getElementById("highlightVocabCheckbox").checked;
  let enableContextPopup = true;
  let startLevel = document.getElementById("beginLevelTextBox").value;
  let endLevel = document.getElementById("endLevelTextBox").value;
  let numberOfSentencesPerParagraph = document.getElementById("numOfSentencesPerParagraphTextBox").value;
  let fontSize = document.getElementById("fontSizeDropdown").value;
  
  // let shouldContextSentenceBeRandom = true;
  // ===========================

  let apiToken = getApiToken();
  let userData = await getUserData(apiToken);
  // let maxUserLevel = userData.subscription.max_level_granted;
  let maxUserLevel = userData.level;
  let vocabularyData = await getVocabularyData(apiToken, maxUserLevel);

  let sentences = getSentences(vocabularyData, includeOnlyOneContextSentence, startLevel, endLevel);

  adjustLevelFiltersIfNeeded(startLevel, endLevel, maxUserLevel);

  displaySentencesOnPage(sentences,
                         shuffle, 
                         highlightVocab, 
                         numberOfSentencesPerParagraph, 
                         fontSize);
}

function adjustLevelFiltersIfNeeded(startLevel, endLevel, maxLevel) {
  if (startLevel > maxLevel) {
    document.getElementById("beginLevelTextBox").value = maxLevel;
  }

  if (endLevel > maxLevel) {
    document.getElementById("endLevelTextBox").value = maxLevel;
  }
}

function getApiToken() {
  // TODO: Update this for local storage.
  return 'c2e9ef1e-07aa-4e01-877e-8c349d8364ca';
}

async function getUserData(apiToken, startPage = 1) {
  let localStorageKey = "WaniKaniUserData";
  let requestHeaders =
      new Headers({
        'Wanikani-Revision': '20170710',
        Authorization: 'Bearer ' + apiToken,
      });


  if (!sessionStorage.getItem(localStorageKey)) {
    //TODO: Use paging to get all available data if not all comes back the first time.
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
  document.getElementById("mainContent").innerHTML = ""
  
  let formattedSentences = getSentencesForDisplay(sentences, highlightVocab);
  let sentencesToIterate = shouldShuffle ? shuffleArray(formattedSentences) : formattedSentences;

  let mainDiv = document.getElementById("mainContent");

  let sentenceCounter = numberOfSentencesPerParagraph;
  let sentenceBlock = "";

  sentencesToIterate.forEach(sentence => {
    if (sentenceCounter === 0) {
      let paragraphElement = document.createElement("P");
      paragraphElement.innerHTML = sentenceBlock;
      mainDiv.appendChild(paragraphElement);
      sentenceCounter = numberOfSentencesPerParagraph;
      sentenceBlock = "";
    } else {
      sentenceBlock += sentence;
      sentenceCounter--;
    }
  });

  mainDiv.style.fontSize = fontSize;
}

function getSentenceWithVocabHighlighted(vocab){
  let highlightedText = "<span class='vocab-word' data-toggle='tooltip' title='Level: " + vocab.level + "&#013;English reading: " + vocab.meaning + "&#013;Japanese reading: " + vocab.reading + "&#013;Sentence reading: " + vocab.englishSentence + "' >" + vocab.vocabWord + "</span>";
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