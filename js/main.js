'use strict';
(function() {
  var btn = document.querySelector('.nav-hamburger');
  var links = document.querySelector('.nav-links');
  if (!btn || !links) return;
  btn.addEventListener('click', function() {
    btn.classList.toggle('open');
    links.classList.toggle('open');
  });
  links.addEventListener('click', function(e) {
    if (e.target.tagName === 'A') {
      btn.classList.remove('open');
      links.classList.remove('open');
    }
  });
})();
