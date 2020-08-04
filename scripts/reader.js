function load() {
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

  let levelsToInclude = getLevels(startLevel, endLevel);

  var apiToken = 'c2e9ef1e-07aa-4e01-877e-8c349d8364ca';
  var apiEndpointPath = 'subjects?types=vocabulary&levels=' + levelsToInclude;

  var requestHeaders =
      new Headers({
        'Wanikani-Revision': '20170710',
        Authorization: 'Bearer ' + apiToken,
      });

  var apiEndpoint =
      new Request('https://api.wanikani.com/v2/' + apiEndpointPath, {
        method: 'GET',
        headers: requestHeaders
      });

  fetch(apiEndpoint)
    .then(response => response.json())
    .then(responseBody => displaySentencesOnPage(responseBody.data, shuffle, includeOnlyOneContextSentence, highlightVocab, numberOfSentencesPerParagraph, fontSize));
}

function displaySentencesOnPage(responseJson, shouldShuffle, onlyOneContextSentence, highlightVocab, numberOfSentencesPerParagraph, fontSize){
  document.getElementById("mainContent").innerHTML = ""
  
  let sentences = getSentences(responseJson, onlyOneContextSentence);
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

  //document.getElementById("text").innerHTML = responseJson.data[0].data.context_sentences[1].ja;
  mainDiv.style.fontSize = fontSize;
}

function getSentenceWithVocabHighlighted(vocabWord, sentence){
  let highlightedText = "<span class='vocab-word'>" + vocabWord + "</span>";
  let formattedSentence = sentence.replace(vocabWord, highlightedText);

  return formattedSentence;
}

function getSentences(vocabItems, shouldOnlyIncludeOneSentence) {
  let sentences = [];

  vocabItems.forEach(vocabItem => {
    let sentenceData = vocabItem.data.context_sentences;

    for (let i=0; i<sentenceData.length; i++) {
      let vocabWord = vocabItem.data.characters;
      let japaneseSentence = sentenceData[i].ja;
      let englishSentence = sentenceData[i].en;

      sentences.push({ vocabWord, japaneseSentence, englishSentence });

      if (shouldOnlyIncludeOneSentence) break;
    }
  });

  return sentences;
}

function getSentencesForDisplay(sentences, highlightVocab) {
  let formattedSentences = [];
  sentences.forEach(sentence => {
    let formattedSentence = highlightVocab ? getSentenceWithVocabHighlighted(sentence.vocabWord, sentence.japaneseSentence) : sentence.japaneseSentence;
    formattedSentences.push(formattedSentence);
  });

  return formattedSentences;
}

/* Randomize array in-place using Durstenfeld shuffle algorithm */
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

function getLevels(start, end) {
  var list = [];
  for (var i = start; i <= end; i++) {
      list.push(i);
  }

  return list.join(",")
}