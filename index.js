var tokenize = require('tokenizer-array')

module.exports = function (rules) {
  var rrules = {}, rmatches = {}
  var matches = rules.map(function (r) { return RegExp(r.match,'i') })
  return function (src, opts) {
    if (typeof opts === 'string') opts = { lang: opts }
    if (!opts) opts = {}
    var ri = getRule(opts.lang)
    if (ri < 0) return esc(src)
    var r = rules[ri]
    if (!rrules[ri]) {
      rrules[ri] = r.rules.map(function f (x) {
        return {
          type: x[0],
          regex: RegExp(x[1]),
          children: x[2] ? x[2].map(g) : null
        }
        function g (x) { return x.map(f) }
      })
    }
    // support any number of keyword rules
    var iskwKey = (key) => key.indexOf('kw') === 0
    var kws = Object.keys(rules[0]).filter(iskwKey) // [kw0, kw1, etc...]
    kws.forEach((kw) => {
      this[kw] = {}
      ;(r[kw] || []).forEach((key) => { this[kw][key] = true })
    })
    var tokens = tokenize(src, rrules[ri])
    return '<span class="' + r.name + '">' + tokens.map(function f (t) {
      var c = xclass(t.type)
      if (t.type === 'identifier') {
        kws.forEach((kw) => {
          if (this[kw][t.source]) c += ` ${kw} kw-` + xclass(t.source)
        })
      }
      return '<span class="' + c + '">'
        + (t.children ? t.children.map(g).join('') : esc(t.source))
        + '</span>'
      function g (x) { return x.map(f).join('') }
    }).join('') + '</span>'
  }
  function getRule (lang) {
    if (rmatches[lang]) return rmatches[lang]
    for (var i = 0; i < matches.length; i++) {
      if (matches[i].test(lang)) return i
    }
    return -1
  }
}

function xclass (s) { return s.replace(/[\s_]+/g,'-') }
function esc (s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}
