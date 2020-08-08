async function verifyToken() {
  let token = $("#tokenTextBox").val();
  let tokenIsValid = await isTokenValid(token);

  if (!tokenIsValid) {
    $("#errorMessageAlert").toggleClass("invisible");
  } else {
    let returnUrl = getParameterByName("returnUrl");
    window.location.href = returnUrl;
  }
}

async function isTokenValid(token) {
  let requestHeaders =
      new Headers({
        'Wanikani-Revision': '20170710',
        Authorization: 'Bearer ' + token,
      });

  let apiEndpoint =
      new Request('https://api.wanikani.com/v2/user', {
        method: 'GET',
        headers: requestHeaders
      });

  return fetch(apiEndpoint)
    .then(response => response.json())
    .then(responseBody => {
      if (responseBody.code) {
        return false;
      }

      storeToken(token);
      return true;
    });
}

function storeToken(token) {
  let localStorageKey = "WaniKaniUserToken";

  localStorage.setItem(localStorageKey, token);
}

function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}