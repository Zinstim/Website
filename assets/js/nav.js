/* ZinStim — primary nav behaviour.
   Progressive enhancement: the nav is readable and navigable
   before this file loads. */
(function () {
  var group   = document.querySelector('[data-group]');
  var capsule = document.querySelector('[data-capsule]');
  if (!group || !capsule) return;

  var links  = capsule.querySelectorAll('.rise');
  var label  = capsule.querySelector('[data-label]');
  var origin = document.querySelector('.origin');
  var home   = document.querySelector('.home');
  var timer;

  function open()  { clearTimeout(timer); group.classList.add('is-open'); }
  function close() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      group.classList.remove('is-open');
    }, 200);                        // survives a diagonal cursor exit
  }

  // where: a link element, the string 'origin', or null for home
  function select(where) {
    links.forEach(function (l) { l.classList.remove('is-current'); });
    origin.classList.remove('is-here');
    label.classList.remove('is-here');
    label.textContent = 'Elements';

    if (where === 'origin') {
      origin.classList.add('is-here');
    } else if (where) {
      where.classList.add('is-current');
      label.textContent = where.textContent;
      label.classList.add('is-here');
    }
  }

  capsule.addEventListener('mouseenter', open);
  capsule.addEventListener('mouseleave', close);

  origin.addEventListener('click', function (e) {
    if (origin.getAttribute('href') === '#') e.preventDefault();
    select('origin');
  });
  if (home) home.addEventListener('click', function (e) {
    if (home.getAttribute('href') === '#') e.preventDefault();
    select(null);
  });

  links.forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (link.getAttribute('href') === '#') e.preventDefault();
      select(link);
      group.classList.remove('is-open');
      link.blur();
    });
    link.addEventListener('focus', open);
    link.addEventListener('blur', function () {
      setTimeout(function () {
        if (!capsule.contains(document.activeElement)) close();
      }, 0);
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && group.classList.contains('is-open')) {
      group.classList.remove('is-open');
      if (document.activeElement) document.activeElement.blur();
    }
  });
})();
