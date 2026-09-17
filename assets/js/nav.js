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

  /* ── phones: the dot opens DOWN ─────────────────────────────
     Below 861px there is no room for the capsule to open sideways,
     and the stacked fallback list took three rows of a sticky header
     and dropped Elements altogether. So on a phone the nav is one
     pill — the page you are on, and the nav's dot — and tapping it
     grows that dot into a sheet holding every page. brand.css
     (§nav — small screens) owns every visual decision; this only
     builds the two elements from the links already in the markup
     and says open or closed. Without this file the plain list of
     links is still there. On desktop both elements are display:none.

     While the sheet is open the masthead carries .is-menu-open, and
     the mark fills with its carbon fibre: on a phone there is no
     hover to reveal it, so opening the nav is what lights the brand. */
  var masthead = group.closest('.masthead');
  if (!masthead || !label) return;

  var pages = [{ text: origin.textContent.trim(), href: origin.getAttribute('href'),
                 here: origin.classList.contains('is-here') }];
  pages.push({ text: 'Elements', href: 'elements.html',
               here: label.classList.contains('is-here') && label.getAttribute('href') === 'elements.html' });
  links.forEach(function (l) {
    pages.push({ text: l.textContent.trim(), href: l.getAttribute('href'),
                 here: l.classList.contains('is-current'), sub: true });
  });
  var current = pages.filter(function (p) { return p.here; })[0];

  var toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'navtoggle t-ui';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'navsheet');
  var toggleText = document.createElement('span');
  toggleText.className = 'navtoggle__label' + (current ? ' is-here' : '');
  toggleText.textContent = current ? current.text : 'Menu';
  var toggleDot = document.createElement('span');
  toggleDot.className = 'navtoggle__dot';
  toggleDot.setAttribute('aria-hidden', 'true');
  toggleDot.appendChild(document.createElement('i'));
  toggleDot.appendChild(document.createElement('i'));
  toggle.appendChild(toggleText);
  toggle.appendChild(toggleDot);
  if (current) toggle.setAttribute('aria-label', 'Menu, on ' + current.text);

  var sheet = document.createElement('div');
  sheet.className = 'navsheet';
  sheet.id = 'navsheet';
  var list = document.createElement('ul');
  list.className = 'navsheet__list';
  pages.forEach(function (p, k) {
    var li = document.createElement('li');
    li.className = 'navsheet__item' + (p.sub ? ' navsheet__item--sub' : '');
    var a = document.createElement('a');
    a.className = 'navsheet__link' + (p.here ? ' is-here' : '');
    a.href = p.href;
    a.textContent = p.text;
    a.style.setProperty('--k', k);
    if (p.here) a.setAttribute('aria-current', 'page');
    li.appendChild(a);
    list.appendChild(li);
  });
  sheet.appendChild(list);

  group.appendChild(sheet);
  group.appendChild(toggle);
  group.classList.add('has-sheet');
  masthead.classList.add('has-navsheet');

  function isOpen() { return toggle.getAttribute('aria-expanded') === 'true'; }
  function setOpen(on, fromKeyboard) {
    toggle.setAttribute('aria-expanded', on ? 'true' : 'false');
    group.classList.toggle('is-sheet-open', on);
    masthead.classList.toggle('is-menu-open', on);
    if (on && fromKeyboard) {
      var first = sheet.querySelector('a');
      if (first) first.focus();
    }
  }

  // a keyboard "click" on a button has detail 0; a tap or a mouse has 1
  toggle.addEventListener('click', function (e) { setOpen(!isOpen(), e.detail === 0); });
  sheet.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('pointerdown', function (e) {
    if (isOpen() && !sheet.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) { setOpen(false); toggle.focus(); }
  });
  var wide = window.matchMedia('(min-width: 861px)');
  var onWide = function (m) { if (m.matches) setOpen(false); };
  if (wide.addEventListener) wide.addEventListener('change', onWide);
  else if (wide.addListener) wide.addListener(onWide);
})();
