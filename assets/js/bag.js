/* bag — what a visitor intends to buy, kept between visits.
   No DOM, no framework: this file is state and nothing else, so the
   pages that read it can be rewritten without touching it.

   It persists to localStorage, which belongs to one browser on one
   device and can come back empty or throw outright — a private
   window, cleared site data, a preview frame. Every read and write
   is wrapped, and the bag works for the length of a visit even when
   storage refuses entirely. */
window.ZSBag = (function(){
  var KEY = 'zs-bag-v1';
  var items = [];

  function load(){
    try {
      var raw = localStorage.getItem(KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      if (Object.prototype.toString.call(parsed) === '[object Array]') items = parsed;
    } catch (e) { items = []; }
  }
  function save(){
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {}
    try {
      window.dispatchEvent(new CustomEvent('zs:bag', { detail: { items: items.slice() } }));
    } catch (e) {}
  }
  load();

  function idOf(code, size){ return code + '/' + size; }
  function find(id){
    for (var i = 0; i < items.length; i++) if (items[i].id === id) return i;
    return -1;
  }

  return {
    /* a piece and a size are one line; adding the same pair twice
       raises the quantity rather than making a second line */
    add: function(code, size, meta){
      var id = idOf(code, size), at = find(id);
      if (at > -1) items[at].qty += 1;
      else items.push({
        id: id, code: code, size: size, qty: 1,
        name: (meta && meta.name) || '',
        img:  (meta && meta.img)  || '',
        price:(meta && typeof meta.price === 'number') ? meta.price : null
      });
      save();
      return this;
    },
    remove: function(id){
      var at = find(id);
      if (at > -1){ items.splice(at, 1); save(); }
      return this;
    },
    setQty: function(id, n){
      var at = find(id);
      if (at < 0) return this;
      n = Math.max(0, Math.round(n));
      if (n === 0) items.splice(at, 1); else items[at].qty = n;
      save();
      return this;
    },
    items: function(){ return items.slice(); },
    count: function(){
      var n = 0;
      for (var i = 0; i < items.length; i++) n += items[i].qty;
      return n;
    },
    /* null when any line has no price yet — a subtotal built from
       half-known numbers is worse than no subtotal */
    subtotal: function(){
      var sum = 0;
      for (var i = 0; i < items.length; i++){
        if (typeof items[i].price !== 'number') return null;
        sum += items[i].price * items[i].qty;
      }
      return sum;
    },
    clear: function(){ items = []; save(); return this; },
    onChange: function(fn){
      window.addEventListener('zs:bag', function(e){ fn(e.detail.items); });
      /* and once now, so a caller never has to render twice */
      fn(items.slice());
      return this;
    }
  };
})();
