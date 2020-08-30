$(function () {
  $("#header").html(getHeader());
  $("#footer").html(getFooter());
});

function getHeader() {
  return ` <nav class="navbar navbar-expand-lg navbar-light" style="background-color: #e3f2fd;">
  <img src="images/blue-monkey-logo.svg" width="64px"></img>
  <a class="navbar-brand ml-2" href="index.html"><span class="mb-0 h1">Blue Monkey</span></a>
  
  <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
    <span class="navbar-toggler-icon"></span>
  </button>

  <div class="collapse navbar-collapse" id="navbarSupportedContent">
    <ul class="navbar-nav mr-auto">
      <li class="nav-item active">
        <a class="nav-link" href="index.html">Home<span class="sr-only">(current)</span></a>
      </li>
      <li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          Apps
        </a>
        <div class="dropdown-menu" aria-labelledby="navbarDropdown">
          <a class="dropdown-item" href="reader.html">WaniKani Reader<span class="sr-only">(current)</span></a>
          <a class="dropdown-item" href="verbs.html">WaniKani Verbs<span class="sr-only">(current)</span></a>
        </div>
      </li>
      <li class="nav-item active">
        <a class="nav-link" href="about.html">About<span class="sr-only">(current)</span></a>
      </li>
    </ul>
  </div>
</nav>`;
}

function getFooter() {
  return `<div class="container">
  <span class="text-muted">
      <div>
        WaniKani is Copyright © <a href="https://www.tofugu.com/" target="_blank">Tofugu LLC</a>
        • 
        Icons made by <a href="https://www.flaticon.com/authors/smashicons" title="Smashicons" target="_blank">Smashicons</a> from <a href="https://www.flaticon.com/" title="Flaticon" target="_blank">www.flaticon.com</a>
      </div>
    </span>
</div>`;
}
