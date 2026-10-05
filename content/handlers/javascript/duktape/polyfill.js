/* Polyfiller for Duktape for NetSurf
 *
 * This JavaScript will be loaded into heaps before the generics
 *
 * We only care for the side-effects of this, be careful.
 */

// Production steps of ECMA-262, Edition 6, 22.1.2.1
if (!Array.from) {
  Array.from = (function () {
    var toStr = Object.prototype.toString;
    var isCallable = function (fn) {
      return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
    };
    var toInteger = function (value) {
      var number = Number(value);
      if (isNaN(number)) { return 0; }
      if (number === 0 || !isFinite(number)) { return number; }
      return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
    };
    var maxSafeInteger = Math.pow(2, 53) - 1;
    var toLength = function (value) {
      var len = toInteger(value);
      return Math.min(Math.max(len, 0), maxSafeInteger);
    };

    // The length property of the from method is 1.
    return function from(arrayLike/*, mapFn, thisArg */) {
      // 1. Let C be the this value.
      var C = this;

      // 2. Let items be ToObject(arrayLike).
      var items = Object(arrayLike);

      // 3. ReturnIfAbrupt(items).
      if (arrayLike == null) {
        throw new TypeError('Array.from requires an array-like object - not null or undefined');
      }

      // 4. If mapfn is undefined, then let mapping be false.
      var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
      var T;
      if (typeof mapFn !== 'undefined') {
        // 5. else
        // 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
        if (!isCallable(mapFn)) {
          throw new TypeError('Array.from: when provided, the second argument must be a function');
        }

        // 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.
        if (arguments.length > 2) {
          T = arguments[2];
        }
      }

      // 10. Let lenValue be Get(items, "length").
      // 11. Let len be ToLength(lenValue).
      var len = toLength(items.length);

      // 13. If IsConstructor(C) is true, then
      // 13. a. Let A be the result of calling the [[Construct]] internal method 
      // of C with an argument list containing the single item len.
      // 14. a. Else, Let A be ArrayCreate(len).
      var A = isCallable(C) ? Object(new C(len)) : new Array(len);

      // 16. Let k be 0.
      var k = 0;
      // 17. Repeat, while k < len… (also steps a - h)
      var kValue;
      while (k < len) {
        kValue = items[k];
        if (mapFn) {
          A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
        } else {
          A[k] = kValue;
        }
        k += 1;
      }
      // 18. Let putStatus be Put(A, "length", len, true).
      A.length = len;
      // 20. Return A.
      return A;
    };
  }());
}

// DOMTokenList formatter, in theory we can remove this if we do the stringifier IDL support

DOMTokenList.prototype.toString = function () {
  if (this.length == 0) {
    return "";
  }

  var ret = this.item(0);
  for (var index = 1; index < this.length; index++) {
    ret = ret + " " + this.item(index);
  }

  return ret;
}

// Inherit the same toString for settable lists
DOMSettableTokenList.prototype.toString = DOMTokenList.prototype.toString;

(function () {
    'use strict';
    if (typeof document === 'undefined' || document === null) {
        return;
    }
    var doc = document;

    function trim(s) {
        return String(s).replace(/^\s+|\s+$/g, '');
    }

    function climb(obj, prop) {
        var p = (obj === null || obj === undefined) ? null : Object.getPrototypeOf(obj);
        while (p !== null && p !== undefined) {
            if (Object.prototype.hasOwnProperty.call(p, prop)) {
                return p;
            }
            p = Object.getPrototypeOf(p);
        }
        return null;
    }

    var probe = null;
    try {
        probe = doc.createElement('div');
    } catch (e) {
        probe = null;
    }
    if (probe === null) {
        return;
    }

    var elementProto = climb(probe, 'getAttribute');
    var docProto = climb(doc, 'createElement');
    if (elementProto === null || docProto === null) {
        return;
    }
    var nodeProto = climb(probe, 'appendChild');

    function defineGetter(obj, name, fn) {
        Object.defineProperty(obj, name, { get: fn, configurable: true });
    }

    function defineValue(obj, name, fn) {
        Object.defineProperty(obj, name, { value: fn, writable: true, configurable: true });
    }

    function parentElem(el) {
        return el.parentElement || null;
    }

    function prevElem(el) {
        return el.previousElementSibling || null;
    }

    function nextElem(el) {
        return el.nextElementSibling || null;
    }

    function hasClass(el, name) {
        var cls = el.className;
        if (cls === null || cls === undefined) {
            return false;
        }
        return (' ' + String(cls) + ' ').indexOf(' ' + name + ' ') >= 0;
    }

    function readName(s, i) {
        var start = i;
        while (i < s.length && /[A-Za-z0-9_-]/.test(s.charAt(i))) {
            i++;
        }
        return { name: s.slice(start, i), pos: i };
    }

    function unquote(v) {
        v = trim(v);
        if (v.length >= 2) {
            var a = v.charAt(0);
            var b = v.charAt(v.length - 1);
            if ((a === '"' && b === '"') || (a === "'" && b === "'")) {
                return v.slice(1, -1);
            }
        }
        return v;
    }

    function matchAttr(el, inner) {
        var m = inner.match(/^\s*([^\s~^$*|=!]+)\s*(?:([~^$*|]?=)\s*(.*?)\s*)?$/);
        if (m === null) {
            return false;
        }
        var name = m[1];
        if (m[2] === undefined) {
            return el.hasAttribute(name);
        }
        var want = unquote(m[3]);
        var have = el.getAttribute(name);
        if (have === null || have === undefined) {
            return false;
        }
        have = String(have);
        var op = m[2].charAt(0) === '=' ? '=' : m[2].charAt(0);
        if (op === '=') {
            return have === want;
        }
        if (op === '~') {
            return (' ' + have + ' ').indexOf(' ' + want + ' ') >= 0;
        }
        if (op === '^') {
            return want !== '' && have.indexOf(want) === 0;
        }
        if (op === '$') {
            return want !== '' && have.slice(-want.length) === want;
        }
        if (op === '*') {
            return want !== '' && have.indexOf(want) >= 0;
        }
        if (op === '|') {
            return have === want || have.indexOf(want + '-') === 0;
        }
        return false;
    }

    function nthMatch(el, arg) {
        var p = parentElem(el);
        if (p === null) {
            return false;
        }
        var idx = 1;
        var c = prevElem(el);
        while (c !== null) {
            idx++;
            c = prevElem(c);
        }
        var a = (arg === undefined || arg === null) ? 'n' : trim(String(arg)).toLowerCase();
        if (a === 'odd') {
            a = '2n+1';
        }
        if (a === 'even') {
            a = '2n';
        }
        if (a === 'n') {
            return true;
        }
        var m = a.match(/^([+-]?\d*)n([+-]\d+)?$/);
        if (m !== null) {
            var as = m[1];
            var bs = (m[2] === undefined) ? '0' : m[2];
            var av = (as === '' || as === '+') ? 1 : (as === '-' ? -1 : parseInt(as, 10));
            var bv = parseInt(bs, 10);
            var d = idx - bv;
            if (av === 0) {
                return d === 0;
            }
            return d % av === 0 && d / av >= 0;
        }
        var n = parseInt(a, 10);
        return !isNaN(n) && idx === n;
    }

    function matchPseudo(el, name, arg) {
        if (name === 'first-child') {
            return prevElem(el) === null;
        }
        if (name === 'last-child') {
            return nextElem(el) === null;
        }
        if (name === 'only-child') {
            return prevElem(el) === null && nextElem(el) === null;
        }
        if (name === 'nth-child') {
            return nthMatch(el, arg);
        }
        if (name === 'empty') {
            return el.firstChild === null;
        }
        if (name === 'not') {
            return !matchCompound(el, trim(arg === null || arg === undefined ? '' : arg));
        }
        return false;
    }

    function matchCompound(el, compound) {
        var s = compound;
        var i = 0;
        while (i < s.length) {
            var ch = s.charAt(i);
            if (ch === '*') {
                i++;
                continue;
            }
            if (ch === '#') {
                var idv = readName(s, i + 1);
                if (String(el.id || '') !== idv.name) {
                    return false;
                }
                i = idv.pos;
                continue;
            }
            if (ch === '.') {
                var cv = readName(s, i + 1);
                if (cv.name === '' || !hasClass(el, cv.name)) {
                    return false;
                }
                i = cv.pos;
                continue;
            }
            if (ch === '[') {
                var close = s.indexOf(']', i);
                if (close < 0) {
                    return false;
                }
                if (!matchAttr(el, s.slice(i + 1, close))) {
                    return false;
                }
                i = close + 1;
                continue;
            }
            if (ch === ':') {
                var pn = readName(s, i + 1);
                if (pn.name === '') {
                    return false;
                }
                var arg = null;
                var np = pn.pos;
                if (s.charAt(np) === '(') {
                    var depth = 1;
                    var j = np + 1;
                    var startq = null;
                    while (j < s.length && depth > 0) {
                        var cj = s.charAt(j);
                        if (startq !== null) {
                            if (cj === startq) {
                                startq = null;
                            }
                        } else if (cj === '"' || cj === "'") {
                            startq = cj;
                        } else if (cj === '(') {
                            depth++;
                        } else if (cj === ')') {
                            depth--;
                        }
                        j++;
                    }
                    arg = s.slice(np + 1, j - 1);
                    np = j;
                }
                i = np;
                if (!matchPseudo(el, pn.name, arg)) {
                    return false;
                }
                continue;
            }
            var tv = readName(s, i);
            if (tv.name === '') {
                return false;
            }
            if (String(el.nodeName || '').toUpperCase() !== tv.name.toUpperCase()) {
                return false;
            }
            i = tv.pos;
        }
        return true;
    }

    function parseGroup(sel) {
        var seq = [];
        var buf = '';
        var comb = ' ';
        var depth = 0;
        var q = null;
        function flush(nc) {
            var t = trim(buf);
            if (t !== '') {
                seq.push({ comb: comb, text: t });
                buf = '';
                comb = nc;
                return;
            }
            buf = '';
            if (nc !== ' ') {
                comb = nc;
            }
        }
        for (var i = 0; i < sel.length; i++) {
            var ch = sel.charAt(i);
            if (q !== null) {
                buf += ch;
                if (ch === q) {
                    q = null;
                }
                continue;
            }
            if (ch === '"' || ch === "'") {
                q = ch;
                buf += ch;
                continue;
            }
            if (ch === '[') {
                depth++;
                buf += ch;
                continue;
            }
            if (ch === ']') {
                depth = depth > 0 ? depth - 1 : 0;
                buf += ch;
                continue;
            }
            if (depth === 0 && (ch === '>' || ch === '+' || ch === '~')) {
                flush(ch);
                continue;
            }
            if (depth === 0 && /\s/.test(ch)) {
                flush(' ');
                continue;
            }
            buf += ch;
        }
        flush(' ');
        return seq;
    }

    var selectorCache = {};

    function parseSelector(sel) {
        var key = String(sel);
        if (selectorCache[key] !== undefined) {
            return selectorCache[key];
        }
        var groups = [];
        var cur = '';
        var depth = 0;
        var q = null;
        var s = key;
        for (var i = 0; i < s.length; i++) {
            var ch = s.charAt(i);
            if (q !== null) {
                cur += ch;
                if (ch === q) {
                    q = null;
                }
                continue;
            }
            if (ch === '"' || ch === "'") {
                q = ch;
                cur += ch;
                continue;
            }
            if (ch === '[') {
                depth++;
                cur += ch;
                continue;
            }
            if (ch === ']') {
                depth = depth > 0 ? depth - 1 : 0;
                cur += ch;
                continue;
            }
            if (ch === ',' && depth === 0) {
                groups.push(cur);
                cur = '';
                continue;
            }
            cur += ch;
        }
        groups.push(cur);
        var out = [];
        for (var g = 0; g < groups.length; g++) {
            var t = trim(groups[g]);
            if (t !== '') {
                out.push(parseGroup(t));
            }
        }
        selectorCache[key] = out;
        return out;
    }

    function matchComplex(el, seq) {
        if (el.nodeType !== 1) {
            return false;
        }
        if (!matchCompound(el, seq[seq.length - 1].text)) {
            return false;
        }
        return matchLeft(el, seq, seq.length - 2);
    }

    function matchLeft(el, seq, i) {
        if (i < 0) {
            return true;
        }
        var comb = seq[i + 1].comb;
        var want = seq[i].text;
        var p;
        var s;
        if (comb === '>') {
            p = parentElem(el);
            return (p !== null && matchCompound(p, want)) ? matchLeft(p, seq, i - 1) : false;
        }
        if (comb === '+') {
            s = prevElem(el);
            return (s !== null && matchCompound(s, want)) ? matchLeft(s, seq, i - 1) : false;
        }
        if (comb === '~') {
            s = prevElem(el);
            while (s !== null) {
                if (matchCompound(s, want) && matchLeft(s, seq, i - 1)) {
                    return true;
                }
                s = prevElem(s);
            }
            return false;
        }
        p = parentElem(el);
        while (p !== null) {
            if (p.nodeType === 1 && matchCompound(p, want) && matchLeft(p, seq, i - 1)) {
                return true;
            }
            p = parentElem(p);
        }
        return false;
    }

    function matchesGroups(el, groups) {
        for (var i = 0; i < groups.length; i++) {
            if (matchComplex(el, groups[i])) {
                return true;
            }
        }
        return false;
    }

    function queryAll(root, groups, firstOnly) {
        var out = [];
        function walk(node) {
            var child = node.firstChild;
            while (child !== null && child !== undefined) {
                if (child.nodeType === 1) {
                    if (matchesGroups(child, groups)) {
                        out.push(child);
                        if (firstOnly) {
                            return true;
                        }
                    }
                    if (walk(child) === true) {
                        return true;
                    }
                }
                child = child.nextSibling;
            }
            return false;
        }
        walk(root);
        return out;
    }

    function toList(arr) {
        arr.item = function (i) {
            return (i >= 0 && i < arr.length) ? arr[i] : null;
        };
        return arr;
    }

    function classTokens(names) {
        var raw = String(names === undefined || names === null ? '' : names).split(/\s+/);
        var out = [];
        for (var i = 0; i < raw.length; i++) {
            if (raw[i] !== '') {
                out.push(raw[i]);
            }
        }
        return out;
    }

    function collectClass(root, names) {
        var out = [];
        function walk(node) {
            var child = node.firstChild;
            while (child !== null && child !== undefined) {
                if (child.nodeType === 1) {
                    var ok = true;
                    for (var i = 0; i < names.length; i++) {
                        if (!hasClass(child, names[i])) {
                            ok = false;
                            break;
                        }
                    }
                    if (ok) {
                        out.push(child);
                    }
                    walk(child);
                }
                child = child.nextSibling;
            }
        }
        walk(root);
        return out;
    }

    function itemOf(coll, i) {
        if (coll === null || coll === undefined) {
            return null;
        }
        if (typeof coll.item === 'function') {
            return coll.item(i);
        }
        return coll[i] !== undefined ? coll[i] : null;
    }

    if (docProto.querySelector === undefined) {
        defineValue(docProto, 'querySelector', function (sel) {
            var root = this.documentElement;
            if (root === null || root === undefined) {
                return null;
            }
            var r = queryAll(root, parseSelector(sel), true);
            return r.length > 0 ? r[0] : null;
        });
    }
    if (docProto.querySelectorAll === undefined) {
        defineValue(docProto, 'querySelectorAll', function (sel) {
            var root = this.documentElement;
            if (root === null || root === undefined) {
                return toList([]);
            }
            return toList(queryAll(root, parseSelector(sel), false));
        });
    }
    if (docProto.getElementsByClassName === undefined) {
        defineValue(docProto, 'getElementsByClassName', function (names) {
            var root = this.documentElement;
            if (root === null || root === undefined) {
                return toList([]);
            }
            return toList(collectClass(root, classTokens(names)));
        });
    }
    if (elementProto.querySelector === undefined) {
        defineValue(elementProto, 'querySelector', function (sel) {
            var r = queryAll(this, parseSelector(sel), true);
            return r.length > 0 ? r[0] : null;
        });
    }
    if (elementProto.querySelectorAll === undefined) {
        defineValue(elementProto, 'querySelectorAll', function (sel) {
            return toList(queryAll(this, parseSelector(sel), false));
        });
    }
    if (elementProto.getElementsByClassName === undefined) {
        defineValue(elementProto, 'getElementsByClassName', function (names) {
            return toList(collectClass(this, classTokens(names)));
        });
    }
    if (elementProto.matches === undefined) {
        defineValue(elementProto, 'matches', function (sel) {
            return matchesGroups(this, parseSelector(sel));
        });
    }
    if (elementProto.msMatchesSelector === undefined) {
        defineValue(elementProto, 'msMatchesSelector', elementProto.matches);
    }
    if (elementProto.closest === undefined) {
        defineValue(elementProto, 'closest', function (sel) {
            var groups = parseSelector(sel);
            var el = this;
            while (el !== null && el !== undefined) {
                if (el.nodeType === 1 && matchesGroups(el, groups)) {
                    return el;
                }
                el = parentElem(el);
            }
            return null;
        });
    }
    if (elementProto.children === undefined) {
        defineGetter(elementProto, 'children', function () {
            var out = [];
            var c = this.firstElementChild;
            while (c !== null && c !== undefined) {
                out.push(c);
                c = c.nextElementSibling;
            }
            return toList(out);
        });
    }
    if (elementProto.tagName === undefined) {
        defineGetter(elementProto, 'tagName', function () {
            return this.nodeName;
        });
    }
    if (elementProto.scrollIntoView === undefined) {
        defineValue(elementProto, 'scrollIntoView', function () {
        });
    }

    function camelToKebab(k) {
        return String(k).replace(/[A-Z]/g, function (c) {
            return '-' + c.toLowerCase();
        });
    }

    function parseStyle(s) {
        var o = {};
        var parts = String(s === null || s === undefined ? '' : s).split(';');
        for (var i = 0; i < parts.length; i++) {
            var idx = parts[i].indexOf(':');
            if (idx > 0) {
                var k = trim(parts[i].slice(0, idx)).toLowerCase();
                var v = trim(parts[i].slice(idx + 1));
                if (k !== '') {
                    o[k] = v;
                }
            }
        }
        return o;
    }

    function serializeStyle(o) {
        var out = [];
        for (var k in o) {
            if (Object.prototype.hasOwnProperty.call(o, k) && o[k] !== '' && o[k] !== null && o[k] !== undefined) {
                out.push(k + ': ' + o[k]);
            }
        }
        return out.length > 0 ? out.join('; ') + ';' : '';
    }

    if (elementProto.style === undefined) {
        Object.defineProperty(elementProto, 'style', {
            get: function () {
                var el = this;
                var snapshot = parseStyle(el.getAttribute('style'));
                return new Proxy(snapshot, {
                    get: function (t, k) {
                        if (k === 'cssText') {
                            return serializeStyle(t);
                        }
                        if (k === 'getPropertyValue') {
                            return function (p) {
                                var v = t[camelToKebab(p)];
                                return v === undefined ? '' : v;
                            };
                        }
                        if (k === 'setProperty') {
                            return function (p, v) {
                                t[camelToKebab(p)] = v === null || v === undefined ? '' : String(v);
                                el.setAttribute('style', serializeStyle(t));
                            };
                        }
                        if (k === 'removeProperty') {
                            return function (p) {
                                delete t[camelToKebab(p)];
                                el.setAttribute('style', serializeStyle(t));
                            };
                        }
                        if (k === 'item') {
                            return function () {
                                return '';
                            };
                        }
                        var kk = camelToKebab(k);
                        if (Object.prototype.hasOwnProperty.call(t, kk)) {
                            return t[kk];
                        }
                        if (Object.prototype.hasOwnProperty.call(t, k)) {
                            return t[k];
                        }
                        return '';
                    },
                    set: function (t, k, v) {
                        if (k === 'cssText') {
                            var np = parseStyle(v);
                            for (var dk in t) {
                                if (Object.prototype.hasOwnProperty.call(t, dk)) {
                                    delete t[dk];
                                }
                            }
                            for (var nk in np) {
                                if (Object.prototype.hasOwnProperty.call(np, nk)) {
                                    t[nk] = np[nk];
                                }
                            }
                        } else {
                            t[camelToKebab(k)] = v === null || v === undefined ? '' : String(v);
                        }
                        el.setAttribute('style', serializeStyle(t));
                        return true;
                    }
                });
            },
            set: function (v) {
                this.setAttribute('style', v === null || v === undefined ? '' : String(v));
            },
            configurable: true
        });
    }

    if (elementProto.dataset === undefined) {
        Object.defineProperty(elementProto, 'dataset', {
            get: function () {
                var el = this;
                return new Proxy({}, {
                    get: function (t, k) {
                        var v = el.getAttribute('data-' + camelToKebab(k));
                        return v === null || v === undefined ? undefined : v;
                    },
                    set: function (t, k, v) {
                        el.setAttribute('data-' + camelToKebab(k), String(v));
                        return true;
                    },
                    has: function (t, k) {
                        return el.hasAttribute('data-' + camelToKebab(k));
                    }
                });
            },
            configurable: true
        });
    }

    if (elementProto.innerText === undefined) {
        Object.defineProperty(elementProto, 'innerText', {
            get: function () {
                return this.textContent;
            },
            set: function (v) {
                this.textContent = v;
            },
            configurable: true
        });
    }

    function migrateNodes(src, dst, before) {
        var c = src.firstChild;
        while (c !== null && c !== undefined) {
            var nx = c.nextSibling;
            src.removeChild(c);
            if (before !== null && before !== undefined) {
                dst.insertBefore(c, before);
            } else {
                dst.appendChild(c);
            }
            c = nx;
        }
    }

    if (elementProto.insertAdjacentHTML === undefined) {
        defineValue(elementProto, 'insertAdjacentHTML', function (pos, html) {
            var p = String(pos === undefined || pos === null ? 'beforeend' : pos).toLowerCase();
            var cont = (this.ownerDocument || doc).createElement('div');
            cont.innerHTML = html === null || html === undefined ? '' : String(html);
            if (p === 'beforeend') {
                migrateNodes(cont, this, null);
            } else if (p === 'afterbegin') {
                migrateNodes(cont, this, this.firstChild);
            } else if (p === 'beforebegin' || p === 'afterend') {
                var par = this.parentElement || this.parentNode;
                if (par !== null && par !== undefined) {
                    if (p === 'beforebegin') {
                        migrateNodes(cont, par, this);
                    } else {
                        migrateNodes(cont, par, this.nextSibling);
                    }
                }
            }
        });
    }

    if (nodeProto !== null) {
        if (nodeProto.remove === undefined) {
            defineValue(nodeProto, 'remove', function () {
                var p = this.parentElement || this.parentNode;
                if (p !== null && p !== undefined) {
                    p.removeChild(this);
                }
            });
        }
        if (nodeProto.append === undefined) {
            defineValue(nodeProto, 'append', function () {
                for (var i = 0; i < arguments.length; i++) {
                    var a = arguments[i];
                    this.appendChild(typeof a === 'string' ? (this.ownerDocument || doc).createTextNode(a) : a);
                }
            });
        }
        if (nodeProto.prepend === undefined) {
            defineValue(nodeProto, 'prepend', function () {
                for (var i = arguments.length - 1; i >= 0; i--) {
                    var a = arguments[i];
                    this.insertBefore(typeof a === 'string' ? (this.ownerDocument || doc).createTextNode(a) : a, this.firstChild);
                }
            });
        }
        if (nodeProto.replaceWith === undefined) {
            defineValue(nodeProto, 'replaceWith', function () {
                var p = this.parentElement || this.parentNode;
                if (p === null || p === undefined) {
                    return;
                }
                for (var i = 0; i < arguments.length; i++) {
                    var a = arguments[i];
                    p.insertBefore(typeof a === 'string' ? (this.ownerDocument || doc).createTextNode(a) : a, this);
                }
                p.removeChild(this);
            });
        }
        if (nodeProto.before === undefined) {
            defineValue(nodeProto, 'before', function () {
                var p = this.parentElement || this.parentNode;
                if (p === null || p === undefined) {
                    return;
                }
                for (var i = 0; i < arguments.length; i++) {
                    var a = arguments[i];
                    p.insertBefore(typeof a === 'string' ? (this.ownerDocument || doc).createTextNode(a) : a, this);
                }
            });
        }
        if (nodeProto.after === undefined) {
            defineValue(nodeProto, 'after', function () {
                var p = this.parentElement || this.parentNode;
                if (p === null || p === undefined) {
                    return;
                }
                for (var i = arguments.length - 1; i >= 0; i--) {
                    var a = arguments[i];
                    p.insertBefore(typeof a === 'string' ? (this.ownerDocument || doc).createTextNode(a) : a, this.nextSibling);
                }
            });
        }
    }

    if (docProto.title === undefined) {
        Object.defineProperty(docProto, 'title', {
            get: function () {
                var t = itemOf(this.getElementsByTagName('title'), 0);
                return t === null ? '' : String(t.textContent || '');
            },
            set: function (v) {
                var t = itemOf(this.getElementsByTagName('title'), 0);
                if (t === null) {
                    var h = itemOf(this.getElementsByTagName('head'), 0);
                    if (h === null) {
                        return;
                    }
                    t = this.createElement('title');
                    h.appendChild(t);
                }
                t.textContent = String(v === null || v === undefined ? '' : v);
            },
            configurable: true
        });
    }
    if (docProto.readyState === undefined) {
        defineGetter(docProto, 'readyState', function () {
            return 'complete';
        });
    }

    if (typeof window !== 'undefined' && window !== null) {
        if (typeof window.getComputedStyle !== 'function') {
            window.getComputedStyle = function (el) {
                if (el === null || el === undefined) {
                    return null;
                }
                var st = el.style;
                if (st === null || st === undefined) {
                    st = {};
                }
                return st;
            };
        }
        if (typeof window.matchMedia !== 'function') {
            window.matchMedia = function (q) {
                return {
                    media: String(q === undefined || q === null ? '' : q),
                    matches: false,
                    addListener: function () {
                    },
                    removeListener: function () {
                    },
                    addEventListener: function () {
                    },
                    removeEventListener: function () {
                    },
                    dispatchEvent: function () {
                        return false;
                    }
                };
            };
        }
        if (typeof window.requestAnimationFrame !== 'function') {
            window.requestAnimationFrame = function (cb) {
                return window.setTimeout(function () {
                    cb(new Date().getTime());
                }, 16);
            };
        }
        if (typeof window.cancelAnimationFrame !== 'function') {
            window.cancelAnimationFrame = function (h) {
                window.clearTimeout(h);
            };
        }
        if (typeof window.scrollTo !== 'function') {
            window.scrollTo = function () {
            };
        }
        if (typeof window.scrollBy !== 'function') {
            window.scrollBy = function () {
            };
        }
        if (typeof window.scroll !== 'function') {
            window.scroll = function () {
            };
        }
        if (typeof window.focus !== 'function') {
            window.focus = function () {
            };
        }
        if (typeof window.blur !== 'function') {
            window.blur = function () {
            };
        }
    }
})();

/* Network layer: Promise, fetch, Response, Headers over native XMLHttpRequest */
(function () {
    'use strict';
    var w = typeof window === 'object' ? window : this;
    if (typeof w.Promise === 'function') {
        return;
    }
    var PENDING = 0, FULFILLED = 1, REJECTED = 2;
    var micro = [];
    var scheduled = false;

    function isThenable(v) {
        return v !== null && (typeof v === 'object' || typeof v === 'function') &&
            typeof v.then === 'function';
    }
    function ensureScheduled() {
        if (scheduled) {
            return;
        }
        scheduled = true;
        w.setTimeout(drain, 0);
    }
    function settle(p, s, v) {
        if (p.__s !== PENDING) {
            return;
        }
        p.__s = s;
        p.__v = v;
        var hs = p.__h;
        p.__h = null;
        for (var i = 0; i < hs.length; i++) {
            micro.push({ p: p, h: hs[i] });
        }
        ensureScheduled();
    }
    function resolveOne(p, v) {
        if (v === p) {
            settle(p, REJECTED, new TypeError('Chaining cycle detected'));
            return;
        }
        if (isThenable(v)) {
            try {
                v.then(function (vv) {
                    resolveOne(p, vv);
                }, function (rr) {
                    settle(p, REJECTED, rr);
                });
            } catch (e) {
                settle(p, REJECTED, e);
            }
            return;
        }
        settle(p, FULFILLED, v);
    }
    function runJob(job) {
        var p = job.p;
        var h = job.h;
        var s = p.__s;
        var v = p.__v;
        var cb = (s === FULFILLED) ? h.onF : h.onR;
        if (cb === null) {
            if (s === FULFILLED) {
                settle(h.child, FULFILLED, v);
            } else {
                settle(h.child, REJECTED, v);
            }
            return;
        }
        var out;
        try {
            out = cb(v);
        } catch (e) {
            settle(h.child, REJECTED, e);
            return;
        }
        resolveOne(h.child, out);
    }
    function drain() {
        scheduled = false;
        var batch = micro;
        micro = [];
        while (batch.length > 0) {
            runJob(batch.shift());
        }
    }
    function Promise(executor) {
        if (!(this instanceof Promise)) {
            throw new TypeError('Promise must be constructed with new');
        }
        if (typeof executor !== 'function') {
            throw new TypeError('Promise resolver is not a function');
        }
        this.__s = PENDING;
        this.__v = undefined;
        this.__h = [];
        var self = this;
        function res(v) {
            resolveOne(self, v);
        }
        function rej(r) {
            settle(self, REJECTED, r);
        }
        try {
            executor(res, rej);
        } catch (e) {
            settle(self, REJECTED, e);
        }
    }
    Promise.prototype.then = function (onF, onR) {
        var child = new Promise(function () {
        });
        var h = {
            onF: typeof onF === 'function' ? onF : null,
            onR: typeof onR === 'function' ? onR : null,
            child: child
        };
        if (this.__s === PENDING) {
            this.__h.push(h);
        } else {
            micro.push({ p: this, h: h });
            ensureScheduled();
        }
        return child;
    };
    Promise.prototype.catch = function (onR) {
        return this.then(null, onR);
    };
    Promise.prototype.finally = function (cb) {
        var fn = typeof cb === 'function' ? cb : null;
        return this.then(function (v) {
            if (fn) {
                fn();
            }
            return v;
        }, function (e) {
            if (fn) {
                fn();
            }
            throw e;
        });
    };
    Promise.resolve = function (v) {
        if (v instanceof Promise) {
            return v;
        }
        return new Promise(function (res) {
            res(v);
        });
    };
    Promise.reject = function (r) {
        return new Promise(function (res, rej) {
            rej(r);
        });
    };
    Promise.all = function (list) {
        return new Promise(function (resolve, reject) {
            var n = list.length;
            var out = new Array(n);
            var left = n;
            if (n === 0) {
                resolve(out);
                return;
            }
            for (var i = 0; i < n; i++) {
                (function (i) {
                    Promise.resolve(list[i]).then(function (v) {
                        out[i] = v;
                        left--;
                        if (left === 0) {
                            resolve(out);
                        }
                    }, reject);
                })(i);
            }
        });
    };
    Promise.race = function (list) {
        return new Promise(function (resolve, reject) {
            for (var i = 0; i < list.length; i++) {
                Promise.resolve(list[i]).then(resolve, reject);
            }
        });
    };
    w.Promise = Promise;
    w.__drainTasks = drain;

    function Headers(init) {
        this.__h = {};
        if (init) {
            if (typeof init === 'object') {
                for (var k in init) {
                    if (Object.prototype.hasOwnProperty.call(init, k)) {
                        this.set(k, init[k]);
                    }
                }
            }
        }
    }
    Headers.prototype.set = function (k, v) {
        this.__h[String(k).toLowerCase()] = String(v);
    };
    Headers.prototype.get = function (k) {
        var x = this.__h[String(k).toLowerCase()];
        return x === undefined ? null : x;
    };
    Headers.prototype.has = function (k) {
        return Object.prototype.hasOwnProperty.call(this.__h, String(k).toLowerCase());
    };
    Headers.prototype.forEach = function (cb, thisArg) {
        for (var k in this.__h) {
            if (Object.prototype.hasOwnProperty.call(this.__h, k)) {
                cb.call(thisArg, this.__h[k], k, this);
            }
        }
    };
    w.Headers = Headers;

    function Response(xhr) {
        this.status = xhr.status;
        this.statusText = xhr.statusText;
        this.ok = xhr.status >= 200 && xhr.status < 300;
        this.url = xhr.responseURL;
        this.type = 'basic';
        this.bodyUsed = false;
        this.headers = new Headers();
        var raw = xhr.getAllResponseHeaders() || '';
        var lines = raw.split('\r\n');
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var c = line.indexOf(':');
            if (c > 0) {
                var k = line.substring(0, c).toLowerCase();
                var v = line.substring(c + 1);
                this.headers.set(k.trim(), v.trim());
            }
        }
        this.__text = xhr.responseText;
    }
    Response.prototype.text = function () {
        this.bodyUsed = true;
        return Promise.resolve(this.__text);
    };
    Response.prototype.json = function () {
        var t = this.__text;
        this.bodyUsed = true;
        return new Promise(function (resolve, reject) {
            var v = JSON.parse(t);
            resolve(v);
        });
    };
    Response.prototype.arrayBuffer = function () {
        this.bodyUsed = true;
        var s = this.__text;
        var n = s.length;
        var u = new Uint8Array(n);
        for (var i = 0; i < n; i++) {
            u[i] = s.charCodeAt(i) & 0xff;
        }
        return Promise.resolve(u.buffer);
    };
    w.Response = Response;

    function fetch(input, init) {
        var url;
        var opts = init || {};
        if (input && typeof input === 'object' && typeof input.url === 'string') {
            url = input.url;
            if (!init) {
                opts = { method: input.method, headers: input.headers, body: input.body };
            }
        } else {
            url = String(input);
        }
        var method = String(opts.method || 'GET').toUpperCase();
        var hdict = {};
        if (opts.headers) {
            if (opts.headers instanceof Headers) {
                opts.headers.forEach(function (v, k) {
                    hdict[k] = v;
                });
            } else if (typeof opts.headers === 'object') {
                for (var k in opts.headers) {
                    if (Object.prototype.hasOwnProperty.call(opts.headers, k)) {
                        hdict[String(k).toLowerCase()] = String(opts.headers[k]);
                    }
                }
            }
        }
        var body = opts.body;
        if (body !== undefined && body !== null && typeof body !== 'string') {
            body = String(body);
        }
        return new Promise(function (resolve, reject) {
            var x = new XMLHttpRequest();
            try {
                x.open(method, url, true);
            } catch (e) {
                reject(e);
                return;
            }
            for (var hk in hdict) {
                if (Object.prototype.hasOwnProperty.call(hdict, hk)) {
                    try {
                        x.setRequestHeader(hk, hdict[hk]);
                    } catch (e2) {}
                }
            }
            x.onreadystatechange = function () {
                if (x.readyState !== 4) {
                    return;
                }
                if (x.status === 0) {
                    reject(new TypeError('Network request failed'));
                    return;
                }
                resolve(new Response(x));
            };
            x.onerror = function () {
                reject(new TypeError('Network request failed'));
            };
            try {
                if (method === 'GET' || method === 'HEAD') {
                    x.send();
                } else {
                    x.send(body === undefined || body === null ? '' : body);
                }
            } catch (e3) {
                reject(e3);
            }
        });
    }
    w.fetch = fetch;

    if (typeof XMLHttpRequest !== 'function') {
        return;
    }
    var X = XMLHttpRequest.prototype;
    if (!X || typeof X !== 'object') {
        return;
    }
    X.__xhrDispatch = function (x, kind, loaded, total) {
        var ev = {
            type: kind,
            target: x,
            currentTarget: x,
            srcElement: x,
            loaded: loaded || 0,
            total: total || 0,
            lengthComputable: (total || 0) > 0,
            timeStamp: 0,
            bubbles: false,
            cancelable: false,
            defaultPrevented: false,
            preventDefault: function () {},
            stopPropagation: function () {},
            stopImmediatePropagation: function () {}
        };
        var ls = x.__ls;
        if (ls && ls[kind]) {
            var arr = ls[kind].slice();
            for (var i = 0; i < arr.length; i++) {
                if (typeof arr[i] === 'function') {
                    try {
                        arr[i].call(x, ev);
                    } catch (e) {}
                }
            }
        }
        var h = x['on' + kind];
        if (typeof h === 'function') {
            try {
                h.call(x, ev);
            } catch (e2) {}
        }
        return;
    };
    if (typeof X.addEventListener !== 'function') {
        X.addEventListener = function (type, fn) {
            if (typeof fn !== 'function') {
                return;
            }
            if (!this.__ls) {
                this.__ls = {};
            }
            if (!this.__ls[type]) {
                this.__ls[type] = [];
            }
            var a = this.__ls[type];
            for (var i = 0; i < a.length; i++) {
                if (a[i] === fn) {
                    return;
                }
            }
            a.push(fn);
        };
        X.removeEventListener = function (type, fn) {
            var a = this.__ls && this.__ls[type];
            if (!a) {
                return;
            }
            for (var i = 0; i < a.length; i++) {
                if (a[i] === fn) {
                    a.splice(i, 1);
                    return;
                }
            }
        };
        X.dispatchEvent = function (ev) {
            if (ev && ev.type) {
                this.__xhrDispatch(this, ev.type, 0, 0);
            }
            return true;
        };
    }
}());
