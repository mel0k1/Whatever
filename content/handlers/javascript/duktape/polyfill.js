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

/* ES2015+ builtin shims for Duktape 2.7 */
(function () {
    'use strict';
    var G = (typeof globalThis === 'object' && globalThis !== null) ? globalThis :
        (typeof window === 'object' && window !== null ? window : null);
    function def(o, n, f) {
        if (o != null && o[n] === undefined) {
            Object.defineProperty(o, n, { value: f, writable: true, configurable: true });
        }
    }
    function toInt(v) {
        var n = Number(v);
        if (n !== n) return 0;
        if (n === 0 || n === Infinity || n === -Infinity) return n;
        return (n > 0 ? 1 : -1) * Math.floor(Math.abs(n));
    }
    if (G && typeof G.globalThis === 'undefined') {
        try { G.globalThis = G; } catch (e) {}
    }
    def(String.prototype, 'startsWith', function (s) {
        var t = String(this);
        var p = toInt(arguments[1]);
        if (p < 0) p = 0;
        if (p > t.length) p = t.length;
        return t.indexOf(String(s), p) === p;
    });
    def(String.prototype, 'endsWith', function (s) {
        var t = String(this);
        var e = arguments[1] === undefined ? t.length : toInt(arguments[1]);
        if (e > t.length) e = t.length;
        if (e < 0) e = 0;
        var p = e - String(s).length;
        return p >= 0 && t.lastIndexOf(String(s), p) === p;
    });
    def(String.prototype, 'includes', function (s) {
        var t = String(this);
        var p = toInt(arguments[1]);
        if (p < 0) p = 0;
        return t.indexOf(String(s), p) !== -1;
    });
    def(String.prototype, 'repeat', function (c) {
        var n = toInt(c);
        if (n < 0 || n === Infinity) throw new RangeError('invalid repeat count');
        var t = String(this);
        if (n === 0 || t === '') return '';
        if (t.length * n > (1 << 28)) throw new RangeError('repeat count too large');
        var out = '';
        while (n > 0) {
            if (n & 1) out += t;
            t += t;
            n >>= 1;
        }
        return out;
    });
    def(String.prototype, 'padStart', function (len) {
        var t = String(this);
        var pad = arguments[1] === undefined ? ' ' : String(arguments[1]);
        len = toInt(len);
        if (pad === '' || t.length >= len) return t;
        var need = len - t.length;
        var fill = '';
        while (fill.length < need) fill += pad;
        return fill.slice(0, need) + t;
    });
    def(String.prototype, 'padEnd', function (len) {
        var t = String(this);
        var pad = arguments[1] === undefined ? ' ' : String(arguments[1]);
        len = toInt(len);
        if (pad === '' || t.length >= len) return t;
        var need = len - t.length;
        var fill = '';
        while (fill.length < need) fill += pad;
        return t + fill.slice(0, need);
    });
    def(String.prototype, 'codePointAt', function (i) {
        var t = String(this);
        var n = t.length;
        i = toInt(i);
        if (i < 0 || i >= n) return undefined;
        var c = t.charCodeAt(i);
        if (c >= 0xD800 && c <= 0xDBFF && i + 1 < n) {
            var d = t.charCodeAt(i + 1);
            if (d >= 0xDC00 && d <= 0xDFFF) {
                return (c - 0xD800) * 0x400 + (d - 0xDC00) + 0x10000;
            }
        }
        return c;
    });
    def(String.prototype, 'trimStart', function () {
        return String(this).replace(/^\s+/, '');
    });
    def(String.prototype, 'trimEnd', function () {
        return String(this).replace(/\s+$/, '');
    });
    def(String.prototype, 'at', function (i) {
        var t = String(this);
        i = toInt(i);
        if (i < 0) i += t.length;
        if (i < 0 || i >= t.length) return undefined;
        return t.charAt(i);
    });
    def(Array.prototype, 'of', function () {
        return Array.prototype.slice.call(arguments);
    });
    def(Array.prototype, 'find', function (fn) {
        var thisArg = arguments[1];
        if (typeof fn !== 'function') throw new TypeError('find requires a function');
        for (var i = 0; i < this.length; i++) {
            if (fn.call(thisArg, this[i], i, this)) return this[i];
        }
        return undefined;
    });
    def(Array.prototype, 'findIndex', function (fn) {
        var thisArg = arguments[1];
        if (typeof fn !== 'function') throw new TypeError('findIndex requires a function');
        for (var i = 0; i < this.length; i++) {
            if (fn.call(thisArg, this[i], i, this)) return i;
        }
        return -1;
    });
    def(Array.prototype, 'includes', function (s) {
        var n = this.length;
        if (n === 0) return false;
        var f = toInt(arguments[1]);
        if (f >= n) return false;
        if (f < 0) f = Math.max(n + f, 0);
        for (var i = f; i < n; i++) {
            var v = this[i];
            if (v === s || (v !== v && s !== s)) return true;
        }
        return false;
    });
    def(Array.prototype, 'fill', function (v) {
        var n = this.length;
        var s = toInt(arguments[1]);
        var e = arguments[2] === undefined ? n : toInt(arguments[2]);
        if (s < 0) s = Math.max(n + s, 0);
        if (e < 0) e = n + e;
        if (e > n) e = n;
        for (var i = s; i < e; i++) this[i] = v;
        return this;
    });
    def(Array.prototype, 'flat', function () {
        var depth = arguments[0] === undefined ? 1 : toInt(arguments[0]);
        if (depth === Infinity) depth = 1 << 28;
        function fl(a, d) {
            var out = [];
            for (var i = 0; i < a.length; i++) {
                if (Array.isArray(a[i]) && d > 0) {
                    var inner = fl(a[i], d - 1);
                    for (var j = 0; j < inner.length; j++) out.push(inner[j]);
                } else {
                    out.push(a[i]);
                }
            }
            return out;
        }
        return fl(this, depth);
    });
    def(Array.prototype, 'flatMap', function (fn) {
        var thisArg = arguments[1];
        if (typeof fn !== 'function') throw new TypeError('flatMap requires a function');
        var out = [];
        for (var i = 0; i < this.length; i++) {
            var r = fn.call(thisArg, this[i], i, this);
            if (Array.isArray(r)) {
                for (var j = 0; j < r.length; j++) out.push(r[j]);
            } else {
                out.push(r);
            }
        }
        return out;
    });
    def(Object, 'assign', function (t) {
        if (t === null || t === undefined) throw new TypeError('assign target required');
        var o = Object(t);
        for (var i = 1; i < arguments.length; i++) {
            var s = arguments[i];
            if (s === null || s === undefined) continue;
            var so = Object(s);
            var keys = Object.keys(so);
            for (var k = 0; k < keys.length; k++) {
                o[keys[k]] = so[keys[k]];
            }
        }
        return o;
    });
    def(Object, 'values', function (o) {
        var so = Object(o);
        var ks = Object.keys(so);
        var out = [];
        for (var i = 0; i < ks.length; i++) out.push(so[ks[i]]);
        return out;
    });
    def(Object, 'entries', function (o) {
        var so = Object(o);
        var ks = Object.keys(so);
        var out = [];
        for (var i = 0; i < ks.length; i++) out.push([ks[i], so[ks[i]]]);
        return out;
    });
    def(Object, 'is', function (a, b) {
        if (a === b) return a !== 0 || 1 / a === 1 / b;
        return a !== a && b !== b;
    });
    def(Object, 'setPrototypeOf', function (o, p) {
        if (o === null || o === undefined) throw new TypeError('setPrototypeOf requires an object');
        var acc = Object.getOwnPropertyDescriptor(Object.prototype, '__proto__');
        if (acc && typeof acc.set === 'function') {
            acc.set.call(o, p);
        } else {
            try { o.__proto__ = p; } catch (e) {}
        }
        return o;
    });
    def(Object, 'getOwnPropertySymbols', function () { return []; });
    def(Object, 'fromEntries', function (list) {
        var o = {};
        var a = Object(list);
        if (a && typeof a.length === 'number') {
            for (var i = 0; i < a.length; i++) {
                var e = a[i];
                if (e !== null && e !== undefined && e.length) {
                    o[e[0]] = e[1];
                }
            }
        }
        return o;
    });
    def(Number, 'EPSILON', Math.pow(2, -52));
    def(Number, 'MAX_SAFE_INTEGER', 9007199254740991);
    def(Number, 'MIN_SAFE_INTEGER', -9007199254740991);
    def(Number, 'isInteger', function (v) {
        return typeof v === 'number' && v === v && v !== Infinity && v !== -Infinity && Math.floor(v) === v;
    });
    def(Number, 'isSafeInteger', function (v) {
        return Number.isInteger(v) && Math.abs(v) <= 9007199254740991;
    });
    def(Number, 'isFinite', function (v) {
        return typeof v === 'number' && v === v && v !== Infinity && v !== -Infinity;
    });
    def(Number, 'isNaN', function (v) {
        return typeof v === 'number' && v !== v;
    });
    def(Math, 'trunc', function (v) {
        var n = Number(v);
        if (n !== n || n === Infinity || n === -Infinity || n === 0) return n;
        return n < 0 ? -Math.floor(-n) : Math.floor(n);
    });
    def(Math, 'sign', function (v) {
        var n = Number(v);
        if (n !== n || n === 0) return n;
        return n > 0 ? 1 : -1;
    });
    def(Math, 'cbrt', function (v) {
        var n = Number(v);
        if (n === 0 || n !== n || n === Infinity || n === -Infinity) return n;
        var s = n < 0 ? -1 : 1;
        return s * Math.pow(Math.abs(n), 1 / 3);
    });
    def(Math, 'log2', function (v) { return Math.log(Number(v)) / Math.LN2; });
    def(Math, 'log10', function (v) { return Math.log(Number(v)) / Math.LN10; });
    def(Math, 'hypot', function () {
        var s = 0;
        for (var i = 0; i < arguments.length; i++) {
            var n = Number(arguments[i]);
            if (n === Infinity || n === -Infinity) return Infinity;
            s += n * n;
        }
        return Math.sqrt(s);
    });
    def(Math, 'imul', function (a, b) {
        var ua = (a >>> 16) & 0xffff;
        var ub = (b >>> 16) & 0xffff;
        return ((((a & 0xffff) * ub) + (ua * (b & 0xffff))) << 16) + ((a & 0xffff) * (b & 0xffff)) | 0;
    });
    def(Math, 'clz32', function (v) {
        var n = toInt(v) >>> 0;
        if (n === 0) return 32;
        var c = 0;
        if ((n & 0xffff0000) === 0) { c += 16; n <<= 16; }
        if ((n & 0xff000000) === 0) { c += 8; n <<= 8; }
        if ((n & 0xf0000000) === 0) { c += 4; n <<= 4; }
        if ((n & 0xc0000000) === 0) { c += 2; n <<= 2; }
        if ((n & 0x80000000) === 0) { c += 1; }
        return c;
    });
    def(Math, 'fround', function (v) {
        var f = new Float32Array(1);
        f[0] = Number(v);
        return f[0];
    });
})();

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
    if (typeof __nsElementFromPoint === 'function' && docProto.elementFromPoint === undefined) {
        defineValue(docProto, 'elementFromPoint', function (x, y) {
            return __nsElementFromPoint(Number(x) || 0, Number(y) || 0);
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
    if (elementProto.scrollIntoView === undefined || typeof __nsScrollTo === 'function') {
        defineValue(elementProto, 'scrollIntoView', function (arg) {
            if (typeof __nsScrollTo !== 'function' || typeof __nsRect !== 'function') {
                return;
            }
            var r = __nsRect(this);
            if (r === null || r === undefined) {
                return;
            }
            var mode = 'start';
            if (typeof arg === 'string') {
                mode = arg;
            } else if (typeof arg === 'boolean') {
                mode = arg ? 'start' : 'end';
            } else if (arg !== null && arg !== undefined && typeof arg === 'object') {
                mode = arg.block === undefined ? 'start' : arg.block;
            }
            var y = r.top;
            if (mode === 'center') {
                y = r.top - (window.innerHeight - r.height) / 2;
            } else if (mode === 'end') {
                y = r.bottom - window.innerHeight;
            } else if (mode === 'nearest') {
                if (r.top >= 0 && r.bottom <= window.innerHeight) {
                    return;
                }
                y = r.top < 0 ? r.top : r.bottom - window.innerHeight;
            }
            __nsScrollTo(window.scrollX + r.left, window.scrollY + y);
        });
    }

    if (typeof __nsRect === 'function') {
        defineValue(elementProto, 'getBoundingClientRect', function () {
            return __nsRect(this);
        });
        defineValue(elementProto, 'getClientRects', function () {
            var out = [__nsRect(this)];
            out.item = function (i) {
                return (i >= 0 && i < out.length) ? out[i] : null;
            };
            return out;
        });
    }
    if (typeof __nsRect === 'function') {
        var geoRect = function (el) {
            var r = __nsRect(el);
            if (r === null || r === undefined) {
                r = {x: 0, y: 0, left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0};
            }
            return r;
        };
        var geoPx = function (v) {
            var n = parseFloat(v);
            if (n !== n || n < 0) {
                return 0;
            }
            return Math.round(n);
        };
        var geoStyled = function (el) {
            return typeof window.getComputedStyle === 'function' ? window.getComputedStyle(el, null) : null;
        };
        var geoOffsetParent = function (el) {
            var e = el.parentElement;
            while (e !== null && e !== undefined) {
                var s = geoStyled(e);
                var p = s ? s.position : 'static';
                if (p === 'relative' || p === 'absolute' || p === 'fixed' || p === 'sticky') {
                    return e;
                }
                if (e.nodeName === 'BODY') {
                    return e;
                }
                e = e.parentElement;
            }
            return null;
        };
        defineGetter(elementProto, 'offsetWidth', function () {
            return geoRect(this).width;
        });
        defineGetter(elementProto, 'offsetHeight', function () {
            return geoRect(this).height;
        });
        defineGetter(elementProto, 'clientTop', function () {
            var s = geoStyled(this);
            return s ? geoPx(s['border-top-width']) : 0;
        });
        defineGetter(elementProto, 'clientLeft', function () {
            var s = geoStyled(this);
            return s ? geoPx(s['border-left-width']) : 0;
        });
        defineGetter(elementProto, 'clientWidth', function () {
            var r = geoRect(this);
            var s = geoStyled(this);
            var bl = s ? geoPx(s['border-left-width']) : 0;
            var br = s ? geoPx(s['border-right-width']) : 0;
            var w = r.width - bl - br;
            return w > 0 ? w : 0;
        });
        defineGetter(elementProto, 'clientHeight', function () {
            var r = geoRect(this);
            var s = geoStyled(this);
            var bt = s ? geoPx(s['border-top-width']) : 0;
            var bb = s ? geoPx(s['border-bottom-width']) : 0;
            var h = r.height - bt - bb;
            return h > 0 ? h : 0;
        });
        defineGetter(elementProto, 'offsetParent', function () {
            return geoOffsetParent(this);
        });
        defineGetter(elementProto, 'offsetLeft', function () {
            var r = geoRect(this);
            var p = geoOffsetParent(this);
            if (p === null || p === undefined) {
                return r.left + window.scrollX;
            }
            var pr = geoRect(p);
            var ps = geoStyled(p);
            var pl = ps ? geoPx(ps['border-left-width']) : 0;
            return r.left - pr.left - pl;
        });
        defineGetter(elementProto, 'offsetTop', function () {
            var r = geoRect(this);
            var p = geoOffsetParent(this);
            if (p === null || p === undefined) {
                return r.top + window.scrollY;
            }
            var pr = geoRect(p);
            var ps = geoStyled(p);
            var pt = ps ? geoPx(ps['border-top-width']) : 0;
            return r.top - pr.top - pt;
        });
    }
    if (elementProto.scrollTop === undefined) {
        Object.defineProperty(elementProto, 'scrollTop', {
            get: function () { return 0; },
            set: function () {},
            configurable: true
        });
        Object.defineProperty(elementProto, 'scrollLeft', {
            get: function () { return 0; },
            set: function () {},
            configurable: true
        });
    }

    if (elementProto.outerHTML === undefined) {
        Object.defineProperty(elementProto, 'outerHTML', {
            get: function () {
                var d = (this.ownerDocument || doc).createElement('div');
                d.appendChild(this.cloneNode(true));
                return d.innerHTML;
            },
            set: function (v) {
                var p = this.parentElement || this.parentNode;
                if (p === null || p === undefined) {
                    return;
                }
                var cont = (this.ownerDocument || doc).createElement('div');
                cont.innerHTML = v === null || v === undefined ? '' : String(v);
                var nx = this.nextSibling;
                var c;
                while ((c = cont.firstChild) !== null && c !== undefined) {
                    p.insertBefore(c, nx);
                }
                p.removeChild(this);
            },
            configurable: true
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

    if (docProto.activeElement === undefined) {
        defineGetter(docProto, 'activeElement', function () {
            return this.body || this.documentElement || null;
        });
    }
    if (docProto.defaultView === undefined) {
        defineGetter(docProto, 'defaultView', function () {
            return (typeof window !== 'undefined' && window !== null) ? window : null;
        });
    }
    if (docProto.forms === undefined) {
        defineGetter(docProto, 'forms', function () {
            return this.getElementsByTagName('form');
        });
        defineGetter(docProto, 'images', function () {
            return this.getElementsByTagName('img');
        });
        defineGetter(docProto, 'links', function () {
            return this.getElementsByTagName('a');
        });
        defineGetter(docProto, 'scripts', function () {
            return this.getElementsByTagName('script');
        });
        defineGetter(docProto, 'embeds', function () {
            return this.getElementsByTagName('embed');
        });
    }

    if (typeof window !== 'undefined' && window !== null) {
        if (typeof window.btoa !== 'function') {
            var B64A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
            var B64T = {};
            var b64i;
            for (b64i = 0; b64i < 64; b64i++) {
                B64T[B64A.charAt(b64i)] = b64i;
            }
            var b64err = function () {
                var e = new Error('InvalidCharacterError');
                e.name = 'InvalidCharacterError';
                return e;
            };
            window.btoa = function (s) {
                s = String(s);
                var n = s.length;
                var i;
                for (i = 0; i < n; i++) {
                    if (s.charCodeAt(i) > 255) {
                        throw b64err();
                    }
                }
                var r = [];
                for (i = 0; i < n; i += 3) {
                    var b0 = s.charCodeAt(i);
                    var has1 = i + 1 < n;
                    var has2 = i + 2 < n;
                    var b1 = has1 ? s.charCodeAt(i + 1) : 0;
                    var b2 = has2 ? s.charCodeAt(i + 2) : 0;
                    r.push(B64A.charAt(b0 >> 2));
                    r.push(B64A.charAt(((b0 & 3) << 4) | (b1 >> 4)));
                    r.push(has1 ? B64A.charAt(((b1 & 15) << 2) | (b2 >> 6)) : '=');
                    r.push(has2 ? B64A.charAt(b2 & 63) : '=');
                }
                return r.join('');
            };
            window.atob = function (s) {
                s = String(s).replace(/[ \t\n\f\r]/g, '');
                var n = s.length;
                if (n % 4 === 1 || /[^A-Za-z0-9+\/=]/.test(s)) {
                    throw b64err();
                }
                var pad = 0;
                if (n > 0 && s.charAt(n - 1) === '=') {
                    pad++;
                }
                if (n > 1 && s.charAt(n - 2) === '=') {
                    pad++;
                }
                var eq = s.indexOf('=');
                if (eq !== -1 && eq !== n - pad) {
                    throw b64err();
                }
                var out = [];
                var lim = n - pad;
                var i;
                for (i = 0; i < lim; i += 4) {
                    var d0 = B64T[s.charAt(i)];
                    var d1 = B64T[s.charAt(i + 1)];
                    var d2 = i + 2 < lim ? B64T[s.charAt(i + 2)] : 0;
                    var d3 = i + 3 < lim ? B64T[s.charAt(i + 3)] : 0;
                    out.push(String.fromCharCode((d0 << 2) | (d1 >> 4)));
                    if (i + 2 < lim) {
                        out.push(String.fromCharCode(((d1 & 15) << 4) | (d2 >> 2)));
                    }
                    if (i + 3 < lim) {
                        out.push(String.fromCharCode(((d2 & 3) << 6) | d3));
                    }
                }
                return out.join('');
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
        if (typeof __nsScrollTo === 'function') {
            var scrI = function (v) {
                var n = Number(v);
                return n === n ? n : 0;
            };
            defineValue(window, 'scrollTo', function (x, y) {
                if (x !== null && x !== undefined && typeof x === 'object') {
                    __nsScrollTo(scrI(x.left === undefined ? x.x : x.left), scrI(x.top === undefined ? x.y : x.top));
                    return;
                }
                __nsScrollTo(scrI(x), scrI(y));
            });
            defineValue(window, 'scroll', window.scrollTo);
            defineValue(window, 'scrollBy', function (x, y) {
                if (x !== null && x !== undefined && typeof x === 'object') {
                    __nsScrollTo(window.scrollX + scrI(x.left === undefined ? x.x : x.left), window.scrollY + scrI(x.top === undefined ? x.y : x.top));
                    return;
                }
                __nsScrollTo(window.scrollX + scrI(x), window.scrollY + scrI(y));
            });
        }

        if (typeof __nsMetrics === 'function') {
            defineGetter(window, 'innerWidth', function () {
                return __nsMetrics().innerWidth;
            });
            defineGetter(window, 'innerHeight', function () {
                return __nsMetrics().innerHeight;
            });
            defineGetter(window, 'outerWidth', function () {
                return __nsMetrics().outerWidth;
            });
            defineGetter(window, 'outerHeight', function () {
                return __nsMetrics().outerHeight;
            });
            defineGetter(window, 'scrollX', function () {
                return __nsMetrics().scrollX;
            });
            defineGetter(window, 'scrollY', function () {
                return __nsMetrics().scrollY;
            });
            defineGetter(window, 'pageXOffset', function () {
                return __nsMetrics().scrollX;
            });
            defineGetter(window, 'pageYOffset', function () {
                return __nsMetrics().scrollY;
            });
            defineGetter(window, 'devicePixelRatio', function () {
                return __nsMetrics().devicePixelRatio;
            });
        }

        if (typeof window.confirm !== 'function') {
            window.confirm = function () {
                return false;
            };
        }
        if (typeof window.prompt !== 'function') {
            window.prompt = function () {
                return null;
            };
        }
        if (typeof window.print !== 'function') {
            window.print = function () {
            };
        }
        if (typeof window.performance === 'undefined' || window.performance === null) {
            window.performance = {
                timeOrigin: new Date().getTime(),
                now: function () {
                    return new Date().getTime();
                }
            };
        } else if (typeof window.performance.now !== 'function') {
            window.performance.now = function () {
                return new Date().getTime();
            };
        }
        if (typeof window.getSelection !== 'function') {
            window.getSelection = function () {
                return {
                    rangeCount: 0,
                    isCollapsed: true,
                    getRangeAt: function () {
                        throw new Error('no ranges');
                    },
                    addRange: function () {
                    },
                    removeAllRanges: function () {
                    },
                    toString: function () {
                        return '';
                    }
                };
            };
        }
        if (typeof window.history === 'undefined' || window.history === null) {
            var histState = null;
            var histObj = {
                length: 0,
                scrollRestoration: 'auto',
                back: function () {
                    histObj.go(-1);
                },
                forward: function () {
                    histObj.go(1);
                },
                go: function (n) {
                    if (typeof __nsHistoryGo === 'function') {
                        __nsHistoryGo(Number(n) || 0);
                    }
                },
                pushState: function (s) {
                    histState = s;
                },
                replaceState: function (s) {
                    histState = s;
                }
            };
            Object.defineProperty(histObj, 'state', {
                get: function () {
                    return histState;
                },
                configurable: true
            });
            window.history = histObj;
        }
        if (typeof document.createEvent === 'function') {
            if (typeof window.Event !== 'function') {
                window.Event = function (type, params) {
                    var evt = document.createEvent('Event');
                    var p = params || {};
                    evt.initEvent(type, !!p.bubbles, !!p.cancelable);
                    return evt;
                };
                window.Event.NONE = 0;
                window.Event.CAPTURING_PHASE = 1;
                window.Event.AT_TARGET = 2;
                window.Event.BUBBLING_PHASE = 3;
            }
            if (typeof window.CustomEvent !== 'function') {
                window.CustomEvent = function (type, params) {
                    var evt = document.createEvent('Event');
                    var p = params || {};
                    evt.initEvent(type, !!p.bubbles, !!p.cancelable);
                    try {
                        evt.detail = p.detail === undefined ? null : p.detail;
                    } catch (e) {}
                    return evt;
                };
                window.CustomEvent.prototype = window.Event.prototype;
            }
        }
        if (typeof navigator !== 'undefined' && navigator !== null && typeof navigator.language === 'undefined') {
            navigator.language = 'en-US';
            navigator.languages = ['en-US'];
        }
        try {
            if (typeof window.self === 'undefined') {
                window.self = window;
            }
            if (typeof window.parent === 'undefined') {
                window.parent = window;
            }
            if (typeof window.top === 'undefined') {
                window.top = window;
            }
        } catch (eSelf) {}
        if (typeof window.localStorage === 'undefined' || window.localStorage === null) {
            var nsStore = (function () {
                function esc(s) {
                    return String(s).replace(/\\/g, '\\\\').replace(/\t/g, '\\t')
                        .replace(/\n/g, '\\n').replace(/\r/g, '\\r');
                }
                function unesc(s) {
                    return String(s).replace(/\\[\\trn]/g, function (m) {
                        var c = m.charAt(1);
                        return c === '\\' ? '\\' : (c === 't' ? '\t' : (c === 'n' ? '\n' : '\r'));
                    });
                }
                function parse(blob) {
                    var map = {};
                    var lines = String(blob === undefined || blob === null ? '' : blob).split('\n');
                    for (var i = 0; i < lines.length; i++) {
                        if (lines[i] === '') continue;
                        var t = lines[i].indexOf('\t');
                        if (t < 0) continue;
                        map[unesc(lines[i].slice(0, t))] = unesc(lines[i].slice(t + 1));
                    }
                    return map;
                }
                function originOf() {
                    var l = window.location;
                    if (!l || typeof l.protocol !== 'string') {
                        return 'null';
                    }
                    if (l.protocol === 'file:') {
                        return 'file';
                    }
                    return l.protocol + '//' + String(l.host || '');
                }
                function Store(namespace) {
                    this.__m = {};
                    this.__live = false;
                    if (namespace === 'local' && typeof __nsStorageRead === 'function') {
                        this.__m = parse(__nsStorageRead(originOf()));
                        this.__live = true;
                    }
                }
                Store.prototype.__save = function () {
                    if (!this.__live) return;
                    var out = [];
                    for (var k in this.__m) {
                        if (Object.prototype.hasOwnProperty.call(this.__m, k)) {
                            out.push(esc(k) + '\t' + esc(this.__m[k]));
                        }
                    }
                    __nsStorageWrite(originOf(), out.length ? out.join('\n') + '\n' : '');
                };
                Store.prototype.getItem = function (k) {
                    k = String(k);
                    if (Object.prototype.hasOwnProperty.call(this.__m, k)) {
                        return this.__m[k];
                    }
                    return null;
                };
                Store.prototype.setItem = function (k, v) {
                    this.__m[String(k)] = String(v);
                    this.__save();
                };
                Store.prototype.removeItem = function (k) {
                    delete this.__m[String(k)];
                    this.__save();
                };
                Store.prototype.clear = function () {
                    this.__m = {};
                    this.__save();
                };
                Store.prototype.key = function (i) {
                    var ks = Object.keys(this.__m);
                    return (i >= 0 && i < ks.length) ? ks[i] : null;
                };
                Object.defineProperty(Store.prototype, 'length', {
                    get: function () {
                        return Object.keys(this.__m).length;
                    },
                    configurable: true
                });
                return Store;
            })();
            try {
                window.localStorage = new nsStore('local');
            } catch (eStore) {
                window.localStorage = null;
            }
            window.sessionStorage = new nsStore('session');
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
