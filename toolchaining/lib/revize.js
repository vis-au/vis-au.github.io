(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.vl = factory());
}(this, (function () { 'use strict';

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function unwrapExports (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var View_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.View = void 0;
	class View {
	    constructor(visualElements, layout, parent) {
	        this.visualElements = visualElements;
	        this.layout = layout;
	        this.parent = parent;
	        this.id = `view${Math.round(Math.random() * 10000)}`;
	        this.hierarchyLevel = -1;
	        this.dataNode = null;
	        this.encodings = new Map();
	        this.overwrittenEncodings = new Map();
	    }
	    /**
	     * Returns the flattened hierarchy of views succeeding this one.
	     */
	    getFlatHierarchy() {
	        const successors = [];
	        successors.push(this);
	        this.visualElements.forEach(successor => {
	            successors.push(...successor.getFlatHierarchy());
	        });
	        return successors;
	    }
	    /**
	     * Returns the hierarchy level of this view, starting at 0.
	     */
	    getHierarchyLevel() {
	        if (this.hierarchyLevel > -1) {
	            return this.hierarchyLevel;
	        }
	        // since the view may have visual elements from different leves, output the highest value
	        // between all sub-hierarchies
	        if (this.visualElements.length === 0) {
	            return 0;
	        }
	        const subHierarchies = this.visualElements.map(v => v.getHierarchyLevel());
	        this.hierarchyLevel = Math.max(...subHierarchies) + 1;
	        return this.hierarchyLevel;
	    }
	    setEncodedValue(encoding, value) {
	        this.encodings.set(encoding, value);
	    }
	    getEncodedValue(encoding) {
	        return this.encodings.get(encoding);
	    }
	    deleteEncodedValue(encoding) {
	        this.encodings.delete(encoding);
	    }
	    set dataTransformationNode(transformNode) {
	        this.dataNode = transformNode;
	    }
	    get dataTransformationNode() {
	        return this.dataNode;
	    }
	    get data() {
	        if (this.dataNode === null) {
	            return null;
	        }
	        const data = this.dataNode.getSchema();
	        return data;
	    }
	    get transform() {
	        if (this.dataNode === null) {
	            return [];
	        }
	        const transform = this.dataNode.getTransform();
	        return transform;
	    }
	}
	exports.View = View;
	});

	unwrapExports(View_1);
	View_1.View;

	function accessor(fn, fields, name) {
	  fn.fields = fields || [];
	  fn.fname = name;
	  return fn;
	}

	function error(message) {
	  throw Error(message);
	}

	function splitAccessPath(p) {
	  var path = [],
	      q = null,
	      b = 0,
	      n = p.length,
	      s = '',
	      i, j, c;

	  p = p + '';

	  function push() {
	    path.push(s + p.substring(i, j));
	    s = '';
	    i = j + 1;
	  }

	  for (i=j=0; j<n; ++j) {
	    c = p[j];
	    if (c === '\\') {
	      s += p.substring(i, j);
	      i = ++j;
	    } else if (c === q) {
	      push();
	      q = null;
	      b = -1;
	    } else if (q) {
	      continue;
	    } else if (i === b && c === '"') {
	      i = j + 1;
	      q = c;
	    } else if (i === b && c === "'") {
	      i = j + 1;
	      q = c;
	    } else if (c === '.' && !b) {
	      if (j > i) {
	        push();
	      } else {
	        i = j + 1;
	      }
	    } else if (c === '[') {
	      if (j > i) push();
	      b = i = j + 1;
	    } else if (c === ']') {
	      if (!b) error('Access path missing open bracket: ' + p);
	      if (b > 0) push();
	      b = 0;
	      i = j + 1;
	    }
	  }

	  if (b) error('Access path missing closing bracket: ' + p);
	  if (q) error('Access path missing closing quote: ' + p);

	  if (j > i) {
	    j++;
	    push();
	  }

	  return path;
	}

	var isArray = Array.isArray;

	function isObject(_) {
	  return _ === Object(_);
	}

	function isString(_) {
	  return typeof _ === 'string';
	}

	function $(x) {
	  return isArray(x) ? '[' + x.map($) + ']'
	    : isObject(x) || isString(x) ?
	      // Output valid JSON and JS source strings.
	      // See http://timelessrepo.com/json-isnt-a-javascript-subset
	      JSON.stringify(x).replace('\u2028','\\u2028').replace('\u2029', '\\u2029')
	    : x;
	}

	function field(field, name) {
	  var path = splitAccessPath(field),
	      code = 'return _[' + path.map($).join('][') + '];';

	  return accessor(
	    Function('_', code),
	    [(field = path.length===1 ? path[0] : field)],
	    name || field
	  );
	}

	var empty = [];

	field('id');

	accessor(function(_) { return _; }, empty, 'identity');

	accessor(function() { return 0; }, empty, 'zero');

	accessor(function() { return 1; }, empty, 'one');

	accessor(function() { return true; }, empty, 'true');

	accessor(function() { return false; }, empty, 'false');

	function log(method, level, input) {
	  var msg = [level].concat([].slice.call(input));
	  console[method](...msg); // eslint-disable-line no-console
	}

	var None  = 0;
	var Error$1 = 1;
	var Warn  = 2;
	var Info  = 3;
	var Debug = 4;

	function logger(_, method) {
	  var level = _ || None;
	  return {
	    level: function(_) {
	      if (arguments.length) {
	        level = +_;
	        return this;
	      } else {
	        return level;
	      }
	    },
	    error: function() {
	      if (level >= Error$1) log(method || 'error', 'ERROR', arguments);
	      return this;
	    },
	    warn: function() {
	      if (level >= Warn) log(method || 'warn', 'WARN', arguments);
	      return this;
	    },
	    info: function() {
	      if (level >= Info) log(method || 'log', 'INFO', arguments);
	      return this;
	    },
	    debug: function() {
	      if (level >= Debug) log(method || 'log', 'DEBUG', arguments);
	      return this;
	    }
	  }
	}

	function isBoolean(_) {
	  return typeof _ === 'boolean';
	}

	function isNumber(_) {
	  return typeof _ === 'number';
	}

	function toSet(_) {
	  for (var s={}, i=0, n=_.length; i<n; ++i) s[_[i]] = true;
	  return s;
	}

	var clone_1 = createCommonjsModule(function (module) {
	var clone = (function() {

	function _instanceof(obj, type) {
	  return type != null && obj instanceof type;
	}

	var nativeMap;
	try {
	  nativeMap = Map;
	} catch(_) {
	  // maybe a reference error because no `Map`. Give it a dummy value that no
	  // value will ever be an instanceof.
	  nativeMap = function() {};
	}

	var nativeSet;
	try {
	  nativeSet = Set;
	} catch(_) {
	  nativeSet = function() {};
	}

	var nativePromise;
	try {
	  nativePromise = Promise;
	} catch(_) {
	  nativePromise = function() {};
	}

	/**
	 * Clones (copies) an Object using deep copying.
	 *
	 * This function supports circular references by default, but if you are certain
	 * there are no circular references in your object, you can save some CPU time
	 * by calling clone(obj, false).
	 *
	 * Caution: if `circular` is false and `parent` contains circular references,
	 * your program may enter an infinite loop and crash.
	 *
	 * @param `parent` - the object to be cloned
	 * @param `circular` - set to true if the object to be cloned may contain
	 *    circular references. (optional - true by default)
	 * @param `depth` - set to a number if the object is only to be cloned to
	 *    a particular depth. (optional - defaults to Infinity)
	 * @param `prototype` - sets the prototype to be used when cloning an object.
	 *    (optional - defaults to parent prototype).
	 * @param `includeNonEnumerable` - set to true if the non-enumerable properties
	 *    should be cloned as well. Non-enumerable properties on the prototype
	 *    chain will be ignored. (optional - false by default)
	*/
	function clone(parent, circular, depth, prototype, includeNonEnumerable) {
	  if (typeof circular === 'object') {
	    depth = circular.depth;
	    prototype = circular.prototype;
	    includeNonEnumerable = circular.includeNonEnumerable;
	    circular = circular.circular;
	  }
	  // maintain two arrays for circular references, where corresponding parents
	  // and children have the same index
	  var allParents = [];
	  var allChildren = [];

	  var useBuffer = typeof Buffer != 'undefined';

	  if (typeof circular == 'undefined')
	    circular = true;

	  if (typeof depth == 'undefined')
	    depth = Infinity;

	  // recurse this function so we don't reset allParents and allChildren
	  function _clone(parent, depth) {
	    // cloning null always returns null
	    if (parent === null)
	      return null;

	    if (depth === 0)
	      return parent;

	    var child;
	    var proto;
	    if (typeof parent != 'object') {
	      return parent;
	    }

	    if (_instanceof(parent, nativeMap)) {
	      child = new nativeMap();
	    } else if (_instanceof(parent, nativeSet)) {
	      child = new nativeSet();
	    } else if (_instanceof(parent, nativePromise)) {
	      child = new nativePromise(function (resolve, reject) {
	        parent.then(function(value) {
	          resolve(_clone(value, depth - 1));
	        }, function(err) {
	          reject(_clone(err, depth - 1));
	        });
	      });
	    } else if (clone.__isArray(parent)) {
	      child = [];
	    } else if (clone.__isRegExp(parent)) {
	      child = new RegExp(parent.source, __getRegExpFlags(parent));
	      if (parent.lastIndex) child.lastIndex = parent.lastIndex;
	    } else if (clone.__isDate(parent)) {
	      child = new Date(parent.getTime());
	    } else if (useBuffer && Buffer.isBuffer(parent)) {
	      if (Buffer.allocUnsafe) {
	        // Node.js >= 4.5.0
	        child = Buffer.allocUnsafe(parent.length);
	      } else {
	        // Older Node.js versions
	        child = new Buffer(parent.length);
	      }
	      parent.copy(child);
	      return child;
	    } else if (_instanceof(parent, Error)) {
	      child = Object.create(parent);
	    } else {
	      if (typeof prototype == 'undefined') {
	        proto = Object.getPrototypeOf(parent);
	        child = Object.create(proto);
	      }
	      else {
	        child = Object.create(prototype);
	        proto = prototype;
	      }
	    }

	    if (circular) {
	      var index = allParents.indexOf(parent);

	      if (index != -1) {
	        return allChildren[index];
	      }
	      allParents.push(parent);
	      allChildren.push(child);
	    }

	    if (_instanceof(parent, nativeMap)) {
	      parent.forEach(function(value, key) {
	        var keyChild = _clone(key, depth - 1);
	        var valueChild = _clone(value, depth - 1);
	        child.set(keyChild, valueChild);
	      });
	    }
	    if (_instanceof(parent, nativeSet)) {
	      parent.forEach(function(value) {
	        var entryChild = _clone(value, depth - 1);
	        child.add(entryChild);
	      });
	    }

	    for (var i in parent) {
	      var attrs;
	      if (proto) {
	        attrs = Object.getOwnPropertyDescriptor(proto, i);
	      }

	      if (attrs && attrs.set == null) {
	        continue;
	      }
	      child[i] = _clone(parent[i], depth - 1);
	    }

	    if (Object.getOwnPropertySymbols) {
	      var symbols = Object.getOwnPropertySymbols(parent);
	      for (var i = 0; i < symbols.length; i++) {
	        // Don't need to worry about cloning a symbol because it is a primitive,
	        // like a number or string.
	        var symbol = symbols[i];
	        var descriptor = Object.getOwnPropertyDescriptor(parent, symbol);
	        if (descriptor && !descriptor.enumerable && !includeNonEnumerable) {
	          continue;
	        }
	        child[symbol] = _clone(parent[symbol], depth - 1);
	        if (!descriptor.enumerable) {
	          Object.defineProperty(child, symbol, {
	            enumerable: false
	          });
	        }
	      }
	    }

	    if (includeNonEnumerable) {
	      var allPropertyNames = Object.getOwnPropertyNames(parent);
	      for (var i = 0; i < allPropertyNames.length; i++) {
	        var propertyName = allPropertyNames[i];
	        var descriptor = Object.getOwnPropertyDescriptor(parent, propertyName);
	        if (descriptor && descriptor.enumerable) {
	          continue;
	        }
	        child[propertyName] = _clone(parent[propertyName], depth - 1);
	        Object.defineProperty(child, propertyName, {
	          enumerable: false
	        });
	      }
	    }

	    return child;
	  }

	  return _clone(parent, depth);
	}

	/**
	 * Simple flat clone using prototype, accepts only objects, usefull for property
	 * override on FLAT configuration object (no nested props).
	 *
	 * USE WITH CAUTION! This may not behave as you wish if you do not know how this
	 * works.
	 */
	clone.clonePrototype = function clonePrototype(parent) {
	  if (parent === null)
	    return null;

	  var c = function () {};
	  c.prototype = parent;
	  return new c();
	};

	// private utility functions

	function __objToStr(o) {
	  return Object.prototype.toString.call(o);
	}
	clone.__objToStr = __objToStr;

	function __isDate(o) {
	  return typeof o === 'object' && __objToStr(o) === '[object Date]';
	}
	clone.__isDate = __isDate;

	function __isArray(o) {
	  return typeof o === 'object' && __objToStr(o) === '[object Array]';
	}
	clone.__isArray = __isArray;

	function __isRegExp(o) {
	  return typeof o === 'object' && __objToStr(o) === '[object RegExp]';
	}
	clone.__isRegExp = __isRegExp;

	function __getRegExpFlags(re) {
	  var flags = '';
	  if (re.global) flags += 'g';
	  if (re.ignoreCase) flags += 'i';
	  if (re.multiline) flags += 'm';
	  return flags;
	}
	clone.__getRegExpFlags = __getRegExpFlags;

	return clone;
	})();

	if (module.exports) {
	  module.exports = clone;
	}
	});

	var fastJsonStableStringify = function (data, opts) {
	    if (!opts) opts = {};
	    if (typeof opts === 'function') opts = { cmp: opts };
	    var cycles = (typeof opts.cycles === 'boolean') ? opts.cycles : false;

	    var cmp = opts.cmp && (function (f) {
	        return function (node) {
	            return function (a, b) {
	                var aobj = { key: a, value: node[a] };
	                var bobj = { key: b, value: node[b] };
	                return f(aobj, bobj);
	            };
	        };
	    })(opts.cmp);

	    var seen = [];
	    return (function stringify (node) {
	        if (node && node.toJSON && typeof node.toJSON === 'function') {
	            node = node.toJSON();
	        }

	        if (node === undefined) return;
	        if (typeof node == 'number') return isFinite(node) ? '' + node : 'null';
	        if (typeof node !== 'object') return JSON.stringify(node);

	        var i, out;
	        if (Array.isArray(node)) {
	            out = '[';
	            for (i = 0; i < node.length; i++) {
	                if (i) out += ',';
	                out += stringify(node[i]) || 'null';
	            }
	            return out + ']';
	        }

	        if (node === null) return 'null';

	        if (seen.indexOf(node) !== -1) {
	            if (cycles) return JSON.stringify('__cycle__');
	            throw new TypeError('Converting circular structure to JSON');
	        }

	        var seenIndex = seen.push(node) - 1;
	        var keys = Object.keys(node).sort(cmp && cmp(node));
	        out = '';
	        for (i = 0; i < keys.length; i++) {
	            var key = keys[i];
	            var value = stringify(node[key]);

	            if (!value) continue;
	            if (out) out += ',';
	            out += JSON.stringify(key) + ':' + value;
	        }
	        seen.splice(seenIndex, 1);
	        return '{' + out + '}';
	    })(data);
	};

	const duplicate = clone_1;
	/**
	 * Monkey patch Set so that `stringify` produces a string representation of sets.
	 */
	Set.prototype['toJSON'] = function () {
	    return `Set(${[...this].map(x => fastJsonStableStringify(x)).join(',')})`;
	};
	/**
	 * Converts any object to a string representation that can be consumed by humans.
	 */
	const stringify = fastJsonStableStringify;
	function contains(array, item) {
	    return array.indexOf(item) > -1;
	}
	// This is a stricter version of Object.keys but with better types. See https://github.com/Microsoft/TypeScript/pull/12253#issuecomment-263132208
	const keys = Object.keys;
	/**
	 * Convert a string into a valid variable name
	 */
	function varName(s) {
	    // Replace non-alphanumeric characters (anything besides a-zA-Z0-9_) with _
	    const alphanumericS = s.replace(/\W/g, '_');
	    // Add _ if the string has leading numbers.
	    return (s.match(/^\d+/) ? '_' : '') + alphanumericS;
	}
	function titlecase(s) {
	    return s.charAt(0).toUpperCase() + s.substr(1);
	}
	/**
	 * Return access with datum to the flattened field.
	 *
	 * @param path The field name.
	 * @param datum The string to use for `datum`.
	 */
	function flatAccessWithDatum(path, datum = 'datum') {
	    return `${datum}[${$(splitAccessPath(path).join('.'))}]`;
	}
	/**
	 * Replaces path accesses with access to non-nested field.
	 * For example, `foo["bar"].baz` becomes `foo\\.bar\\.baz`.
	 */
	function replacePathInField(path) {
	    return `${splitAccessPath(path)
        .map(p => p.replace('.', '\\.'))
        .join('\\.')}`;
	}
	/**
	 * This is a replacement for chained || for numeric properties or properties that respect null so that 0 will be included.
	 */
	function getFirstDefined(...args) {
	    for (const arg of args) {
	        if (arg !== undefined) {
	            return arg;
	        }
	    }
	    return undefined;
	}
	function internalField(name) {
	    return isInternalField(name) ? name : `__${name}`;
	}
	function isInternalField(name) {
	    return name.indexOf('__') === 0;
	}

	const AREA = 'area';
	const BAR = 'bar';
	const LINE = 'line';
	const POINT = 'point';
	const RECT = 'rect';
	const RULE = 'rule';
	const TEXT = 'text';
	const TICK = 'tick';
	const TRAIL = 'trail';
	const CIRCLE = 'circle';
	const SQUARE = 'square';
	const GEOSHAPE = 'geoshape';
	// Using mapped type to declare index, ensuring we always have all marks when we add more.
	const MARK_INDEX = {
	    area: 1,
	    bar: 1,
	    line: 1,
	    point: 1,
	    text: 1,
	    tick: 1,
	    trail: 1,
	    rect: 1,
	    geoshape: 1,
	    rule: 1,
	    circle: 1,
	    square: 1
	};
	function isMark(m) {
	    return !!MARK_INDEX[m];
	}
	function isPathMark(m) {
	    return contains(['line', 'area', 'trail'], m);
	}
	const PRIMITIVE_MARKS = keys(MARK_INDEX);
	function isMarkDef(mark) {
	    return mark['type'];
	}
	const PRIMITIVE_MARK_INDEX = toSet(PRIMITIVE_MARKS);
	function isPrimitiveMark(mark) {
	    const markType = isMarkDef(mark) ? mark.type : mark;
	    return markType in PRIMITIVE_MARK_INDEX;
	}
	const STROKE_CONFIG = [
	    'stroke',
	    'strokeWidth',
	    'strokeDash',
	    'strokeDashOffset',
	    'strokeOpacity',
	    'strokeJoin',
	    'strokeMiterLimit'
	];
	const FILL_CONFIG = ['fill', 'fillOpacity'];
	const FILL_STROKE_CONFIG = [].concat(STROKE_CONFIG, FILL_CONFIG);
	const VL_ONLY_MARK_CONFIG_PROPERTIES = ['filled', 'color', 'tooltip'];
	const VL_ONLY_MARK_SPECIFIC_CONFIG_PROPERTY_INDEX = {
	    area: ['line', 'point'],
	    bar: ['binSpacing', 'continuousBandSize', 'discreteBandSize'],
	    rect: ['binSpacing', 'continuousBandSize', 'discreteBandSize'],
	    line: ['point'],
	    text: ['shortTimeLabels'],
	    tick: ['bandSize', 'thickness']
	};
	const defaultMarkConfig = {
	    color: '#4c78a8',
	    tooltip: { content: 'encoding' }
	};
	const DEFAULT_RECT_BAND_SIZE = 5;
	const defaultBarConfig = {
	    binSpacing: 1,
	    continuousBandSize: DEFAULT_RECT_BAND_SIZE
	};
	const defaultRectConfig = {
	    binSpacing: 0,
	    continuousBandSize: DEFAULT_RECT_BAND_SIZE
	};
	const defaultTickConfig = {
	    thickness: 1
	};
	function getMarkType(m) {
	    return isMarkDef(m) ? m.type : m;
	}

	var mark = /*#__PURE__*/Object.freeze({
		__proto__: null,
		AREA: AREA,
		BAR: BAR,
		LINE: LINE,
		POINT: POINT,
		RECT: RECT,
		RULE: RULE,
		TEXT: TEXT,
		TICK: TICK,
		TRAIL: TRAIL,
		CIRCLE: CIRCLE,
		SQUARE: SQUARE,
		GEOSHAPE: GEOSHAPE,
		isMark: isMark,
		isPathMark: isPathMark,
		PRIMITIVE_MARKS: PRIMITIVE_MARKS,
		isMarkDef: isMarkDef,
		isPrimitiveMark: isPrimitiveMark,
		STROKE_CONFIG: STROKE_CONFIG,
		FILL_CONFIG: FILL_CONFIG,
		FILL_STROKE_CONFIG: FILL_STROKE_CONFIG,
		VL_ONLY_MARK_CONFIG_PROPERTIES: VL_ONLY_MARK_CONFIG_PROPERTIES,
		VL_ONLY_MARK_SPECIFIC_CONFIG_PROPERTY_INDEX: VL_ONLY_MARK_SPECIFIC_CONFIG_PROPERTY_INDEX,
		defaultMarkConfig: defaultMarkConfig,
		defaultBarConfig: defaultBarConfig,
		defaultRectConfig: defaultRectConfig,
		defaultTickConfig: defaultTickConfig,
		getMarkType: getMarkType
	});

	var PlotView_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.PlotView = void 0;


	class PlotView extends View_1.View {
	    constructor(parent = null) {
	        super([], null, parent);
	        this.mark = null;
	    }
	    get type() {
	        if (mark.isPrimitiveMark(this.mark)) {
	            return this.mark;
	        }
	        else if (mark.isMarkDef(this.mark)) {
	            return this.mark.type;
	        }
	    }
	    set type(type) {
	        if (this.mark === null) {
	            this.mark = type;
	        }
	        else {
	            if (mark.isPrimitiveMark(this.mark)) {
	                this.mark = type;
	            }
	            else if (mark.isMarkDef(this.mark)) {
	                this.mark.type = type;
	            }
	        }
	    }
	}
	exports.PlotView = PlotView;
	});

	unwrapExports(PlotView_1);
	PlotView_1.PlotView;

	var CompositionView_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.CompositionView = void 0;

	class CompositionView extends View_1.View {
	    constructor(composition, visualElements, parent = null) {
	        super(visualElements, composition, parent);
	    }
	}
	exports.CompositionView = CompositionView;
	});

	unwrapExports(CompositionView_1);
	CompositionView_1.CompositionView;

	var ConcatView_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ConcatView = void 0;

	class ConcatView extends CompositionView_1.CompositionView {
	    constructor(visualElements, parent = null) {
	        super('concatenate', visualElements, parent);
	        this.isVertical = true;
	        this.isWrappable = false;
	    }
	}
	exports.ConcatView = ConcatView;
	});

	unwrapExports(ConcatView_1);
	ConcatView_1.ConcatView;

	var FacetView_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.FacetView = void 0;

	class FacetView extends CompositionView_1.CompositionView {
	    constructor(visualElements, parent = null) {
	        super('facet', visualElements, parent);
	        this.isInlineFacetted = false;
	    }
	}
	exports.FacetView = FacetView;
	});

	unwrapExports(FacetView_1);
	FacetView_1.FacetView;

	var LayerView_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.LayerView = void 0;

	class LayerView extends CompositionView_1.CompositionView {
	    constructor(visualElements, parent = null) {
	        super('overlay', visualElements, parent);
	        this.groupEncodings = new Map();
	    }
	}
	exports.LayerView = LayerView;
	});

	unwrapExports(LayerView_1);
	LayerView_1.LayerView;

	var RepeatView_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.RepeatView = void 0;

	class RepeatView extends CompositionView_1.CompositionView {
	    constructor(visualElements, parent = null) {
	        super('repeat', visualElements, parent);
	        this.repeat = {};
	    }
	}
	exports.RepeatView = RepeatView;
	});

	unwrapExports(RepeatView_1);
	RepeatView_1.RepeatView;

	function isUrlData(data) {
	    return !!data['url'];
	}
	function isInlineData(data) {
	    return !!data['values'];
	}
	function isNamedData(data) {
	    return !!data['name'] && !isUrlData(data) && !isInlineData(data) && !isGenerator(data);
	}
	function isGenerator(data) {
	    return data && (isSequenceGenerator(data) || isSphereGenerator(data) || isGraticuleGenerator(data));
	}
	function isSequenceGenerator(data) {
	    return !!data['sequence'];
	}
	function isSphereGenerator(data) {
	    return !!data['sphere'];
	}
	function isGraticuleGenerator(data) {
	    return !!data['graticule'];
	}
	const MAIN = 'main';
	const RAW = 'raw';

	var data = /*#__PURE__*/Object.freeze({
		__proto__: null,
		isUrlData: isUrlData,
		isInlineData: isInlineData,
		isNamedData: isNamedData,
		isGenerator: isGenerator,
		isSequenceGenerator: isSequenceGenerator,
		isSphereGenerator: isSphereGenerator,
		isGraticuleGenerator: isGraticuleGenerator,
		MAIN: MAIN,
		RAW: RAW
	});

	function isAnyConcatSpec(spec) {
	    return isVConcatSpec(spec) || isHConcatSpec(spec) || isConcatSpec(spec);
	}
	function isConcatSpec(spec) {
	    return spec['concat'] !== undefined;
	}
	function isVConcatSpec(spec) {
	    return spec['vconcat'] !== undefined;
	}
	function isHConcatSpec(spec) {
	    return spec['hconcat'] !== undefined;
	}

	var concat = /*#__PURE__*/Object.freeze({
		__proto__: null,
		isAnyConcatSpec: isAnyConcatSpec,
		isConcatSpec: isConcatSpec,
		isVConcatSpec: isVConcatSpec,
		isHConcatSpec: isHConcatSpec
	});

	function isFacetFieldDef(channelDef) {
	    return !!channelDef && !!channelDef['header'];
	}
	function isFacetSpec(spec) {
	    return spec['facet'] !== undefined;
	}

	function isLayerSpec(spec) {
	    return spec['layer'] !== undefined;
	}

	function isRepeatSpec(spec) {
	    return spec['repeat'] !== undefined;
	}

	function isUnitSpec(spec) {
	    return !!spec['mark'];
	}

	/**
	 * Definition for specifications in Vega-Lite.  In general, there are 3 variants of specs for each type of specs:
	 * - Generic specs are generic versions of specs and they are parameterized differently for internal and external specs.
	 * - The external specs (no prefix) would allow composite marks, row/column encodings, and mark macros like point/line overlay.
	 * - The internal specs (with `Normalized` prefix) would only support primitive marks and support no macros/shortcuts.
	 */

	var spec = /*#__PURE__*/Object.freeze({
		__proto__: null,
		isAnyConcatSpec: isAnyConcatSpec,
		isHConcatSpec: isHConcatSpec,
		isVConcatSpec: isVConcatSpec,
		isFacetSpec: isFacetSpec,
		isLayerSpec: isLayerSpec,
		isRepeatSpec: isRepeatSpec,
		isUnitSpec: isUnitSpec
	});

	var MarkEncoding = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.markEncodingGroups = exports.markEncodings = exports.facetChannelEncodings = exports.loDChannelEncodings = exports.orderChannelEncodings = exports.keyChannelEncodings = exports.hyperLinkChannelEncodings = exports.textTooltipChannelEncodings = exports.markPropertiesChannelEncodings = exports.geographicPositionEncodings = exports.positionEncodings = void 0;
	exports.positionEncodings = ['x', 'y', 'x2', 'y2'];
	exports.geographicPositionEncodings = ['longitude', 'latitude'];
	exports.markPropertiesChannelEncodings = [
	    'filled', 'color', 'fill', 'stroke', 'opacity', 'fillOpacity', 'strokeOpacity', 'size', 'shape',
	    'strokeCap', 'strokeDash', 'strokeDashOffset', 'strokeJoin', 'strokeMiterLimit', 'strokeWidth'
	];
	exports.textTooltipChannelEncodings = ['text', 'tooltip'];
	exports.hyperLinkChannelEncodings = ['href', 'cursor'];
	exports.keyChannelEncodings = ['key'];
	exports.orderChannelEncodings = ['order'];
	exports.loDChannelEncodings = ['detail'];
	exports.facetChannelEncodings = ['facet', 'row', 'column'];
	exports.markEncodings = exports.positionEncodings
	    .concat(exports.geographicPositionEncodings)
	    .concat(exports.markPropertiesChannelEncodings)
	    .concat(exports.textTooltipChannelEncodings)
	    .concat(exports.hyperLinkChannelEncodings)
	    .concat(exports.orderChannelEncodings)
	    .concat(exports.loDChannelEncodings)
	    .concat(exports.facetChannelEncodings);
	exports.markEncodingGroups = [
	    'position', 'geographic', 'mark property', 'text tooltip', 'hyperlink', 'key channel',
	    'order channel', 'lod channel', 'facet channel'
	];
	});

	unwrapExports(MarkEncoding);
	MarkEncoding.markEncodingGroups;
	MarkEncoding.markEncodings;
	MarkEncoding.facetChannelEncodings;
	MarkEncoding.loDChannelEncodings;
	MarkEncoding.orderChannelEncodings;
	MarkEncoding.keyChannelEncodings;
	MarkEncoding.hyperLinkChannelEncodings;
	MarkEncoding.textTooltipChannelEncodings;
	MarkEncoding.markPropertiesChannelEncodings;
	MarkEncoding.geographicPositionEncodings;
	MarkEncoding.positionEncodings;

	var SpecUtils = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.setSchemaSize = exports.getAbstraction = exports.getAllDatasetsInHierarchy = exports.getJoinedDatasetsOfChildNodes = exports.setSingleViewProperties = exports.getAtomicAbstraction = exports.getMarkPropertiesAsMap = exports.getConcatAbstraction = exports.getFacetAbstraction = exports.getRepeatAbstraction = exports.getLayerAbstraction = exports.getCompositionType = exports.isPlotSchema = exports.isCompositionSchema = exports.isFacetSchema = exports.isInlineFacetSchema = exports.isConcatenateSchema = exports.isRepeatSchema = exports.isOverlaySchema = exports.isAtomicSchema = void 0;



	function isAtomicSchema(schema) {
	    return spec.isUnitSpec(schema) && !isFacetSchema(schema);
	}
	exports.isAtomicSchema = isAtomicSchema;
	function isOverlaySchema(schema) {
	    return spec.isLayerSpec(schema);
	}
	exports.isOverlaySchema = isOverlaySchema;
	function isRepeatSchema(schema) {
	    return spec.isRepeatSpec(schema);
	}
	exports.isRepeatSchema = isRepeatSchema;
	function isConcatenateSchema(schema) {
	    return spec.isAnyConcatSpec(schema) || concat.isConcatSpec(schema);
	}
	exports.isConcatenateSchema = isConcatenateSchema;
	function isInlineFacetSchema(schema) {
	    return (schema.encoding !== undefined && schema.encoding.facet !== undefined);
	}
	exports.isInlineFacetSchema = isInlineFacetSchema;
	function isFacetSchema(schema) {
	    return spec.isFacetSpec(schema) || isInlineFacetSchema(schema);
	}
	exports.isFacetSchema = isFacetSchema;
	function isCompositionSchema(schema) {
	    return isOverlaySchema(schema)
	        || isRepeatSchema(schema)
	        || isConcatenateSchema(schema)
	        || isFacetSchema(schema);
	}
	exports.isCompositionSchema = isCompositionSchema;
	function isPlotSchema(schema) {
	    return isAtomicSchema(schema);
	}
	exports.isPlotSchema = isPlotSchema;
	function getCompositionType(schema) {
	    if (isOverlaySchema(schema)) {
	        return 'overlay';
	    }
	    else if (isRepeatSchema(schema)) {
	        return 'repeat';
	    }
	    else if (isConcatenateSchema(schema)) {
	        return 'concatenate';
	    }
	    else if (isFacetSchema(schema)) {
	        return 'facet';
	    }
	    return null;
	}
	exports.getCompositionType = getCompositionType;
	function getLayerAbstraction(schema) {
	    const currentLayers = JSON.parse(JSON.stringify(schema.layer));
	    let currentEncoding;
	    if (schema.encoding !== undefined) {
	        currentEncoding = JSON.parse(JSON.stringify(schema.encoding));
	    }
	    delete schema.layer;
	    delete schema.encoding;
	    const abstraction = {
	        layer: currentLayers
	    };
	    if (currentEncoding !== undefined) {
	        abstraction.encoding = currentEncoding;
	    }
	    return abstraction;
	}
	exports.getLayerAbstraction = getLayerAbstraction;
	function getRepeatAbstraction(schema) {
	    const currentSpec = JSON.parse(JSON.stringify(schema.spec));
	    const currentRepeat = JSON.parse(JSON.stringify(schema.repeat));
	    const abstraction = {
	        spec: currentSpec,
	        repeat: currentRepeat
	    };
	    delete schema.spec;
	    delete schema.repeat;
	    return abstraction;
	}
	exports.getRepeatAbstraction = getRepeatAbstraction;
	function getFacetAbstraction(schema) {
	    const currentSpec = JSON.parse(JSON.stringify(schema.spec));
	    const currentFacet = JSON.parse(JSON.stringify(schema.facet));
	    const abstraction = {
	        spec: currentSpec,
	        facet: currentFacet
	    };
	    delete schema.spec;
	    delete schema.facet;
	    return abstraction;
	}
	exports.getFacetAbstraction = getFacetAbstraction;
	function getConcatAbstraction(schema) {
	    let currentConcat = null;
	    let concatProp = null;
	    if (concat.isConcatSpec(schema)) {
	        concatProp = 'concat';
	    }
	    else if (concat.isHConcatSpec(schema)) {
	        concatProp = 'hconcat';
	    }
	    else if (concat.isVConcatSpec(schema)) {
	        concatProp = 'vconcat';
	    }
	    currentConcat = JSON.parse(JSON.stringify(schema[concatProp]));
	    delete schema[concatProp];
	    const abstraction = {};
	    abstraction[concatProp] = currentConcat;
	    return abstraction;
	}
	exports.getConcatAbstraction = getConcatAbstraction;
	function getMarkPropertiesAsMap(mark) {
	    const properties = new Map();
	    // since every mark encoding could potentially be statically set for a mark, just go through
	    // all of them and find the ones that are configured
	    MarkEncoding.markEncodings.forEach(encoding => {
	        if (mark[encoding] !== undefined) {
	            properties.set(encoding, JSON.parse(JSON.stringify(mark[encoding])));
	        }
	    });
	    return properties;
	}
	exports.getMarkPropertiesAsMap = getMarkPropertiesAsMap;
	function getAtomicAbstraction(schema) {
	    const abstraction = {
	        mark: JSON.parse(JSON.stringify(schema.mark)),
	    };
	    if (schema.encoding !== undefined) {
	        abstraction.encoding = JSON.parse(JSON.stringify(schema.encoding));
	    }
	    if (schema.selection !== undefined) {
	        abstraction.selection = JSON.parse(JSON.stringify(schema.selection));
	    }
	    const staticProperties = getMarkPropertiesAsMap(schema.mark);
	    staticProperties.forEach((property, key) => {
	        abstraction[key] = property;
	        delete schema[key];
	    });
	    delete schema.mark;
	    delete schema.encoding;
	    delete schema.selection;
	    if (isRepeatSchema(schema) && abstraction.encoding !== undefined) {
	        if (abstraction.encoding.x !== undefined) {
	            abstraction.encoding.x = {
	                field: { repeat: 'column' },
	                type: abstraction.encoding.x.type
	            };
	        }
	        if (abstraction.encoding.y !== undefined) {
	            abstraction.encoding.y = {
	                field: { repeat: 'row' },
	                type: abstraction.encoding.y.type
	            };
	        }
	    }
	    else if (isFacetSchema(schema)) {
	        if (abstraction.encoding.facet !== undefined) {
	            delete abstraction.encoding.facet;
	        }
	    }
	    return abstraction;
	}
	exports.getAtomicAbstraction = getAtomicAbstraction;
	function setSingleViewProperties(schema, abstraction) {
	    if (schema.bounds !== undefined) {
	        abstraction.bounds = JSON.parse(JSON.stringify(schema.bounds));
	    }
	    if (schema.spacing !== undefined) {
	        abstraction.spacing = JSON.parse(JSON.stringify(schema.spacing));
	    }
	    if (schema.columns !== undefined) {
	        abstraction.columns = JSON.parse(JSON.stringify(schema.columns));
	    }
	    if (schema.width !== undefined) {
	        abstraction.width = JSON.parse(JSON.stringify(schema.width));
	    }
	    if (schema.height !== undefined) {
	        abstraction.height = JSON.parse(JSON.stringify(schema.height));
	    }
	    if (schema.data !== undefined) {
	        abstraction.data = JSON.parse(JSON.stringify(schema.data));
	    }
	    if (schema.datasets !== undefined) {
	        abstraction.datasets = JSON.parse(JSON.stringify(schema.datasets));
	    }
	    if (schema.transform !== undefined) {
	        abstraction.transform = JSON.parse(JSON.stringify(schema.transform));
	    }
	    if (schema.config !== undefined) {
	        abstraction.config = JSON.parse(JSON.stringify(schema.config));
	    }
	    if (schema.resolve !== undefined) {
	        abstraction.resolve = JSON.parse(JSON.stringify(schema.resolve));
	    }
	    return abstraction;
	}
	exports.setSingleViewProperties = setSingleViewProperties;
	function getJoinedDatasetsOfChildNodes(view) {
	    const joinedDatasets = {};
	    const visualElements = view.getFlatHierarchy();
	    const childDatasets = visualElements
	        .map(d => d.datasets)
	        .filter(d => d !== undefined && d !== null);
	    childDatasets.forEach(datasets => {
	        const datasetKeys = Object.keys(datasets);
	        datasetKeys.forEach(datasetKey => {
	            joinedDatasets[datasetKey] = datasets[datasetKey];
	        });
	    });
	    return joinedDatasets;
	}
	exports.getJoinedDatasetsOfChildNodes = getJoinedDatasetsOfChildNodes;
	function getAllDatasetsInHierarchy(view) {
	    const allDatasetsInHierarchy = getJoinedDatasetsOfChildNodes(view);
	    let rootView = view;
	    // only get datasets that are direct ancestors of the view, as siblings are not relevant
	    while (rootView.parent !== null) {
	        rootView = rootView.parent;
	        if (rootView.datasets) {
	            Object.keys(rootView.datasets).forEach(key => {
	                allDatasetsInHierarchy[key] = rootView.datasets[key];
	            });
	        }
	    }
	    return allDatasetsInHierarchy;
	}
	exports.getAllDatasetsInHierarchy = getAllDatasetsInHierarchy;
	function getAbstraction(schema) {
	    let abstraction = null;
	    if (isAtomicSchema(schema)) {
	        // atomic can either be content of a plot or repeat, indicated by the compositionpropety being
	        // set to 'spec'
	        abstraction = getAtomicAbstraction(schema);
	    }
	    else if (isOverlaySchema(schema)) {
	        abstraction = getLayerAbstraction(schema);
	    }
	    else if (isRepeatSchema(schema)) {
	        abstraction = getRepeatAbstraction(schema);
	    }
	    else if (isConcatenateSchema(schema)) {
	        abstraction = getConcatAbstraction(schema);
	    }
	    else if (isFacetSchema(schema)) {
	        if (isInlineFacetSchema(schema)) {
	            abstraction = getAtomicAbstraction(schema);
	        }
	        else {
	            abstraction = getFacetAbstraction(schema);
	        }
	    }
	    abstraction = setSingleViewProperties(schema, abstraction);
	    return abstraction;
	}
	exports.getAbstraction = getAbstraction;
	function setSchemaSize(schema, width, height) {
	    if (isPlotSchema(schema)) {
	        schema.width = width;
	        schema.height = height;
	    }
	    else if (isConcatenateSchema(schema)) {
	        schema.width = width;
	        schema.height = height;
	    }
	    else if (isRepeatSchema(schema)) {
	        schema.spec.width = width;
	        schema.spec.height = height;
	    }
	    else if (isFacetSchema(schema)) {
	        if (isInlineFacetSchema(schema)) {
	            schema.width = width;
	            schema.height = height;
	        }
	        else {
	            schema.spec.width = width;
	            schema.spec.height = height;
	        }
	    }
	    return schema;
	}
	exports.setSchemaSize = setSchemaSize;
	});

	unwrapExports(SpecUtils);
	SpecUtils.setSchemaSize;
	SpecUtils.getAbstraction;
	SpecUtils.getAllDatasetsInHierarchy;
	SpecUtils.getJoinedDatasetsOfChildNodes;
	SpecUtils.setSingleViewProperties;
	SpecUtils.getAtomicAbstraction;
	SpecUtils.getMarkPropertiesAsMap;
	SpecUtils.getConcatAbstraction;
	SpecUtils.getFacetAbstraction;
	SpecUtils.getRepeatAbstraction;
	SpecUtils.getLayerAbstraction;
	SpecUtils.getCompositionType;
	SpecUtils.isPlotSchema;
	SpecUtils.isCompositionSchema;
	SpecUtils.isFacetSchema;
	SpecUtils.isInlineFacetSchema;
	SpecUtils.isConcatenateSchema;
	SpecUtils.isRepeatSchema;
	SpecUtils.isOverlaySchema;
	SpecUtils.isAtomicSchema;

	var GraphNode_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.GraphNode = void 0;
	class GraphNode {
	    constructor() {
	        this.id = `node${Math.floor(Math.random() * 1000000)}`;
	        this.myName = '';
	        this.parent = null;
	        this.children = [];
	    }
	    getAllChildNodes() {
	        const allChildNodes = this.children.map(n => n);
	        this.children.forEach(childNode => {
	            allChildNodes.push(...childNode.getAllChildNodes());
	        });
	        return allChildNodes;
	    }
	    getFullAncestry() {
	        const allParentNodes = [this];
	        let workingNode = this.parent;
	        if (this.parent === null) {
	            return allParentNodes;
	        }
	        // go up in the node's hierarchy as far as possible
	        while (workingNode !== null) {
	            allParentNodes.push(workingNode);
	            workingNode = workingNode.parent;
	        }
	        return allParentNodes.reverse();
	    }
	    get name() {
	        if (this.myName.length === 0) {
	            return this.id;
	        }
	        return this.myName;
	    }
	    set name(name) {
	        if (name === undefined) {
	            return;
	        }
	        this.myName = name;
	    }
	}
	exports.GraphNode = GraphNode;
	});

	unwrapExports(GraphNode_1);
	GraphNode_1.GraphNode;

	var DatasetNode_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.DatasetNode = void 0;

	class DatasetNode extends GraphNode_1.GraphNode {
	    constructor() {
	        super();
	        this.fields = [];
	        this.values = [];
	    }
	    getTransform() {
	        // datasets are roots in a data graph and therefore do not have parent or child transforms
	        return [];
	    }
	}
	exports.DatasetNode = DatasetNode;
	});

	unwrapExports(DatasetNode_1);
	DatasetNode_1.DatasetNode;

	var TranformNode = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.TransformNode = void 0;


	class TransformNode extends GraphNode_1.GraphNode {
	    getRootDatasetNode() {
	        if (this.parent === null) {
	            return null;
	        }
	        let workingNode = this.parent;
	        // go up in the node's hierarchy as far as possible
	        while (workingNode.parent !== null) {
	            workingNode = workingNode.parent;
	        }
	        if (!(workingNode instanceof DatasetNode_1.DatasetNode)) {
	            return null;
	        }
	        return workingNode;
	    }
	    getSchema() {
	        const rootDataset = this.getRootDatasetNode();
	        return rootDataset.getSchema();
	    }
	    setSchema(data) {
	        return;
	    }
	    getTransform() {
	        const transformNodesOnPathToRoot = this.getFullAncestry();
	        const transforms = transformNodesOnPathToRoot
	            .filter(n => n instanceof TransformNode)
	            .map((n) => n.transform);
	        return transforms;
	    }
	}
	exports.TransformNode = TransformNode;
	});

	unwrapExports(TranformNode);
	TranformNode.TransformNode;

	var TransformTypes = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.transformNames = void 0;
	exports.transformNames = ['aggregate', 'bin', 'calculate', 'filter', 'flatten',
	    'fold', 'impute', 'join aggregate', 'lookup', 'sample', 'stack', 'time unit'];
	});

	unwrapExports(TransformTypes);
	TransformTypes.transformNames;

	var InlineDatasetNode_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.InlineDatasetNode = void 0;

	class InlineDatasetNode extends DatasetNode_1.DatasetNode {
	    getSchema() {
	        return {
	            name: this.name,
	            values: this.values,
	            format: this.format
	        };
	    }
	    setSchema(data) {
	        this.name = data.name;
	        this.values = data.values;
	        this.format = data.format;
	    }
	}
	exports.InlineDatasetNode = InlineDatasetNode;
	});

	unwrapExports(InlineDatasetNode_1);
	InlineDatasetNode_1.InlineDatasetNode;

	var NamedDataSourceNode_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.NamedDataSourceNode = void 0;

	class NamedDataSourceNode extends DatasetNode_1.DatasetNode {
	    getSchema() {
	        return {
	            name: this.name,
	            format: this.format
	        };
	    }
	    setSchema(data) {
	        this.name = data.name;
	        this.format = data.format;
	    }
	}
	exports.NamedDataSourceNode = NamedDataSourceNode;
	});

	unwrapExports(NamedDataSourceNode_1);
	NamedDataSourceNode_1.NamedDataSourceNode;

	var URLDatasetNode_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.URLDatasetNode = void 0;

	class URLDatasetNode extends DatasetNode_1.DatasetNode {
	    getSchema() {
	        return {
	            name: this.name,
	            url: this.url,
	            format: this.format
	        };
	    }
	    setSchema(data) {
	        this.name = data.name;
	        this.url = data.url;
	        this.format = data.format;
	    }
	}
	exports.URLDatasetNode = URLDatasetNode;
	});

	unwrapExports(URLDatasetNode_1);
	URLDatasetNode_1.URLDatasetNode;

	var EOL = {},
	    EOF = {},
	    QUOTE = 34,
	    NEWLINE = 10,
	    RETURN = 13;

	function objectConverter(columns) {
	  return new Function("d", "return {" + columns.map(function(name, i) {
	    return JSON.stringify(name) + ": d[" + i + "] || \"\"";
	  }).join(",") + "}");
	}

	function customConverter(columns, f) {
	  var object = objectConverter(columns);
	  return function(row, i) {
	    return f(object(row), i, columns);
	  };
	}

	// Compute unique columns in order of discovery.
	function inferColumns(rows) {
	  var columnSet = Object.create(null),
	      columns = [];

	  rows.forEach(function(row) {
	    for (var column in row) {
	      if (!(column in columnSet)) {
	        columns.push(columnSet[column] = column);
	      }
	    }
	  });

	  return columns;
	}

	function pad(value, width) {
	  var s = value + "", length = s.length;
	  return length < width ? new Array(width - length + 1).join(0) + s : s;
	}

	function formatYear(year) {
	  return year < 0 ? "-" + pad(-year, 6)
	    : year > 9999 ? "+" + pad(year, 6)
	    : pad(year, 4);
	}

	function formatDate(date) {
	  var hours = date.getUTCHours(),
	      minutes = date.getUTCMinutes(),
	      seconds = date.getUTCSeconds(),
	      milliseconds = date.getUTCMilliseconds();
	  return isNaN(date) ? "Invalid Date"
	      : formatYear(date.getUTCFullYear()) + "-" + pad(date.getUTCMonth() + 1, 2) + "-" + pad(date.getUTCDate(), 2)
	      + (milliseconds ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "." + pad(milliseconds, 3) + "Z"
	      : seconds ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "Z"
	      : minutes || hours ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + "Z"
	      : "");
	}

	function dsv(delimiter) {
	  var reFormat = new RegExp("[\"" + delimiter + "\n\r]"),
	      DELIMITER = delimiter.charCodeAt(0);

	  function parse(text, f) {
	    var convert, columns, rows = parseRows(text, function(row, i) {
	      if (convert) return convert(row, i - 1);
	      columns = row, convert = f ? customConverter(row, f) : objectConverter(row);
	    });
	    rows.columns = columns || [];
	    return rows;
	  }

	  function parseRows(text, f) {
	    var rows = [], // output rows
	        N = text.length,
	        I = 0, // current character index
	        n = 0, // current line number
	        t, // current token
	        eof = N <= 0, // current token followed by EOF?
	        eol = false; // current token followed by EOL?

	    // Strip the trailing newline.
	    if (text.charCodeAt(N - 1) === NEWLINE) --N;
	    if (text.charCodeAt(N - 1) === RETURN) --N;

	    function token() {
	      if (eof) return EOF;
	      if (eol) return eol = false, EOL;

	      // Unescape quotes.
	      var i, j = I, c;
	      if (text.charCodeAt(j) === QUOTE) {
	        while (I++ < N && text.charCodeAt(I) !== QUOTE || text.charCodeAt(++I) === QUOTE);
	        if ((i = I) >= N) eof = true;
	        else if ((c = text.charCodeAt(I++)) === NEWLINE) eol = true;
	        else if (c === RETURN) { eol = true; if (text.charCodeAt(I) === NEWLINE) ++I; }
	        return text.slice(j + 1, i - 1).replace(/""/g, "\"");
	      }

	      // Find next delimiter or newline.
	      while (I < N) {
	        if ((c = text.charCodeAt(i = I++)) === NEWLINE) eol = true;
	        else if (c === RETURN) { eol = true; if (text.charCodeAt(I) === NEWLINE) ++I; }
	        else if (c !== DELIMITER) continue;
	        return text.slice(j, i);
	      }

	      // Return last token before EOF.
	      return eof = true, text.slice(j, N);
	    }

	    while ((t = token()) !== EOF) {
	      var row = [];
	      while (t !== EOL && t !== EOF) row.push(t), t = token();
	      if (f && (row = f(row, n++)) == null) continue;
	      rows.push(row);
	    }

	    return rows;
	  }

	  function preformatBody(rows, columns) {
	    return rows.map(function(row) {
	      return columns.map(function(column) {
	        return formatValue(row[column]);
	      }).join(delimiter);
	    });
	  }

	  function format(rows, columns) {
	    if (columns == null) columns = inferColumns(rows);
	    return [columns.map(formatValue).join(delimiter)].concat(preformatBody(rows, columns)).join("\n");
	  }

	  function formatBody(rows, columns) {
	    if (columns == null) columns = inferColumns(rows);
	    return preformatBody(rows, columns).join("\n");
	  }

	  function formatRows(rows) {
	    return rows.map(formatRow).join("\n");
	  }

	  function formatRow(row) {
	    return row.map(formatValue).join(delimiter);
	  }

	  function formatValue(value) {
	    return value == null ? ""
	        : value instanceof Date ? formatDate(value)
	        : reFormat.test(value += "") ? "\"" + value.replace(/"/g, "\"\"") + "\""
	        : value;
	  }

	  return {
	    parse: parse,
	    parseRows: parseRows,
	    format: format,
	    formatBody: formatBody,
	    formatRows: formatRows,
	    formatRow: formatRow,
	    formatValue: formatValue
	  };
	}

	var csv = dsv(",");

	var csvParse = csv.parse;
	var csvParseRows = csv.parseRows;
	var csvFormat = csv.format;
	var csvFormatBody = csv.formatBody;
	var csvFormatRows = csv.formatRows;
	var csvFormatRow = csv.formatRow;
	var csvFormatValue = csv.formatValue;

	var tsv = dsv("\t");

	var tsvParse = tsv.parse;
	var tsvParseRows = tsv.parseRows;
	var tsvFormat = tsv.format;
	var tsvFormatBody = tsv.formatBody;
	var tsvFormatRows = tsv.formatRows;
	var tsvFormatRow = tsv.formatRow;
	var tsvFormatValue = tsv.formatValue;

	function autoType(object) {
	  for (var key in object) {
	    var value = object[key].trim(), number, m;
	    if (!value) value = null;
	    else if (value === "true") value = true;
	    else if (value === "false") value = false;
	    else if (value === "NaN") value = NaN;
	    else if (!isNaN(number = +value)) value = number;
	    else if (m = value.match(/^([-+]\d{2})?\d{4}(-\d{2}(-\d{2})?)?(T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?(Z|[-+]\d{2}:\d{2})?)?$/)) {
	      if (fixtz && !!m[4] && !m[7]) value = value.replace(/-/g, "/").replace(/T/, " ");
	      value = new Date(value);
	    }
	    else continue;
	    object[key] = value;
	  }
	  return object;
	}

	// https://github.com/d3/d3-dsv/issues/45
	var fixtz = new Date("2019-01-01T00:00").getHours() || new Date("2019-07-01T00:00").getHours();

	var src = /*#__PURE__*/Object.freeze({
		__proto__: null,
		dsvFormat: dsv,
		csvParse: csvParse,
		csvParseRows: csvParseRows,
		csvFormat: csvFormat,
		csvFormatBody: csvFormatBody,
		csvFormatRows: csvFormatRows,
		csvFormatRow: csvFormatRow,
		csvFormatValue: csvFormatValue,
		tsvParse: tsvParse,
		tsvParseRows: tsvParseRows,
		tsvFormat: tsvFormat,
		tsvFormatBody: tsvFormatBody,
		tsvFormatRows: tsvFormatRows,
		tsvFormatRow: tsvFormatRow,
		tsvFormatValue: tsvFormatValue,
		autoType: autoType
	});

	var DataImporter_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.DataImporter = void 0;




	class DataImporter {
	    constructor() {
	        this.onNewDataset = null;
	        this.datasets = new Map();
	    }
	    getFileNameFromURL(url) {
	        let name = url;
	        // trim off the file type and use the string before it in the url
	        if (url.includes('.json')) {
	            name = url.match(/\/(\w+)\.json/)[1];
	        }
	        else if (url.includes('.csv')) {
	            name = url.match(/(\w+)\.csv/)[1];
	        }
	        return name;
	    }
	    // adapted from https://stackoverflow.com/a/26298948
	    readFileFromDisk(e) {
	        const file = e.target.files[0];
	        if (!file) {
	            return;
	        }
	        const reader = new FileReader();
	        reader.onload = (onloadEvent) => {
	            const contents = onloadEvent.target;
	            this.convertCSVToDatasetNode(contents.result);
	        };
	        reader.readAsText(file);
	    }
	    convertCSVToDatasetNode(contents) {
	        const csvContent = src.csvParse(contents);
	        const datasetNode = new InlineDatasetNode_1.InlineDatasetNode();
	        datasetNode.fields = csvContent.columns;
	        datasetNode.name = 'new Dataset';
	        datasetNode.values = csvContent;
	        if (this.onNewDataset !== null) {
	            this.onNewDataset(datasetNode);
	        }
	    }
	    fetchCSV(preset, urlNode = new URLDatasetNode_1.URLDatasetNode()) {
	        const reader = new FileReader();
	        const node = new InlineDatasetNode_1.InlineDatasetNode();
	        reader.onloadend = (e) => {
	            const dataArray = src.csvParse(e.srcElement.result);
	            node.fields = Object.keys(dataArray[0]);
	            node.values = dataArray;
	            node.name = this.getFileNameFromURL(preset.url);
	            this.datasets.set(urlNode.url, node);
	            if (this.onNewDataset !== null) {
	                this.onNewDataset(node);
	            }
	        };
	        fetch(preset.url)
	            .then(res => res.blob())
	            .then(blob => reader.readAsText(blob));
	    }
	    fetchJSON(preset, urlNode = new URLDatasetNode_1.URLDatasetNode()) {
	        const node = new InlineDatasetNode_1.InlineDatasetNode();
	        fetch(preset.url)
	            .then(response => response.json())
	            .then(dataArray => {
	            node.fields = Object.keys(dataArray[0]);
	            node.values = dataArray;
	            node.name = this.getFileNameFromURL(preset.url);
	            node.format = preset.format;
	            this.datasets.set(urlNode.url, node);
	            if (this.onNewDataset !== null) {
	                this.onNewDataset(node);
	            }
	        });
	    }
	    importPreset(preset, node) {
	        if (this.datasets.get(preset.url) !== undefined) {
	            return;
	        }
	        if (preset.url.includes('.json')) {
	            this.fetchJSON(preset, node);
	        }
	        else if (preset.url.includes('.csv')) {
	            this.fetchCSV(preset, node);
	        }
	    }
	    loadFieldsAndValuesToNode(node) {
	        if (node instanceof URLDatasetNode_1.URLDatasetNode) {
	            this.importPreset(node.getSchema(), node);
	        }
	        else if (node instanceof InlineDatasetNode_1.InlineDatasetNode) {
	            const values = node.values;
	            if (values === undefined || values.length === 0) {
	                return;
	            }
	            node.fields = Object.keys(values[0]);
	        }
	        else if (node instanceof TranformNode.TransformNode) {
	            const rootDatasetNode = node.getRootDatasetNode();
	            if (rootDatasetNode !== null) {
	                this.loadFieldsAndValuesToNode(rootDatasetNode);
	            }
	        }
	    }
	}
	exports.DataImporter = DataImporter;
	});

	unwrapExports(DataImporter_1);
	DataImporter_1.DataImporter;

	var DataModel = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });

	Object.defineProperty(exports, "GraphNode", { enumerable: true, get: function () { return GraphNode_1.GraphNode; } });

	Object.defineProperty(exports, "TransformNode", { enumerable: true, get: function () { return TranformNode.TransformNode; } });

	Object.defineProperty(exports, "transformNames", { enumerable: true, get: function () { return TransformTypes.transformNames; } });

	Object.defineProperty(exports, "DatasetNode", { enumerable: true, get: function () { return DatasetNode_1.DatasetNode; } });

	Object.defineProperty(exports, "InlineDatasetNode", { enumerable: true, get: function () { return InlineDatasetNode_1.InlineDatasetNode; } });

	Object.defineProperty(exports, "NamedDataSourceNode", { enumerable: true, get: function () { return NamedDataSourceNode_1.NamedDataSourceNode; } });

	Object.defineProperty(exports, "URLDatasetNode", { enumerable: true, get: function () { return URLDatasetNode_1.URLDatasetNode; } });

	Object.defineProperty(exports, "DataImporter", { enumerable: true, get: function () { return DataImporter_1.DataImporter; } });
	});

	unwrapExports(DataModel);

	var SpecCompiler_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.SpecCompiler = void 0;









	class SpecCompiler {
	    getBasicSchema(view) {
	        // check for empty views, which should also generate valid specs
	        if (view && view.visualElements.length === 0 && view.parent === null) {
	            return {
	                $schema: 'https://vega.github.io/schema/vega-lite/v3.json',
	                mark: 'area',
	                encoding: {}
	            };
	        }
	        return {
	            $schema: 'https://vega.github.io/schema/vega-lite/v3.json'
	        };
	    }
	    setCompositionProperties(schema, view) {
	        if (view.columns !== undefined) {
	            schema.columns = view.columns;
	        }
	        if (view.spacing !== undefined) {
	            schema.spacing = view.spacing;
	        }
	        return schema;
	    }
	    setToplevelProperties(schema, view, includeData = true) {
	        if (includeData && !!view.data) {
	            schema.data = view.data;
	            const dataNode = view.dataTransformationNode;
	            if (dataNode instanceof DataModel.TransformNode) {
	                schema.transform = dataNode.getTransform();
	            }
	            else if (dataNode instanceof DataModel.DatasetNode) {
	                schema.transform = dataNode.getAllChildNodes().map(node => node.transform);
	            }
	        }
	        if (includeData && !!view.datasets) {
	            schema.datasets = view.datasets;
	        }
	        if (view.bounds !== undefined) {
	            schema.bounds = view.bounds;
	        }
	        if (view.height !== undefined) {
	            schema.height = view.height;
	        }
	        if (view.width !== undefined) {
	            schema.width = view.width;
	        }
	        if (view.config !== undefined) {
	            schema.config = view.config;
	        }
	        if (view.projection !== undefined) {
	            schema.projection = view.projection;
	        }
	        if (view instanceof CompositionView_1.CompositionView) {
	            schema = this.setCompositionProperties(schema, view);
	        }
	        return schema;
	    }
	    getRootView(view) {
	        let workingNode = view;
	        while (workingNode.parent !== null) {
	            workingNode = workingNode.parent;
	        }
	        return workingNode;
	    }
	    abstractCompositions(schema, compositionProperty) {
	        const abstraction = SpecUtils.getAbstraction(schema);
	        if (compositionProperty === 'spec' || compositionProperty === 'facet') {
	            schema[compositionProperty] = abstraction;
	        }
	        else {
	            schema[compositionProperty] = [abstraction];
	        }
	        return schema;
	    }
	    applyRepeatLayout(view, schema) {
	        schema = this.abstractCompositions(schema, 'spec');
	        // parent must be repeat view to reach this branch
	        schema.repeat = view.parent.repeat;
	        return schema;
	    }
	    applyFacetLayout(view, schema) {
	        const parentView = view.parent;
	        if (parentView.isInlineFacetted) {
	            if (schema.encoding === undefined) {
	                schema.encoding = {};
	            }
	            schema.encoding.facet = parentView.facet;
	        }
	        else {
	            schema = this.abstractCompositions(schema, 'spec');
	            schema.facet = parentView.facet;
	        }
	        return schema;
	    }
	    applyConcatLayout(schema) {
	        return this.abstractCompositions(schema, 'hconcat');
	    }
	    applyOverlayLayout(schema) {
	        return this.abstractCompositions(schema, 'layer');
	    }
	    applyCompositionLayout(view, schema, composition) {
	        if (composition === 'repeat') {
	            this.applyRepeatLayout(view, schema);
	        }
	        else if (composition === 'facet') {
	            this.applyFacetLayout(view, schema);
	        }
	        else if (composition === 'concatenate') {
	            this.applyConcatLayout(schema);
	        }
	        else if (composition === 'overlay') {
	            this.applyOverlayLayout(schema);
	        }
	        return schema;
	    }
	    getDataInHierarchy(view) {
	        // data can be stored either in a child node or on the top level view, therefore find the
	        // top level, get its flat hierarchy and find a view with a dataset bound to it
	        let topLevelView = view;
	        let data = null;
	        while (topLevelView.parent !== null) {
	            if (topLevelView.data !== undefined && topLevelView.data !== null) {
	                data = topLevelView.data;
	                return data;
	            }
	            topLevelView = topLevelView.parent;
	        }
	        const flatHierarchy = topLevelView.getFlatHierarchy();
	        const dataView = flatHierarchy.find(t => {
	            return t.data !== null && t.data !== undefined;
	        });
	        // could occur when view has no parent, no visualelements and no data (i.e. is "empty")
	        if (dataView === undefined) {
	            return {
	                values: [],
	            };
	        }
	        data = dataView.data;
	        return data;
	    }
	    getDatasetsInAncestry(view) {
	        // if the view references a namedDataset, also include that dataset.
	        if (view.data !== null && !data.isNamedData(view.data)) {
	            return null;
	        }
	        let workingNode = view;
	        while (workingNode !== null && (workingNode.datasets === null || workingNode.datasets === undefined)) {
	            workingNode = workingNode.parent;
	        }
	        if (workingNode === null) {
	            return null;
	        }
	        return workingNode.datasets;
	    }
	    getRepeatSpec(parentView) {
	        const view = parentView.visualElements[0];
	        const layout = parentView.layout;
	        let schema = null;
	        schema = this.getVegaSpecification(view, false);
	        if (schema !== null) {
	            schema = this.applyCompositionLayout(view, schema, layout);
	        }
	        return schema;
	    }
	    getFacetSpec(parentView) {
	        const encodingView = parentView.visualElements[0];
	        let schema = null;
	        // use the encodings from the child view, then apply facetting properties
	        schema = this.getVegaSpecification(encodingView, false);
	        schema = this.applyCompositionLayout(encodingView, schema, 'facet');
	        return schema;
	    }
	    getMultiViewSpec(view, useOverwrittenEncodings) {
	        const views = view.visualElements;
	        const schema = this.getBasicSchema();
	        const overwriteChildEncodings = !(view instanceof RepeatView_1.RepeatView) && useOverwrittenEncodings;
	        const individualSchemas = views
	            .map(t => this.getVegaSpecification(t, false, overwriteChildEncodings));
	        const individualViewAbstractions = individualSchemas
	            .map(s => SpecUtils.getAbstraction(s));
	        if (view instanceof ConcatView_1.ConcatView) {
	            if (view.isVertical) {
	                schema.vconcat = individualViewAbstractions;
	            }
	            else {
	                schema.hconcat = individualViewAbstractions;
	            }
	        }
	        else if (view instanceof LayerView_1.LayerView) {
	            if (view.groupEncodings.size > 0) {
	                schema.encoding = {};
	                view.groupEncodings.forEach((value, key) => schema.encoding[key] = value);
	                individualViewAbstractions.forEach(abstraction => {
	                    delete abstraction.data;
	                    delete abstraction.datasets;
	                });
	            }
	            schema.layer = individualViewAbstractions;
	        }
	        return schema;
	    }
	    getPlotSchema(view, inferData, useOverwrittenEncodings) {
	        const schema = this.getBasicSchema();
	        let data = view.data;
	        let datasets = view.datasets;
	        if (inferData) {
	            data = this.getDataInHierarchy(view);
	            datasets = this.getDatasetsInAncestry(view);
	        }
	        if (data !== undefined && data !== null) {
	            schema.data = data;
	        }
	        if (datasets !== undefined && datasets !== null) {
	            schema.datasets = datasets;
	        }
	        schema.mark = view.mark;
	        if (view.selection !== undefined) {
	            schema.selection = view.selection;
	        }
	        schema.encoding = {};
	        view.encodings.forEach((value, key) => {
	            schema.encoding[key] = value;
	        });
	        // do not overwrite encodings of repeated plots, as this would in turn use a mapping to a field
	        // instead of the repeated column/row
	        if (useOverwrittenEncodings) {
	            view.overwrittenEncodings.forEach((value, key) => {
	                schema.encoding[key] = value;
	            });
	        }
	        return schema;
	    }
	    getCompositionSchema(view, inferData, useOverwrittenEncodings) {
	        let schema = null;
	        let data = null;
	        let datasets = null;
	        if (view.visualElements.length === 0) {
	            schema = this.getBasicSchema(view);
	        }
	        else if (view instanceof RepeatView_1.RepeatView) {
	            schema = this.getRepeatSpec(view);
	        }
	        else if (view instanceof FacetView_1.FacetView) {
	            schema = this.getFacetSpec(view);
	        }
	        else {
	            schema = this.getMultiViewSpec(view, useOverwrittenEncodings);
	        }
	        if (inferData) {
	            data = this.getDataInHierarchy(view);
	            datasets = SpecUtils.getAllDatasetsInHierarchy(view);
	        }
	        else {
	            data = view.data;
	            datasets = view.datasets;
	        }
	        if (data !== undefined && data !== null) {
	            schema.data = data;
	        }
	        if (datasets !== undefined && datasets !== null) {
	            schema.datasets = datasets;
	        }
	        if (view.resolve !== undefined) {
	            schema.resolve = view.resolve;
	        }
	        return schema;
	    }
	    getVegaSpecification(view, inferProperties = false, useOverwrittenEncodings = false) {
	        let schema = null;
	        if (view instanceof PlotView_1.PlotView) {
	            schema = this.getPlotSchema(view, inferProperties, useOverwrittenEncodings);
	        }
	        else if (view instanceof CompositionView_1.CompositionView) {
	            schema = this.getCompositionSchema(view, inferProperties, useOverwrittenEncodings);
	        }
	        schema = this.setToplevelProperties(schema, view);
	        if (inferProperties) {
	            const rootView = this.getRootView(view);
	            schema = this.setToplevelProperties(schema, rootView, false);
	        }
	        return schema;
	    }
	}
	exports.SpecCompiler = SpecCompiler;
	});

	unwrapExports(SpecCompiler_1);
	SpecCompiler_1.SpecCompiler;

	/*! *****************************************************************************
	Copyright (c) Microsoft Corporation. All rights reserved.
	Licensed under the Apache License, Version 2.0 (the "License"); you may not use
	this file except in compliance with the License. You may obtain a copy of the
	License at http://www.apache.org/licenses/LICENSE-2.0

	THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
	KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
	WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
	MERCHANTABLITY OR NON-INFRINGEMENT.

	See the Apache Version 2.0 License for specific language governing permissions
	and limitations under the License.
	***************************************************************************** */

	function __rest(s, e) {
	    var t = {};
	    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
	        t[p] = s[p];
	    if (s != null && typeof Object.getOwnPropertySymbols === "function")
	        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
	            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
	                t[p[i]] = s[p[i]];
	        }
	    return t;
	}

	const AGGREGATE_OP_INDEX = {
	    argmax: 1,
	    argmin: 1,
	    average: 1,
	    count: 1,
	    distinct: 1,
	    max: 1,
	    mean: 1,
	    median: 1,
	    min: 1,
	    missing: 1,
	    q1: 1,
	    q3: 1,
	    ci0: 1,
	    ci1: 1,
	    stderr: 1,
	    stdev: 1,
	    stdevp: 1,
	    sum: 1,
	    valid: 1,
	    values: 1,
	    variance: 1,
	    variancep: 1
	};
	function isArgminDef(a) {
	    return !!a && !!a['argmin'];
	}
	function isArgmaxDef(a) {
	    return !!a && !!a['argmax'];
	}
	function isAggregateOp(a) {
	    return isString(a) && !!AGGREGATE_OP_INDEX[a];
	}
	const COUNTING_OPS = ['count', 'valid', 'missing', 'distinct'];
	function isCountingAggregateOp(aggregate) {
	    return aggregate && isString(aggregate) && contains(COUNTING_OPS, aggregate);
	}
	/**
	 * Aggregation operators that always produce values within the range [domainMin, domainMax].
	 */
	const SHARED_DOMAIN_OPS = ['mean', 'average', 'median', 'q1', 'q3', 'min', 'max'];
	toSet(SHARED_DOMAIN_OPS);

	/*
	 * Constants and utilities for encoding channels (Visual variables)
	 * such as 'x', 'y', 'color'.
	 */
	// Facet
	const ROW = 'row';
	const COLUMN = 'column';
	const FACET = 'facet';
	// Position
	const X = 'x';
	const Y = 'y';
	const X2 = 'x2';
	const Y2 = 'y2';
	// Geo Position
	const LATITUDE = 'latitude';
	const LONGITUDE = 'longitude';
	const LATITUDE2 = 'latitude2';
	const LONGITUDE2 = 'longitude2';
	// Mark property with scale
	const COLOR = 'color';
	const FILL = 'fill';
	const STROKE = 'stroke';
	const SHAPE = 'shape';
	const SIZE = 'size';
	const OPACITY = 'opacity';
	const FILLOPACITY = 'fillOpacity';
	const STROKEOPACITY = 'strokeOpacity';
	const STROKEWIDTH = 'strokeWidth';
	// Non-scale channel
	const TEXT$1 = 'text';
	const ORDER = 'order';
	const DETAIL = 'detail';
	const KEY = 'key';
	const TOOLTIP = 'tooltip';
	const HREF = 'href';
	const POSITION_CHANNEL_INDEX = {
	    x: 1,
	    y: 1,
	    x2: 1,
	    y2: 1
	};
	const GEOPOSITION_CHANNEL_INDEX = {
	    longitude: 1,
	    longitude2: 1,
	    latitude: 1,
	    latitude2: 1
	};
	const UNIT_CHANNEL_INDEX = Object.assign({}, POSITION_CHANNEL_INDEX, GEOPOSITION_CHANNEL_INDEX, { 
	    // color
	    color: 1, fill: 1, stroke: 1, 
	    // other non-position with scale
	    opacity: 1, fillOpacity: 1, strokeOpacity: 1, strokeWidth: 1, size: 1, shape: 1, 
	    // channels without scales
	    order: 1, text: 1, detail: 1, key: 1, tooltip: 1, href: 1 });
	const FACET_CHANNEL_INDEX = {
	    row: 1,
	    column: 1,
	    facet: 1
	};
	const CHANNEL_INDEX = Object.assign({}, UNIT_CHANNEL_INDEX, FACET_CHANNEL_INDEX);
	__rest(CHANNEL_INDEX, ["order", "detail"]);
	__rest(CHANNEL_INDEX, ["order", "detail", "row", "column", "facet"]);
	function isSecondaryRangeChannel(c) {
	    const main = getMainRangeChannel(c);
	    return main !== c;
	}
	/**
	 * Get the main channel for a range channel. E.g. `x` for `x2`.
	 */
	function getMainRangeChannel(channel) {
	    switch (channel) {
	        case 'x2':
	            return 'x';
	        case 'y2':
	            return 'y';
	        case 'latitude2':
	            return 'latitude';
	        case 'longitude2':
	            return 'longitude';
	    }
	    return channel;
	}
	// NONPOSITION_CHANNELS = UNIT_CHANNELS without X, Y, X2, Y2;
	const // The rest of unit channels then have scale
	NONPOSITION_CHANNEL_INDEX = __rest(UNIT_CHANNEL_INDEX, ["x", "y", "x2", "y2", "latitude", "longitude", "latitude2", "longitude2"]);
	// POSITION_SCALE_CHANNELS = X and Y;
	const POSITION_SCALE_CHANNEL_INDEX = { x: 1, y: 1 };
	const POSITION_SCALE_CHANNELS = keys(POSITION_SCALE_CHANNEL_INDEX);
	// NON_POSITION_SCALE_CHANNEL = SCALE_CHANNELS without X, Y
	const NONPOSITION_SCALE_CHANNEL_INDEX = __rest(NONPOSITION_CHANNEL_INDEX, ["text", "tooltip", "href", "detail", "key", "order"]);
	// Declare SCALE_CHANNEL_INDEX
	const SCALE_CHANNEL_INDEX = Object.assign({}, POSITION_SCALE_CHANNEL_INDEX, NONPOSITION_SCALE_CHANNEL_INDEX);
	function isScaleChannel(channel) {
	    return !!SCALE_CHANNEL_INDEX[channel];
	}
	const ALL_MARKS = {
	    // all marks
	    area: 'always',
	    bar: 'always',
	    circle: 'always',
	    geoshape: 'always',
	    line: 'always',
	    rule: 'always',
	    point: 'always',
	    rect: 'always',
	    square: 'always',
	    trail: 'always',
	    text: 'always',
	    tick: 'always'
	};
	__rest(ALL_MARKS, ["geoshape"]);
	function rangeType(channel) {
	    switch (channel) {
	        case X:
	        case Y:
	        case SIZE:
	        case STROKEWIDTH:
	        case OPACITY:
	        case FILLOPACITY:
	        case STROKEOPACITY:
	        // X2 and Y2 use X and Y scales, so they similarly have continuous range. [falls through]
	        case X2:
	        case Y2:
	            return undefined;
	        case FACET:
	        case ROW:
	        case COLUMN:
	        case SHAPE:
	        // TEXT, TOOLTIP, and HREF have no scale but have discrete output [falls through]
	        case TEXT$1:
	        case TOOLTIP:
	        case HREF:
	            return 'discrete';
	        // Color can be either continuous or discrete, depending on scale type.
	        case COLOR:
	        case FILL:
	        case STROKE:
	            return 'flexible';
	        // No scale, no range type.
	        case LATITUDE:
	        case LONGITUDE:
	        case LATITUDE2:
	        case LONGITUDE2:
	        case DETAIL:
	        case KEY:
	        case ORDER:
	            return undefined;
	    }
	    /* istanbul ignore next: should never reach here. */
	    throw new Error('rangeType not implemented for ' + channel);
	}

	/**
	 * Create a key for the bin configuration. Not for prebinned bin.
	 */
	function binToString(bin) {
	    if (isBoolean(bin)) {
	        bin = normalizeBin(bin, undefined);
	    }
	    return ('bin' +
	        keys(bin)
	            .map(p => varName(`_${p}_${bin[p]}`))
	            .join(''));
	}
	/**
	 * Vega-Lite should bin the data.
	 */
	function isBinning(bin) {
	    return bin === true || (isBinParams(bin) && !bin.binned);
	}
	/**
	 * The data is already binned and so Vega-Lite should not bin it again.
	 */
	function isBinned(bin) {
	    return bin === 'binned' || (isBinParams(bin) && bin.binned);
	}
	function isBinParams(bin) {
	    return isObject(bin);
	}
	function autoMaxBins(channel) {
	    switch (channel) {
	        case ROW:
	        case COLUMN:
	        case SIZE:
	        case COLOR:
	        case FILL:
	        case STROKE:
	        case STROKEWIDTH:
	        case OPACITY:
	        case FILLOPACITY:
	        case STROKEOPACITY:
	        // Facets and Size shouldn't have too many bins
	        // We choose 6 like shape to simplify the rule [falls through]
	        case SHAPE:
	            return 6; // Vega's "shape" has 6 distinct values
	        default:
	            return 10;
	    }
	}

	/**
	 * Collection of all Vega-Lite Error Messages
	 */
	const INVALID_SPEC = 'Invalid spec';
	// FIT
	const FIT_NON_SINGLE = 'Autosize "fit" only works for single views and layered views.';
	const CANNOT_FIX_RANGE_STEP_WITH_FIT = 'Cannot use a fixed value of "rangeStep" when "autosize" is "fit".';
	// SELECTION
	function cannotProjectOnChannelWithoutField(channel) {
	    return `Cannot project a selection on encoding channel "${channel}", which has no field.`;
	}
	function nearestNotSupportForContinuous(mark) {
	    return `The "nearest" transform is not supported for ${mark} marks.`;
	}
	function selectionNotSupported(mark) {
	    return `Selection not supported for ${mark} yet`;
	}
	function selectionNotFound(name) {
	    return `Cannot find a selection named "${name}"`;
	}
	const SCALE_BINDINGS_CONTINUOUS = 'Scale bindings are currently only supported for scales with unbinned, continuous domains.';
	const NO_INIT_SCALE_BINDINGS = 'Selections bound to scales cannot be separately initialized.';
	// REPEAT
	function noSuchRepeatedValue(field) {
	    return `Unknown repeated value "${field}".`;
	}
	function columnsNotSupportByRowCol(type) {
	    return `The "columns" property cannot be used when "${type}" has nested row/column.`;
	}
	// CONCAT
	const CONCAT_CANNOT_SHARE_AXIS = 'Axes cannot be shared in concatenated views yet (https://github.com/vega/vega-lite/issues/2415).';
	// REPEAT
	const REPEAT_CANNOT_SHARE_AXIS = 'Axes cannot be shared in repeated views yet (https://github.com/vega/vega-lite/issues/2415).';
	// DATA
	function unrecognizedParse(p) {
	    return `Unrecognized parse "${p}".`;
	}
	function differentParse(field, local, ancestor) {
	    return `An ancestor parsed field "${field}" as ${ancestor} but a child wants to parse the field as ${local}.`;
	}
	// TRANSFORMS
	function invalidTransformIgnored(transform) {
	    return `Ignoring an invalid transform: ${stringify(transform)}.`;
	}
	const NO_FIELDS_NEEDS_AS = 'If "from.fields" is not specified, "as" has to be a string that specifies the key to be used for the data from the secondary source.';
	// ENCODING & FACET
	function encodingOverridden(channels) {
	    return `Layer's shared ${channels.join(',')} channel ${channels.length === 1 ? 'is' : 'are'} overriden`;
	}
	function projectionOverridden(opt) {
	    const { parentProjection, projection } = opt;
	    return `Layer's shared projection ${stringify(parentProjection)} is overridden by a child projection ${stringify(projection)}.`;
	}
	function primitiveChannelDef(channel, type, value) {
	    return `Channel ${channel} is a ${type}. Converted to {value: ${stringify(value)}}.`;
	}
	function invalidFieldType(type) {
	    return `Invalid field type "${type}"`;
	}
	function nonZeroScaleUsedWithLengthMark(mark, channel, opt) {
	    const scaleText = opt.scaleType
	        ? `${opt.scaleType} scale`
	        : opt.zeroFalse
	            ? 'scale with zero=false'
	            : 'scale with custom domain that excludes zero';
	    return `A ${scaleText} is used to encode ${mark}'s ${channel}. This can be misleading as the ${channel === 'x' ? 'width' : 'height'} of the ${mark} can be arbitrary based on the scale domain. You may want to use point mark instead.`;
	}
	function invalidFieldTypeForCountAggregate(type, aggregate) {
	    return `Invalid field type "${type}" for aggregate: "${aggregate}", using "quantitative" instead.`;
	}
	function invalidAggregate(aggregate) {
	    return `Invalid aggregation operator "${aggregate}"`;
	}
	function missingFieldType(channel, newType) {
	    return `Missing type for channel "${channel}", using "${newType}" instead.`;
	}
	function droppingColor(type, opt) {
	    const { fill, stroke } = opt;
	    return (`Dropping color ${type} as the plot also has ` + (fill && stroke ? 'fill and stroke' : fill ? 'fill' : 'stroke'));
	}
	function emptyFieldDef(fieldDef, channel) {
	    return `Dropping ${stringify(fieldDef)} from channel "${channel}" since it does not contain data field or value.`;
	}
	function latLongDeprecated(channel, type, newChannel) {
	    return `${channel}-encoding with type ${type} is deprecated. Replacing with ${newChannel}-encoding.`;
	}
	const LINE_WITH_VARYING_SIZE = 'Line marks cannot encode size with a non-groupby field. You may want to use trail marks instead.';
	function incompatibleChannel(channel, markOrFacet, when) {
	    return `${channel} dropped as it is incompatible with "${markOrFacet}"${when ? ` when ${when}` : ''}.`;
	}
	function invalidEncodingChannel(channel) {
	    return `${channel}-encoding is dropped as ${channel} is not a valid encoding channel.`;
	}
	function facetChannelShouldBeDiscrete(channel) {
	    return `${channel} encoding should be discrete (ordinal / nominal / binned).`;
	}
	function facetChannelDropped(channels) {
	    return `Facet encoding dropped as ${channels.join(' and ')} ${channels.length > 1 ? 'are' : 'is'} also specified.`;
	}
	function discreteChannelCannotEncode(channel, type) {
	    return `Using discrete channel "${channel}" to encode "${type}" field can be misleading as it does not encode ${type === 'ordinal' ? 'order' : 'magnitude'}.`;
	}
	// Mark
	const BAR_WITH_POINT_SCALE_AND_RANGESTEP_NULL = 'Bar mark should not be used with point scale when rangeStep is null. Please use band scale instead.';
	function lineWithRange(hasX2, hasY2) {
	    const channels = hasX2 && hasY2 ? 'x2 and y2' : hasX2 ? 'x2' : 'y2';
	    return `Line mark is for continuous lines and thus cannot be used with ${channels}. We will use the rule mark (line segments) instead.`;
	}
	function orientOverridden(original, actual) {
	    return `Specified orient "${original}" overridden with "${actual}"`;
	}
	// SCALE
	const CANNOT_UNION_CUSTOM_DOMAIN_WITH_FIELD_DOMAIN = 'custom domain scale cannot be unioned with default field-based domain';
	function cannotUseScalePropertyWithNonColor(prop) {
	    return `Cannot use the scale property "${prop}" with non-color channel.`;
	}
	function unaggregateDomainHasNoEffectForRawField(fieldDef) {
	    return `Using unaggregated domain with raw field has no effect (${stringify(fieldDef)}).`;
	}
	function unaggregateDomainWithNonSharedDomainOp(aggregate) {
	    return `Unaggregated domain not applicable for "${aggregate}" since it produces values outside the origin domain of the source data.`;
	}
	function unaggregatedDomainWithLogScale(fieldDef) {
	    return `Unaggregated domain is currently unsupported for log scale (${stringify(fieldDef)}).`;
	}
	function cannotApplySizeToNonOrientedMark(mark) {
	    return `Cannot apply size to non-oriented mark "${mark}".`;
	}
	function rangeStepDropped(channel) {
	    return `rangeStep for "${channel}" is dropped as top-level ${channel === 'x' ? 'width' : 'height'} is provided.`;
	}
	function scaleTypeNotWorkWithChannel(channel, scaleType, defaultScaleType) {
	    return `Channel "${channel}" does not work with "${scaleType}" scale. We are using "${defaultScaleType}" scale instead.`;
	}
	function scaleTypeNotWorkWithFieldDef(scaleType, defaultScaleType) {
	    return `FieldDef does not work with "${scaleType}" scale. We are using "${defaultScaleType}" scale instead.`;
	}
	function scalePropertyNotWorkWithScaleType(scaleType, propName, channel) {
	    return `${channel}-scale's "${propName}" is dropped as it does not work with ${scaleType} scale.`;
	}
	function scaleTypeNotWorkWithMark(mark, scaleType) {
	    return `Scale type "${scaleType}" does not work with mark "${mark}".`;
	}
	function mergeConflictingProperty(property, propertyOf, v1, v2) {
	    return `Conflicting ${propertyOf.toString()} property "${property.toString()}" (${stringify(v1)} and ${stringify(v2)}).  Using ${stringify(v1)}.`;
	}
	function mergeConflictingDomainProperty(property, propertyOf, v1, v2) {
	    return `Conflicting ${propertyOf.toString()} property "${property.toString()}" (${stringify(v1)} and ${stringify(v2)}).  Using the union of the two domains.`;
	}
	function independentScaleMeansIndependentGuide(channel) {
	    return `Setting the scale to be independent for "${channel}" means we also have to set the guide (axis or legend) to be independent.`;
	}
	function domainSortDropped(sort) {
	    return `Dropping sort property ${stringify(sort)} as unioned domains only support boolean or op 'count'.`;
	}
	const UNABLE_TO_MERGE_DOMAINS = 'Unable to merge domains';
	const MORE_THAN_ONE_SORT = 'Domains that should be unioned has conflicting sort properties. Sort will be set to true.';
	// AXIS
	const INVALID_CHANNEL_FOR_AXIS = 'Invalid channel for axis.';
	// STACK
	function cannotStackRangedMark(channel) {
	    return `Cannot stack "${channel}" if there is already "${channel}2"`;
	}
	function cannotStackNonLinearScale(scaleType) {
	    return `Cannot stack non-linear scale (${scaleType})`;
	}
	function stackNonSummativeAggregate(aggregate) {
	    return `Stacking is applied even though the aggregate function is non-summative ("${aggregate}")`;
	}
	// TIMEUNIT
	function invalidTimeUnit(unitName, value) {
	    return `Invalid ${unitName}: ${stringify(value)}`;
	}
	function dayReplacedWithDate(fullTimeUnit) {
	    return `Time unit "${fullTimeUnit}" is not supported. We are replacing it with ${fullTimeUnit.replace('day', 'date')}.`;
	}
	function droppedDay(d) {
	    return `Dropping day from datetime ${stringify(d)} as day cannot be combined with other units.`;
	}
	function errorBarCenterAndExtentAreNotNeeded(center, extent) {
	    return `${extent ? 'extent ' : ''}${extent && center ? 'and ' : ''}${center ? 'center ' : ''}${extent && center ? 'are ' : 'is '}not needed when data are aggregated.`;
	}
	function errorBarCenterIsUsedWithWrongExtent(center, extent, mark) {
	    return `${center} is not usually used with ${extent} for ${mark}.`;
	}
	function errorBarContinuousAxisHasCustomizedAggregate(aggregate, compositeMark) {
	    return `Continuous axis should not have customized aggregation function ${aggregate}; ${compositeMark} already agregates the axis.`;
	}
	function errorBarCenterIsNotNeeded(extent, mark) {
	    return `Center is not needed to be specified in ${mark} when extent is ${extent}.`;
	}
	function errorBand1DNotSupport(property) {
	    return `1D error band does not support ${property}`;
	}
	// CHANNEL
	function channelRequiredForBinned(channel) {
	    return `Channel ${channel} is required for "binned" bin`;
	}
	function domainRequiredForThresholdScale(channel) {
	    return `Domain for ${channel} is required for threshold scale`;
	}

	var message_ = /*#__PURE__*/Object.freeze({
		__proto__: null,
		INVALID_SPEC: INVALID_SPEC,
		FIT_NON_SINGLE: FIT_NON_SINGLE,
		CANNOT_FIX_RANGE_STEP_WITH_FIT: CANNOT_FIX_RANGE_STEP_WITH_FIT,
		cannotProjectOnChannelWithoutField: cannotProjectOnChannelWithoutField,
		nearestNotSupportForContinuous: nearestNotSupportForContinuous,
		selectionNotSupported: selectionNotSupported,
		selectionNotFound: selectionNotFound,
		SCALE_BINDINGS_CONTINUOUS: SCALE_BINDINGS_CONTINUOUS,
		NO_INIT_SCALE_BINDINGS: NO_INIT_SCALE_BINDINGS,
		noSuchRepeatedValue: noSuchRepeatedValue,
		columnsNotSupportByRowCol: columnsNotSupportByRowCol,
		CONCAT_CANNOT_SHARE_AXIS: CONCAT_CANNOT_SHARE_AXIS,
		REPEAT_CANNOT_SHARE_AXIS: REPEAT_CANNOT_SHARE_AXIS,
		unrecognizedParse: unrecognizedParse,
		differentParse: differentParse,
		invalidTransformIgnored: invalidTransformIgnored,
		NO_FIELDS_NEEDS_AS: NO_FIELDS_NEEDS_AS,
		encodingOverridden: encodingOverridden,
		projectionOverridden: projectionOverridden,
		primitiveChannelDef: primitiveChannelDef,
		invalidFieldType: invalidFieldType,
		nonZeroScaleUsedWithLengthMark: nonZeroScaleUsedWithLengthMark,
		invalidFieldTypeForCountAggregate: invalidFieldTypeForCountAggregate,
		invalidAggregate: invalidAggregate,
		missingFieldType: missingFieldType,
		droppingColor: droppingColor,
		emptyFieldDef: emptyFieldDef,
		latLongDeprecated: latLongDeprecated,
		LINE_WITH_VARYING_SIZE: LINE_WITH_VARYING_SIZE,
		incompatibleChannel: incompatibleChannel,
		invalidEncodingChannel: invalidEncodingChannel,
		facetChannelShouldBeDiscrete: facetChannelShouldBeDiscrete,
		facetChannelDropped: facetChannelDropped,
		discreteChannelCannotEncode: discreteChannelCannotEncode,
		BAR_WITH_POINT_SCALE_AND_RANGESTEP_NULL: BAR_WITH_POINT_SCALE_AND_RANGESTEP_NULL,
		lineWithRange: lineWithRange,
		orientOverridden: orientOverridden,
		CANNOT_UNION_CUSTOM_DOMAIN_WITH_FIELD_DOMAIN: CANNOT_UNION_CUSTOM_DOMAIN_WITH_FIELD_DOMAIN,
		cannotUseScalePropertyWithNonColor: cannotUseScalePropertyWithNonColor,
		unaggregateDomainHasNoEffectForRawField: unaggregateDomainHasNoEffectForRawField,
		unaggregateDomainWithNonSharedDomainOp: unaggregateDomainWithNonSharedDomainOp,
		unaggregatedDomainWithLogScale: unaggregatedDomainWithLogScale,
		cannotApplySizeToNonOrientedMark: cannotApplySizeToNonOrientedMark,
		rangeStepDropped: rangeStepDropped,
		scaleTypeNotWorkWithChannel: scaleTypeNotWorkWithChannel,
		scaleTypeNotWorkWithFieldDef: scaleTypeNotWorkWithFieldDef,
		scalePropertyNotWorkWithScaleType: scalePropertyNotWorkWithScaleType,
		scaleTypeNotWorkWithMark: scaleTypeNotWorkWithMark,
		mergeConflictingProperty: mergeConflictingProperty,
		mergeConflictingDomainProperty: mergeConflictingDomainProperty,
		independentScaleMeansIndependentGuide: independentScaleMeansIndependentGuide,
		domainSortDropped: domainSortDropped,
		UNABLE_TO_MERGE_DOMAINS: UNABLE_TO_MERGE_DOMAINS,
		MORE_THAN_ONE_SORT: MORE_THAN_ONE_SORT,
		INVALID_CHANNEL_FOR_AXIS: INVALID_CHANNEL_FOR_AXIS,
		cannotStackRangedMark: cannotStackRangedMark,
		cannotStackNonLinearScale: cannotStackNonLinearScale,
		stackNonSummativeAggregate: stackNonSummativeAggregate,
		invalidTimeUnit: invalidTimeUnit,
		dayReplacedWithDate: dayReplacedWithDate,
		droppedDay: droppedDay,
		errorBarCenterAndExtentAreNotNeeded: errorBarCenterAndExtentAreNotNeeded,
		errorBarCenterIsUsedWithWrongExtent: errorBarCenterIsUsedWithWrongExtent,
		errorBarContinuousAxisHasCustomizedAggregate: errorBarContinuousAxisHasCustomizedAggregate,
		errorBarCenterIsNotNeeded: errorBarCenterIsNotNeeded,
		errorBand1DNotSupport: errorBand1DNotSupport,
		channelRequiredForBinned: channelRequiredForBinned,
		domainRequiredForThresholdScale: domainRequiredForThresholdScale
	});

	/**
	 * Vega-Lite's singleton logger utility.
	 */
	const message = message_;
	/**
	 * Main (default) Vega Logger instance for Vega-Lite
	 */
	const main = logger(Warn);
	let current = main;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function warn(..._) {
	    current.warn.apply(current, arguments);
	}

	// DateTime definition object
	/*
	 * A designated year that starts on Sunday.
	 */
	const SUNDAY_YEAR = 2006;
	function isDateTime(o) {
	    return (!!o &&
	        (!!o.year ||
	            !!o.quarter ||
	            !!o.month ||
	            !!o.date ||
	            !!o.day ||
	            !!o.hours ||
	            !!o.minutes ||
	            !!o.seconds ||
	            !!o.milliseconds));
	}
	const MONTHS = [
	    'january',
	    'february',
	    'march',
	    'april',
	    'may',
	    'june',
	    'july',
	    'august',
	    'september',
	    'october',
	    'november',
	    'december'
	];
	const SHORT_MONTHS = MONTHS.map(m => m.substr(0, 3));
	const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
	const SHORT_DAYS = DAYS.map(d => d.substr(0, 3));
	function normalizeQuarter(q) {
	    if (isNumber(q)) {
	        if (q > 4) {
	            warn(message.invalidTimeUnit('quarter', q));
	        }
	        // We accept 1-based quarter, so need to readjust to 0-based quarter
	        return (q - 1).toString();
	    }
	    else {
	        // Invalid quarter
	        throw new Error(message.invalidTimeUnit('quarter', q));
	    }
	}
	function normalizeMonth(m) {
	    if (isNumber(m)) {
	        // We accept 1-based month, so need to readjust to 0-based month
	        return (m - 1).toString();
	    }
	    else {
	        const lowerM = m.toLowerCase();
	        const monthIndex = MONTHS.indexOf(lowerM);
	        if (monthIndex !== -1) {
	            return monthIndex + ''; // 0 for january, ...
	        }
	        const shortM = lowerM.substr(0, 3);
	        const shortMonthIndex = SHORT_MONTHS.indexOf(shortM);
	        if (shortMonthIndex !== -1) {
	            return shortMonthIndex + '';
	        }
	        // Invalid month
	        throw new Error(message.invalidTimeUnit('month', m));
	    }
	}
	function normalizeDay(d) {
	    if (isNumber(d)) {
	        // mod so that this can be both 0-based where 0 = sunday
	        // and 1-based where 7=sunday
	        return (d % 7) + '';
	    }
	    else {
	        const lowerD = d.toLowerCase();
	        const dayIndex = DAYS.indexOf(lowerD);
	        if (dayIndex !== -1) {
	            return dayIndex + ''; // 0 for january, ...
	        }
	        const shortD = lowerD.substr(0, 3);
	        const shortDayIndex = SHORT_DAYS.indexOf(shortD);
	        if (shortDayIndex !== -1) {
	            return shortDayIndex + '';
	        }
	        // Invalid day
	        throw new Error(message.invalidTimeUnit('day', d));
	    }
	}
	/**
	 * Return Vega Expression for a particular date time.
	 * @param d
	 * @param normalize whether to normalize quarter, month, day.
	 * @param toJSON whether to return the date in JSON format
	 */
	function dateTimeExpr(d, normalize = false, toJSON = false) {
	    const units = [];
	    if (normalize && d.day !== undefined) {
	        if (keys(d).length > 1) {
	            warn(message.droppedDay(d));
	            d = duplicate(d);
	            delete d.day;
	        }
	    }
	    if (d.year !== undefined) {
	        units.push(d.year);
	    }
	    else if (d.day !== undefined) {
	        // Set year to 2006 for working with day since January 1 2006 is a Sunday
	        units.push(SUNDAY_YEAR);
	    }
	    else {
	        units.push(0);
	    }
	    if (d.month !== undefined) {
	        const month = normalize ? normalizeMonth(d.month) : d.month;
	        units.push(month);
	    }
	    else if (d.quarter !== undefined) {
	        const quarter = normalize ? normalizeQuarter(d.quarter) : d.quarter;
	        units.push(quarter + '*3');
	    }
	    else {
	        units.push(0); // months start at zero in JS
	    }
	    if (d.date !== undefined) {
	        units.push(d.date);
	    }
	    else if (d.day !== undefined) {
	        // HACK: Day only works as a standalone unit
	        // This is only correct because we always set year to 2006 for day
	        const day = normalize ? normalizeDay(d.day) : d.day;
	        units.push(day + '+1');
	    }
	    else {
	        units.push(1); // Date starts at 1 in JS
	    }
	    // Note: can't use TimeUnit enum here as importing it will create
	    // circular dependency problem!
	    for (const timeUnit of ['hours', 'minutes', 'seconds', 'milliseconds']) {
	        if (d[timeUnit] !== undefined) {
	            units.push(d[timeUnit]);
	        }
	        else {
	            units.push(0);
	        }
	    }
	    const unitsString = units.join(', ');
	    if (toJSON) {
	        if (d.utc) {
	            return new Function(`return new Date(Date.UTC(${unitsString}))`)().toJSON();
	        }
	        else {
	            return new Function(`return new Date(${unitsString})`)().toJSON();
	        }
	    }
	    if (d.utc) {
	        return `utc(${unitsString})`;
	    }
	    else {
	        return `datetime(${unitsString})`;
	    }
	}

	var TimeUnit;
	(function (TimeUnit) {
	    TimeUnit.YEAR = 'year';
	    TimeUnit.MONTH = 'month';
	    TimeUnit.DAY = 'day';
	    TimeUnit.DATE = 'date';
	    TimeUnit.HOURS = 'hours';
	    TimeUnit.MINUTES = 'minutes';
	    TimeUnit.SECONDS = 'seconds';
	    TimeUnit.MILLISECONDS = 'milliseconds';
	    TimeUnit.YEARMONTH = 'yearmonth';
	    TimeUnit.YEARMONTHDATE = 'yearmonthdate';
	    TimeUnit.YEARMONTHDATEHOURS = 'yearmonthdatehours';
	    TimeUnit.YEARMONTHDATEHOURSMINUTES = 'yearmonthdatehoursminutes';
	    TimeUnit.YEARMONTHDATEHOURSMINUTESSECONDS = 'yearmonthdatehoursminutesseconds';
	    // MONTHDATE and MONTHDATEHOURS always include 29 February since we use year 0th (which is a leap year);
	    TimeUnit.MONTHDATE = 'monthdate';
	    TimeUnit.MONTHDATEHOURS = 'monthdatehours';
	    TimeUnit.HOURSMINUTES = 'hoursminutes';
	    TimeUnit.HOURSMINUTESSECONDS = 'hoursminutesseconds';
	    TimeUnit.MINUTESSECONDS = 'minutesseconds';
	    TimeUnit.SECONDSMILLISECONDS = 'secondsmilliseconds';
	    TimeUnit.QUARTER = 'quarter';
	    TimeUnit.YEARQUARTER = 'yearquarter';
	    TimeUnit.QUARTERMONTH = 'quartermonth';
	    TimeUnit.YEARQUARTERMONTH = 'yearquartermonth';
	    TimeUnit.UTCYEAR = 'utcyear';
	    TimeUnit.UTCMONTH = 'utcmonth';
	    TimeUnit.UTCDAY = 'utcday';
	    TimeUnit.UTCDATE = 'utcdate';
	    TimeUnit.UTCHOURS = 'utchours';
	    TimeUnit.UTCMINUTES = 'utcminutes';
	    TimeUnit.UTCSECONDS = 'utcseconds';
	    TimeUnit.UTCMILLISECONDS = 'utcmilliseconds';
	    TimeUnit.UTCYEARMONTH = 'utcyearmonth';
	    TimeUnit.UTCYEARMONTHDATE = 'utcyearmonthdate';
	    TimeUnit.UTCYEARMONTHDATEHOURS = 'utcyearmonthdatehours';
	    TimeUnit.UTCYEARMONTHDATEHOURSMINUTES = 'utcyearmonthdatehoursminutes';
	    TimeUnit.UTCYEARMONTHDATEHOURSMINUTESSECONDS = 'utcyearmonthdatehoursminutesseconds';
	    // UTCMONTHDATE and UTCMONTHDATEHOURS always include 29 February since we use year 0th (which is a leap year);
	    TimeUnit.UTCMONTHDATE = 'utcmonthdate';
	    TimeUnit.UTCMONTHDATEHOURS = 'utcmonthdatehours';
	    TimeUnit.UTCHOURSMINUTES = 'utchoursminutes';
	    TimeUnit.UTCHOURSMINUTESSECONDS = 'utchoursminutesseconds';
	    TimeUnit.UTCMINUTESSECONDS = 'utcminutesseconds';
	    TimeUnit.UTCSECONDSMILLISECONDS = 'utcsecondsmilliseconds';
	    TimeUnit.UTCQUARTER = 'utcquarter';
	    TimeUnit.UTCYEARQUARTER = 'utcyearquarter';
	    TimeUnit.UTCQUARTERMONTH = 'utcquartermonth';
	    TimeUnit.UTCYEARQUARTERMONTH = 'utcyearquartermonth';
	})(TimeUnit || (TimeUnit = {}));
	/** Time Unit that only corresponds to only one part of Date objects. */
	const LOCAL_SINGLE_TIMEUNIT_INDEX = {
	    year: 1,
	    quarter: 1,
	    month: 1,
	    day: 1,
	    date: 1,
	    hours: 1,
	    minutes: 1,
	    seconds: 1,
	    milliseconds: 1
	};
	const TIMEUNIT_PARTS = keys(LOCAL_SINGLE_TIMEUNIT_INDEX);
	function isLocalSingleTimeUnit(timeUnit) {
	    return !!LOCAL_SINGLE_TIMEUNIT_INDEX[timeUnit];
	}
	const UTC_SINGLE_TIMEUNIT_INDEX = {
	    utcyear: 1,
	    utcquarter: 1,
	    utcmonth: 1,
	    utcday: 1,
	    utcdate: 1,
	    utchours: 1,
	    utcminutes: 1,
	    utcseconds: 1,
	    utcmilliseconds: 1
	};
	function isUtcSingleTimeUnit(timeUnit) {
	    return !!UTC_SINGLE_TIMEUNIT_INDEX[timeUnit];
	}
	const LOCAL_MULTI_TIMEUNIT_INDEX = {
	    yearquarter: 1,
	    yearquartermonth: 1,
	    yearmonth: 1,
	    yearmonthdate: 1,
	    yearmonthdatehours: 1,
	    yearmonthdatehoursminutes: 1,
	    yearmonthdatehoursminutesseconds: 1,
	    quartermonth: 1,
	    monthdate: 1,
	    monthdatehours: 1,
	    hoursminutes: 1,
	    hoursminutesseconds: 1,
	    minutesseconds: 1,
	    secondsmilliseconds: 1
	};
	const UTC_MULTI_TIMEUNIT_INDEX = {
	    utcyearquarter: 1,
	    utcyearquartermonth: 1,
	    utcyearmonth: 1,
	    utcyearmonthdate: 1,
	    utcyearmonthdatehours: 1,
	    utcyearmonthdatehoursminutes: 1,
	    utcyearmonthdatehoursminutesseconds: 1,
	    utcquartermonth: 1,
	    utcmonthdate: 1,
	    utcmonthdatehours: 1,
	    utchoursminutes: 1,
	    utchoursminutesseconds: 1,
	    utcminutesseconds: 1,
	    utcsecondsmilliseconds: 1
	};
	Object.assign({}, UTC_SINGLE_TIMEUNIT_INDEX, UTC_MULTI_TIMEUNIT_INDEX);
	function getLocalTimeUnit(t) {
	    return t.substr(3);
	}
	Object.assign({}, LOCAL_SINGLE_TIMEUNIT_INDEX, UTC_SINGLE_TIMEUNIT_INDEX, LOCAL_MULTI_TIMEUNIT_INDEX, UTC_MULTI_TIMEUNIT_INDEX);
	function getTimeUnitParts(timeUnit) {
	    return TIMEUNIT_PARTS.reduce((parts, part) => {
	        if (containsTimeUnit(timeUnit, part)) {
	            return [...parts, part];
	        }
	        return parts;
	    }, []);
	}
	/** Returns true if fullTimeUnit contains the timeUnit, false otherwise. */
	function containsTimeUnit(fullTimeUnit, timeUnit) {
	    const index = fullTimeUnit.indexOf(timeUnit);
	    return (index > -1 && (timeUnit !== TimeUnit.SECONDS || index === 0 || fullTimeUnit.charAt(index - 1) !== 'i') // exclude milliseconds
	    );
	}
	function normalizeTimeUnit(timeUnit) {
	    if (timeUnit !== 'day' && timeUnit.indexOf('day') >= 0) {
	        warn(message.dayReplacedWithDate(timeUnit));
	        return timeUnit.replace('day', 'date');
	    }
	    return timeUnit;
	}

	/** Constants and utilities for data type */
	const QUANTITATIVE = 'quantitative';
	const ORDINAL = 'ordinal';
	const TEMPORAL = 'temporal';
	const NOMINAL = 'nominal';
	const GEOJSON = 'geojson';
	/**
	 * Get full, lowercase type name for a given type.
	 * @param  type
	 * @return Full type name.
	 */
	function getFullName(type) {
	    if (type) {
	        type = type.toLowerCase();
	        switch (type) {
	            case 'q':
	            case QUANTITATIVE:
	                return 'quantitative';
	            case 't':
	            case TEMPORAL:
	                return 'temporal';
	            case 'o':
	            case ORDINAL:
	                return 'ordinal';
	            case 'n':
	            case NOMINAL:
	                return 'nominal';
	            case GEOJSON:
	                return 'geojson';
	        }
	    }
	    // If we get invalid input, return undefined type.
	    return undefined;
	}

	function isConditionalSelection(c) {
	    return c['selection'];
	}
	function isRepeatRef(field) {
	    return field && !isString(field) && 'repeat' in field;
	}
	function toFieldDefBase(fieldDef) {
	    const { field, timeUnit, bin, aggregate } = fieldDef;
	    return Object.assign({}, (timeUnit ? { timeUnit } : {}), (bin ? { bin } : {}), (aggregate ? { aggregate } : {}), { field });
	}
	function isSortableFieldDef(fieldDef) {
	    return isTypedFieldDef(fieldDef) && !!fieldDef['sort'];
	}
	function isConditionalDef(channelDef) {
	    return !!channelDef && !!channelDef.condition;
	}
	/**
	 * Return if a channelDef is a ConditionalValueDef with ConditionFieldDef
	 */
	function hasConditionalFieldDef(channelDef) {
	    return !!channelDef && !!channelDef.condition && !isArray(channelDef.condition) && isFieldDef(channelDef.condition);
	}
	function hasConditionalValueDef(channelDef) {
	    return !!channelDef && !!channelDef.condition && (isArray(channelDef.condition) || isValueDef(channelDef.condition));
	}
	function isFieldDef(channelDef) {
	    return !!channelDef && (!!channelDef['field'] || channelDef['aggregate'] === 'count');
	}
	function isTypedFieldDef(channelDef) {
	    return !!channelDef && ((!!channelDef['field'] && !!channelDef['type']) || channelDef['aggregate'] === 'count');
	}
	function isStringFieldDef(channelDef) {
	    return isFieldDef(channelDef) && isString(channelDef.field);
	}
	function isValueDef(channelDef) {
	    return channelDef && 'value' in channelDef && channelDef['value'] !== undefined;
	}
	function isScaleFieldDef(channelDef) {
	    return !!channelDef && (!!channelDef['scale'] || !!channelDef['sort']);
	}
	function isPositionFieldDef(channelDef) {
	    return !!channelDef && (!!channelDef['axis'] || !!channelDef['stack'] || !!channelDef['impute']);
	}
	function isMarkPropFieldDef(channelDef) {
	    return !!channelDef && !!channelDef['legend'];
	}
	function isTextFieldDef(channelDef) {
	    return !!channelDef && !!channelDef['format'];
	}
	function isOpFieldDef(fieldDef) {
	    return !!fieldDef['op'];
	}
	/**
	 * Get a Vega field reference from a Vega-Lite field def.
	 */
	function vgField(fieldDef, opt = {}) {
	    let field = fieldDef.field;
	    const prefix = opt.prefix;
	    let suffix = opt.suffix;
	    let argAccessor = ''; // for accessing argmin/argmax field at the end without getting escaped
	    if (isCount(fieldDef)) {
	        field = internalField('count');
	    }
	    else {
	        let fn;
	        if (!opt.nofn) {
	            if (isOpFieldDef(fieldDef)) {
	                fn = fieldDef.op;
	            }
	            else {
	                const { bin, aggregate, timeUnit } = fieldDef;
	                if (isBinning(bin)) {
	                    fn = binToString(bin);
	                    suffix = (opt.binSuffix || '') + (opt.suffix || '');
	                }
	                else if (aggregate) {
	                    if (isArgmaxDef(aggregate)) {
	                        argAccessor = `.${field}`;
	                        field = `argmax_${aggregate.argmax}`;
	                    }
	                    else if (isArgminDef(aggregate)) {
	                        argAccessor = `.${field}`;
	                        field = `argmin_${aggregate.argmin}`;
	                    }
	                    else {
	                        fn = String(aggregate);
	                    }
	                }
	                else if (timeUnit) {
	                    fn = String(timeUnit);
	                }
	            }
	        }
	        if (fn) {
	            field = field ? `${fn}_${field}` : fn;
	        }
	    }
	    if (suffix) {
	        field = `${field}_${suffix}`;
	    }
	    if (prefix) {
	        field = `${prefix}_${field}`;
	    }
	    if (opt.forAs) {
	        return field;
	    }
	    else if (opt.expr) {
	        // Expression to access flattened field. No need to escape dots.
	        return flatAccessWithDatum(field, opt.expr) + argAccessor;
	    }
	    else {
	        // We flattened all fields so paths should have become dot.
	        return replacePathInField(field) + argAccessor;
	    }
	}
	function isDiscrete(fieldDef) {
	    switch (fieldDef.type) {
	        case 'nominal':
	        case 'ordinal':
	        case 'geojson':
	            return true;
	        case 'quantitative':
	            return !!fieldDef.bin;
	        case 'temporal':
	            return false;
	    }
	    throw new Error(message.invalidFieldType(fieldDef.type));
	}
	function isContinuous(fieldDef) {
	    return !isDiscrete(fieldDef);
	}
	function isCount(fieldDef) {
	    return fieldDef.aggregate === 'count';
	}
	function verbalTitleFormatter(fieldDef, config) {
	    const { field, bin, timeUnit, aggregate } = fieldDef;
	    if (aggregate === 'count') {
	        return config.countTitle;
	    }
	    else if (isBinning(bin)) {
	        return `${field} (binned)`;
	    }
	    else if (timeUnit) {
	        const units = getTimeUnitParts(timeUnit).join('-');
	        return `${field} (${units})`;
	    }
	    else if (aggregate) {
	        if (isArgmaxDef(aggregate)) {
	            return `${field} for max ${aggregate.argmax}`;
	        }
	        else if (isArgminDef(aggregate)) {
	            return `${field} for min ${aggregate.argmin}`;
	        }
	        else {
	            return `${titlecase(aggregate)} of ${field}`;
	        }
	    }
	    return field;
	}
	function functionalTitleFormatter(fieldDef) {
	    const { aggregate, bin, timeUnit, field } = fieldDef;
	    if (isArgmaxDef(aggregate)) {
	        return `${field} for argmax(${aggregate.argmax})`;
	    }
	    else if (isArgminDef(aggregate)) {
	        return `${field} for argmin(${aggregate.argmin})`;
	    }
	    const fn = aggregate || timeUnit || (isBinning(bin) && 'bin');
	    if (fn) {
	        return fn.toUpperCase() + '(' + field + ')';
	    }
	    else {
	        return field;
	    }
	}
	const defaultTitleFormatter = (fieldDef, config) => {
	    switch (config.fieldTitle) {
	        case 'plain':
	            return fieldDef.field;
	        case 'functional':
	            return functionalTitleFormatter(fieldDef);
	        default:
	            return verbalTitleFormatter(fieldDef, config);
	    }
	};
	let titleFormatter = defaultTitleFormatter;
	function setTitleFormatter(formatter) {
	    titleFormatter = formatter;
	}
	function resetTitleFormatter() {
	    setTitleFormatter(defaultTitleFormatter);
	}
	function title(fieldDef, config, { allowDisabling, includeDefault = true }) {
	    const guide = getGuide(fieldDef) || {};
	    const guideTitle = guide.title;
	    const def = includeDefault ? defaultTitle(fieldDef, config) : undefined;
	    if (allowDisabling) {
	        return getFirstDefined(guideTitle, fieldDef.title, def);
	    }
	    else {
	        return guideTitle || fieldDef.title || def;
	    }
	}
	function getGuide(fieldDef) {
	    if (isPositionFieldDef(fieldDef) && fieldDef.axis) {
	        return fieldDef.axis;
	    }
	    else if (isMarkPropFieldDef(fieldDef) && fieldDef.legend) {
	        return fieldDef.legend;
	    }
	    else if (isFacetFieldDef(fieldDef) && fieldDef.header) {
	        return fieldDef.header;
	    }
	    return undefined;
	}
	function defaultTitle(fieldDef, config) {
	    return titleFormatter(fieldDef, config);
	}
	function format(fieldDef) {
	    if (isTextFieldDef(fieldDef) && fieldDef.format) {
	        return fieldDef.format;
	    }
	    else {
	        const guide = getGuide(fieldDef) || {};
	        return guide.format;
	    }
	}
	function defaultType(fieldDef, channel) {
	    if (fieldDef.timeUnit) {
	        return 'temporal';
	    }
	    if (isBinning(fieldDef.bin)) {
	        return 'quantitative';
	    }
	    switch (rangeType(channel)) {
	        case 'continuous':
	            return 'quantitative';
	        case 'discrete':
	            return 'nominal';
	        case 'flexible': // color
	            return 'nominal';
	        default:
	            return 'quantitative';
	    }
	}
	/**
	 * Returns the fieldDef -- either from the outer channelDef or from the condition of channelDef.
	 * @param channelDef
	 */
	function getFieldDef(channelDef) {
	    if (isFieldDef(channelDef)) {
	        return channelDef;
	    }
	    else if (hasConditionalFieldDef(channelDef)) {
	        return channelDef.condition;
	    }
	    return undefined;
	}
	function getTypedFieldDef(channelDef) {
	    if (isFieldDef(channelDef)) {
	        return channelDef;
	    }
	    else if (hasConditionalFieldDef(channelDef)) {
	        return channelDef.condition;
	    }
	    return undefined;
	}
	/**
	 * Convert type to full, lowercase type, or augment the fieldDef with a default type if missing.
	 */
	function normalize(channelDef, channel) {
	    if (isString(channelDef) || isNumber(channelDef) || isBoolean(channelDef)) {
	        const primitiveType = isString(channelDef) ? 'string' : isNumber(channelDef) ? 'number' : 'boolean';
	        warn(message.primitiveChannelDef(channel, primitiveType, channelDef));
	        return { value: channelDef };
	    }
	    // If a fieldDef contains a field, we need type.
	    if (isFieldDef(channelDef)) {
	        return normalizeFieldDef(channelDef, channel);
	    }
	    else if (hasConditionalFieldDef(channelDef)) {
	        return Object.assign({}, channelDef, { 
	            // Need to cast as normalizeFieldDef normally return FieldDef, but here we know that it is definitely Condition<FieldDef>
	            condition: normalizeFieldDef(channelDef.condition, channel) });
	    }
	    return channelDef;
	}
	function normalizeFieldDef(fieldDef, channel) {
	    const { aggregate, timeUnit, bin } = fieldDef;
	    // Drop invalid aggregate
	    if (aggregate && !isAggregateOp(aggregate) && !isArgmaxDef(aggregate) && !isArgminDef(aggregate)) {
	        const fieldDefWithoutAggregate = __rest(fieldDef, ["aggregate"]);
	        warn(message.invalidAggregate(aggregate));
	        fieldDef = fieldDefWithoutAggregate;
	    }
	    // Normalize Time Unit
	    if (timeUnit) {
	        fieldDef = Object.assign({}, fieldDef, { timeUnit: normalizeTimeUnit(timeUnit) });
	    }
	    // Normalize bin
	    if (isBinning(bin)) {
	        fieldDef = Object.assign({}, fieldDef, { bin: normalizeBin(bin, channel) });
	    }
	    if (isBinned(bin) && !contains(POSITION_SCALE_CHANNELS, channel)) {
	        warn(`Channel ${channel} should not be used with "binned" bin`);
	    }
	    // Normalize Type
	    if (isTypedFieldDef(fieldDef)) {
	        const { type } = fieldDef;
	        const fullType = getFullName(type);
	        if (type !== fullType) {
	            // convert short type to full type
	            fieldDef = Object.assign({}, fieldDef, { type: fullType });
	        }
	        if (type !== 'quantitative') {
	            if (isCountingAggregateOp(aggregate)) {
	                warn(message.invalidFieldTypeForCountAggregate(type, aggregate));
	                fieldDef = Object.assign({}, fieldDef, { type: 'quantitative' });
	            }
	        }
	    }
	    else if (!isSecondaryRangeChannel(channel)) {
	        // If type is empty / invalid, then augment with default type
	        const newType = defaultType(fieldDef, channel);
	        warn(message.missingFieldType(channel, newType));
	        fieldDef = Object.assign({}, fieldDef, { type: newType });
	    }
	    if (isTypedFieldDef(fieldDef)) {
	        const { compatible, warning } = channelCompatibility(fieldDef, channel);
	        if (!compatible) {
	            warn(warning);
	        }
	    }
	    return Object.assign({}, fieldDef, (fieldDef.field !== undefined ? { field: `${fieldDef.field}` } : {}));
	}
	function normalizeBin(bin, channel) {
	    if (isBoolean(bin)) {
	        return { maxbins: autoMaxBins(channel) };
	    }
	    else if (bin === 'binned') {
	        return {
	            binned: true
	        };
	    }
	    else if (!bin.maxbins && !bin.step) {
	        return Object.assign({}, bin, { maxbins: autoMaxBins(channel) });
	    }
	    else {
	        return bin;
	    }
	}
	const COMPATIBLE = { compatible: true };
	function channelCompatibility(fieldDef, channel) {
	    const type = fieldDef.type;
	    if (type === 'geojson' && channel !== 'shape') {
	        return {
	            compatible: false,
	            warning: `Channel ${channel} should not be used with a geojson data.`
	        };
	    }
	    switch (channel) {
	        case 'row':
	        case 'column':
	        case 'facet':
	            if (isContinuous(fieldDef)) {
	                return {
	                    compatible: false,
	                    warning: message.facetChannelShouldBeDiscrete(channel)
	                };
	            }
	            return COMPATIBLE;
	        case 'x':
	        case 'y':
	        case 'color':
	        case 'fill':
	        case 'stroke':
	        case 'text':
	        case 'detail':
	        case 'key':
	        case 'tooltip':
	        case 'href':
	            return COMPATIBLE;
	        case 'longitude':
	        case 'longitude2':
	        case 'latitude':
	        case 'latitude2':
	            if (type !== QUANTITATIVE) {
	                return {
	                    compatible: false,
	                    warning: `Channel ${channel} should be used with a quantitative field only, not ${fieldDef.type} field.`
	                };
	            }
	            return COMPATIBLE;
	        case 'opacity':
	        case 'fillOpacity':
	        case 'strokeOpacity':
	        case 'strokeWidth':
	        case 'size':
	        case 'x2':
	        case 'y2':
	            if (type === 'nominal' && !fieldDef['sort']) {
	                return {
	                    compatible: false,
	                    warning: `Channel ${channel} should not be used with an unsorted discrete field.`
	                };
	            }
	            return COMPATIBLE;
	        case 'shape':
	            if (!contains(['ordinal', 'nominal', 'geojson'], fieldDef.type)) {
	                return {
	                    compatible: false,
	                    warning: 'Shape channel should be used with only either discrete or geojson data.'
	                };
	            }
	            return COMPATIBLE;
	        case 'order':
	            if (fieldDef.type === 'nominal' && !('sort' in fieldDef)) {
	                return {
	                    compatible: false,
	                    warning: `Channel order is inappropriate for nominal field, which has no inherent order.`
	                };
	            }
	            return COMPATIBLE;
	    }
	    throw new Error('channelCompatability not implemented for channel ' + channel);
	}
	/**
	 * Check if the field def uses a time format or does not use any format but is temporal
	 * (this does not cover field defs that are temporal but use a number format).
	 */
	function isTimeFormatFieldDef(fieldDef) {
	    const guide = getGuide(fieldDef);
	    const formatType = (guide && guide.formatType) || (isTextFieldDef(fieldDef) && fieldDef.formatType);
	    return formatType === 'time' || (!formatType && isTimeFieldDef(fieldDef));
	}
	/**
	 * Check if field def has tye `temporal`. If you want to also cover field defs that use a time format, use `isTimeFormatFieldDef`.
	 */
	function isTimeFieldDef(fieldDef) {
	    return fieldDef.type === 'temporal' || !!fieldDef.timeUnit;
	}
	/**
	 * Getting a value associated with a fielddef.
	 * Convert the value to Vega expression if applicable (for datetime object, or string if the field def is temporal or has timeUnit)
	 */
	function valueExpr(v, { timeUnit, type, time, undefinedIfExprNotRequired }) {
	    let expr;
	    if (isDateTime(v)) {
	        expr = dateTimeExpr(v, true);
	    }
	    else if (isString(v) || isNumber(v)) {
	        if (timeUnit || type === 'temporal') {
	            if (isLocalSingleTimeUnit(timeUnit)) {
	                expr = dateTimeExpr({ [timeUnit]: v }, true);
	            }
	            else if (isUtcSingleTimeUnit(timeUnit)) {
	                // FIXME is this really correct?
	                expr = valueExpr(v, { timeUnit: getLocalTimeUnit(timeUnit) });
	            }
	            else {
	                // just pass the string to date function (which will call JS Date.parse())
	                expr = `datetime(${JSON.stringify(v)})`;
	            }
	        }
	    }
	    if (expr) {
	        return time ? `time(${expr})` : expr;
	    }
	    // number or boolean or normal string
	    return undefinedIfExprNotRequired ? undefined : JSON.stringify(v);
	}
	/**
	 * Standardize value array -- convert each value to Vega expression if applicable
	 */
	function valueArray(fieldDef, values) {
	    const { timeUnit, type } = fieldDef;
	    return values.map(v => {
	        const expr = valueExpr(v, { timeUnit, type, undefinedIfExprNotRequired: true });
	        // return signal for the expression if we need an expression
	        if (expr !== undefined) {
	            return { signal: expr };
	        }
	        // otherwise just return the original value
	        return v;
	    });
	}
	/**
	 * Checks whether a fieldDef for a particular channel requires a computed bin range.
	 */
	function binRequiresRange(fieldDef, channel) {
	    if (!isBinning(fieldDef.bin)) {
	        console.warn('Only use this method with binned field defs');
	        return false;
	    }
	    // We need the range only when the user explicitly forces a binned field to be use discrete scale. In this case, bin range is used in axis and legend labels.
	    // We could check whether the axis or legend exists (not disabled) but that seems overkill.
	    return isScaleChannel(channel) && contains(['ordinal', 'nominal'], fieldDef.type);
	}

	var channeldef = /*#__PURE__*/Object.freeze({
		__proto__: null,
		isConditionalSelection: isConditionalSelection,
		isRepeatRef: isRepeatRef,
		toFieldDefBase: toFieldDefBase,
		isSortableFieldDef: isSortableFieldDef,
		isConditionalDef: isConditionalDef,
		hasConditionalFieldDef: hasConditionalFieldDef,
		hasConditionalValueDef: hasConditionalValueDef,
		isFieldDef: isFieldDef,
		isTypedFieldDef: isTypedFieldDef,
		isStringFieldDef: isStringFieldDef,
		isValueDef: isValueDef,
		isScaleFieldDef: isScaleFieldDef,
		isPositionFieldDef: isPositionFieldDef,
		isMarkPropFieldDef: isMarkPropFieldDef,
		isTextFieldDef: isTextFieldDef,
		vgField: vgField,
		isDiscrete: isDiscrete,
		isContinuous: isContinuous,
		isCount: isCount,
		verbalTitleFormatter: verbalTitleFormatter,
		functionalTitleFormatter: functionalTitleFormatter,
		defaultTitleFormatter: defaultTitleFormatter,
		setTitleFormatter: setTitleFormatter,
		resetTitleFormatter: resetTitleFormatter,
		title: title,
		getGuide: getGuide,
		defaultTitle: defaultTitle,
		format: format,
		defaultType: defaultType,
		getFieldDef: getFieldDef,
		getTypedFieldDef: getTypedFieldDef,
		normalize: normalize,
		normalizeFieldDef: normalizeFieldDef,
		normalizeBin: normalizeBin,
		channelCompatibility: channelCompatibility,
		isTimeFormatFieldDef: isTimeFormatFieldDef,
		isTimeFieldDef: isTimeFieldDef,
		valueExpr: valueExpr,
		valueArray: valueArray,
		binRequiresRange: binRequiresRange
	});

	var SpecParser_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.SpecParser = void 0;
















	class SpecParser {
	    getEncodingsMapFromPlotSchema(schema) {
	        const viewEncodings = new Map();
	        // a mark can also be configured using the "global" encoding of layered views, in this case the
	        // mark's encoding can be empty
	        if (schema.encoding === undefined) {
	            return viewEncodings;
	        }
	        const schemaEncodings = Object.keys(schema.encoding);
	        schemaEncodings.forEach((encoding) => {
	            viewEncodings.set(encoding, schema.encoding[encoding]);
	        });
	        return viewEncodings;
	    }
	    setSingleViewProperties(schema, view) {
	        view.description = schema.description;
	        view.bounds = schema.bounds;
	        view.width = schema.width;
	        view.height = schema.height;
	        view.config = schema.config;
	        view.datasets = schema.datasets;
	        view.projection = schema.projection;
	        if (view instanceof CompositionView_1.CompositionView) {
	            view.spacing = schema.spacing;
	            view.columns = schema.columns;
	        }
	    }
	    getNonRepeatSubtrees(view) {
	        const nonRepeatSubtrees = [];
	        view.visualElements.forEach(t => {
	            if (!(t instanceof RepeatView_1.RepeatView)) {
	                nonRepeatSubtrees.push(t);
	                nonRepeatSubtrees.push(...this.getNonRepeatSubtrees(t));
	            }
	        });
	        return nonRepeatSubtrees;
	    }
	    /**
	     * In a repeat spec, the bindings inside the child views can reference the repeated fields
	     * instead of fields from the data. In order to render such a view without its parent,
	     * modify this binding to the first entries in the repeated fields of the parent
	     */
	    removeRepeatFromChildViews(view) {
	        const nonRepeatSubViews = this.getNonRepeatSubtrees(view);
	        nonRepeatSubViews.forEach(childView => {
	            const repeatedFields = view.repeat.column.concat(view.repeat.row);
	            childView.encodings.forEach((value, key) => {
	                if (channeldef.isFieldDef(value)) {
	                    if (channeldef.isRepeatRef(value.field)) {
	                        const index = Math.floor(Math.random() * repeatedFields.length);
	                        const fieldRef = {
	                            field: repeatedFields[index],
	                            type: value.type
	                        };
	                        childView.overwrittenEncodings.set(key, fieldRef);
	                    }
	                }
	            });
	        });
	    }
	    getRepeatView(schema) {
	        const view = new RepeatView_1.RepeatView([]);
	        view.repeat = schema.repeat;
	        const childView = this.parse(schema.spec);
	        view.visualElements = [childView];
	        this.removeRepeatFromChildViews(view);
	        return view;
	    }
	    getFacetView(schema) {
	        const view = new FacetView_1.FacetView([]);
	        const visualElements = [];
	        if (schema.facet !== undefined) {
	            view.facet = JSON.parse(JSON.stringify(schema.facet));
	            delete schema.facet;
	            visualElements.push(this.parse(schema.spec));
	        }
	        else if (schema.encoding.facet !== undefined) {
	            view.isInlineFacetted = true;
	            view.facet = JSON.parse(JSON.stringify(schema.encoding.facet));
	            delete schema.encoding.facet;
	            visualElements.push(this.parse(schema));
	        }
	        view.visualElements = visualElements;
	        return view;
	    }
	    getLayerView(schema) {
	        const view = new LayerView_1.LayerView([]);
	        if (schema.encoding !== undefined) {
	            const groupEncodings = Object.keys(schema.encoding);
	            groupEncodings.forEach((encoding) => {
	                view.groupEncodings.set(encoding, schema.encoding[encoding]);
	            });
	        }
	        schema.layer.forEach((layer) => {
	            view.visualElements.push(this.parse(layer));
	        });
	        return view;
	    }
	    getConcatView(schema) {
	        const view = new ConcatView_1.ConcatView([]);
	        if (spec.isVConcatSpec(schema)) {
	            view.isVertical = true;
	            view.isWrappable = false;
	            schema.vconcat.forEach((layer) => {
	                view.visualElements.push(this.parse(layer));
	            });
	        }
	        else if (spec.isHConcatSpec(schema)) {
	            view.isVertical = false;
	            view.isWrappable = false;
	            schema.hconcat.forEach((layer) => {
	                view.visualElements.push(this.parse(layer));
	            });
	        }
	        else if (concat.isConcatSpec(schema)) {
	            view.isVertical = false;
	            view.isWrappable = true;
	            schema.concat.forEach((layer) => {
	                view.visualElements.push(this.parse(layer));
	            });
	        }
	        return view;
	    }
	    getCompositionView(schema) {
	        let view = null;
	        if (SpecUtils.isRepeatSchema(schema)) {
	            view = this.getRepeatView(schema);
	        }
	        else if (SpecUtils.isOverlaySchema(schema)) {
	            view = this.getLayerView(schema);
	        }
	        else if (SpecUtils.isFacetSchema(schema)) {
	            view = this.getFacetView(schema);
	        }
	        else if (SpecUtils.isConcatenateSchema(schema)) {
	            view = this.getConcatView(schema);
	        }
	        const encodings = this.getEncodingsMapFromPlotSchema(schema);
	        view.encodings = encodings;
	        view.resolve = schema.resolve;
	        view.visualElements.forEach(t => t.parent = view);
	        view.encodings.forEach((value, key) => {
	            view.visualElements.forEach(t => {
	                t.overwrittenEncodings.set(key, value);
	            });
	        });
	        return view;
	    }
	    getPlotView(schema) {
	        const plotView = new PlotView_1.PlotView(null);
	        plotView.mark = schema.mark;
	        const encodings = this.getEncodingsMapFromPlotSchema(schema);
	        const properties = SpecUtils.getMarkPropertiesAsMap(schema.mark);
	        plotView.encodings = encodings;
	        plotView.staticMarkProperties = properties;
	        return plotView;
	    }
	    getRootDatasetNode(schema) {
	        const data$1 = schema.data;
	        if (data$1 === undefined) {
	            return null;
	        }
	        let rootNode = null;
	        if (data.isUrlData(data$1)) {
	            rootNode = new URLDatasetNode_1.URLDatasetNode();
	        }
	        else if (data.isNamedData(data$1)) {
	            rootNode = new NamedDataSourceNode_1.NamedDataSourceNode();
	        }
	        else if (data.isInlineData(data$1)) {
	            rootNode = new InlineDatasetNode_1.InlineDatasetNode();
	        }
	        rootNode.setSchema(data$1);
	        return rootNode;
	    }
	    getLeafTransformNode(schema, rootNode) {
	        const transforms = schema.transform;
	        let workingNode = rootNode;
	        if (transforms === undefined) {
	            return rootNode;
	        }
	        // create linear transformation list from the spec by creating a new transformation node for
	        // each entry in the spec and linking it to the existin graph
	        if (transforms !== undefined) {
	            transforms.forEach(t => {
	                const transformNode = new TranformNode.TransformNode();
	                transformNode.transform = t;
	                DataModel.transformNames.forEach(transformName => {
	                    if (transformName in t) {
	                        transformNode.type = transformName;
	                    }
	                });
	                transformNode.parent = workingNode;
	                workingNode.children.push(transformNode);
	                workingNode = transformNode;
	            });
	        }
	        return workingNode;
	    }
	    parseDataTransformation(schema) {
	        const rootDataset = this.getRootDatasetNode(schema);
	        if (rootDataset === null) {
	            return rootDataset;
	        }
	        else {
	            return this.getLeafTransformNode(schema, rootDataset);
	        }
	    }
	    parse(schema) {
	        let view = null;
	        if (SpecUtils.isCompositionSchema(schema)) {
	            view = this.getCompositionView(schema);
	        }
	        else if (SpecUtils.isPlotSchema(schema)) {
	            view = this.getPlotView(schema);
	        }
	        this.setSingleViewProperties(schema, view);
	        const dataTransformation = this.parseDataTransformation(schema);
	        view.dataTransformationNode = dataTransformation;
	        SpecUtils.getJoinedDatasetsOfChildNodes(view);
	        if (view instanceof PlotView_1.PlotView) {
	            view.selection = schema.selection;
	        }
	        return view;
	    }
	}
	exports.SpecParser = SpecParser;
	});

	unwrapExports(SpecParser_1);
	SpecParser_1.SpecParser;

	var LayoutType = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.layouts = exports.PLOT_TYPES = exports.COMPOSITION_TYPES = void 0;
	exports.COMPOSITION_TYPES = ['repeat', 'overlay', 'facet', 'concatenate'];
	exports.PLOT_TYPES = ['node-link', 'bubble chart', 'timeline', 'radius',
	    'angular', 'polar coordinates', 'cartesian', 'histogram', 'parallel plot', 'star plot'];
	exports.layouts = exports.PLOT_TYPES.concat(exports.COMPOSITION_TYPES);
	});

	unwrapExports(LayoutType);
	LayoutType.layouts;
	LayoutType.PLOT_TYPES;
	LayoutType.COMPOSITION_TYPES;

	var MarkType = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.MARK_TYPES = void 0;
	exports.MARK_TYPES = ['area', 'bar', 'circle', 'geoshape', 'line', 'point', 'rect', 'rule', 'square', 'text', 'tick', 'trail'];
	});

	unwrapExports(MarkType);
	MarkType.MARK_TYPES;

	var ViewModel = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });

	Object.defineProperty(exports, "View", { enumerable: true, get: function () { return View_1.View; } });

	Object.defineProperty(exports, "PlotView", { enumerable: true, get: function () { return PlotView_1.PlotView; } });

	Object.defineProperty(exports, "CompositionView", { enumerable: true, get: function () { return CompositionView_1.CompositionView; } });

	Object.defineProperty(exports, "ConcatView", { enumerable: true, get: function () { return ConcatView_1.ConcatView; } });

	Object.defineProperty(exports, "FacetView", { enumerable: true, get: function () { return FacetView_1.FacetView; } });

	Object.defineProperty(exports, "LayerView", { enumerable: true, get: function () { return LayerView_1.LayerView; } });

	Object.defineProperty(exports, "RepeatView", { enumerable: true, get: function () { return RepeatView_1.RepeatView; } });

	Object.defineProperty(exports, "SpecCompiler", { enumerable: true, get: function () { return SpecCompiler_1.SpecCompiler; } });

	Object.defineProperty(exports, "SpecParser", { enumerable: true, get: function () { return SpecParser_1.SpecParser; } });

	Object.defineProperty(exports, "COMPOSITION_TYPES", { enumerable: true, get: function () { return LayoutType.COMPOSITION_TYPES; } });
	Object.defineProperty(exports, "PLOT_TYPES", { enumerable: true, get: function () { return LayoutType.PLOT_TYPES; } });
	Object.defineProperty(exports, "layouts", { enumerable: true, get: function () { return LayoutType.layouts; } });

	Object.defineProperty(exports, "positionEncodings", { enumerable: true, get: function () { return MarkEncoding.positionEncodings; } });
	Object.defineProperty(exports, "geographicPositionEncodings", { enumerable: true, get: function () { return MarkEncoding.geographicPositionEncodings; } });
	Object.defineProperty(exports, "facetChannelEncodings", { enumerable: true, get: function () { return MarkEncoding.facetChannelEncodings; } });
	Object.defineProperty(exports, "hyperLinkChannelEncodings", { enumerable: true, get: function () { return MarkEncoding.hyperLinkChannelEncodings; } });
	Object.defineProperty(exports, "keyChannelEncodings", { enumerable: true, get: function () { return MarkEncoding.keyChannelEncodings; } });
	Object.defineProperty(exports, "loDChannelEncodings", { enumerable: true, get: function () { return MarkEncoding.loDChannelEncodings; } });
	Object.defineProperty(exports, "markEncodingGroups", { enumerable: true, get: function () { return MarkEncoding.markEncodingGroups; } });
	Object.defineProperty(exports, "markEncodings", { enumerable: true, get: function () { return MarkEncoding.markEncodings; } });
	Object.defineProperty(exports, "markPropertiesChannelEncodings", { enumerable: true, get: function () { return MarkEncoding.markPropertiesChannelEncodings; } });
	Object.defineProperty(exports, "orderChannelEncodings", { enumerable: true, get: function () { return MarkEncoding.orderChannelEncodings; } });
	Object.defineProperty(exports, "textTooltipChannelEncodings", { enumerable: true, get: function () { return MarkEncoding.textTooltipChannelEncodings; } });

	Object.defineProperty(exports, "MARK_TYPES", { enumerable: true, get: function () { return MarkType.MARK_TYPES; } });
	});

	unwrapExports(ViewModel);

	/**
	 * Parses an URI
	 *
	 * @author Steven Levithan <stevenlevithan.com> (MIT license)
	 * @api private
	 */

	var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

	var parts = [
	    'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'
	];

	var parseuri = function parseuri(str) {
	    var src = str,
	        b = str.indexOf('['),
	        e = str.indexOf(']');

	    if (b != -1 && e != -1) {
	        str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
	    }

	    var m = re.exec(str || ''),
	        uri = {},
	        i = 14;

	    while (i--) {
	        uri[parts[i]] = m[i] || '';
	    }

	    if (b != -1 && e != -1) {
	        uri.source = src;
	        uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
	        uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
	        uri.ipv6uri = true;
	    }

	    uri.pathNames = pathNames(uri, uri['path']);
	    uri.queryKey = queryKey(uri, uri['query']);

	    return uri;
	};

	function pathNames(obj, path) {
	    var regx = /\/{2,9}/g,
	        names = path.replace(regx, "/").split("/");

	    if (path.substr(0, 1) == '/' || path.length === 0) {
	        names.splice(0, 1);
	    }
	    if (path.substr(path.length - 1, 1) == '/') {
	        names.splice(names.length - 1, 1);
	    }

	    return names;
	}

	function queryKey(uri, query) {
	    var data = {};

	    query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function ($0, $1, $2) {
	        if ($1) {
	            data[$1] = $2;
	        }
	    });

	    return data;
	}

	/**
	 * Helpers.
	 */

	var s = 1000;
	var m = s * 60;
	var h = m * 60;
	var d = h * 24;
	var w = d * 7;
	var y = d * 365.25;

	/**
	 * Parse or format the given `val`.
	 *
	 * Options:
	 *
	 *  - `long` verbose formatting [false]
	 *
	 * @param {String|Number} val
	 * @param {Object} [options]
	 * @throws {Error} throw an error if val is not a non-empty string or a number
	 * @return {String|Number}
	 * @api public
	 */

	var ms = function(val, options) {
	  options = options || {};
	  var type = typeof val;
	  if (type === 'string' && val.length > 0) {
	    return parse(val);
	  } else if (type === 'number' && isFinite(val)) {
	    return options.long ? fmtLong(val) : fmtShort(val);
	  }
	  throw new Error(
	    'val is not a non-empty string or a valid number. val=' +
	      JSON.stringify(val)
	  );
	};

	/**
	 * Parse the given `str` and return milliseconds.
	 *
	 * @param {String} str
	 * @return {Number}
	 * @api private
	 */

	function parse(str) {
	  str = String(str);
	  if (str.length > 100) {
	    return;
	  }
	  var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
	    str
	  );
	  if (!match) {
	    return;
	  }
	  var n = parseFloat(match[1]);
	  var type = (match[2] || 'ms').toLowerCase();
	  switch (type) {
	    case 'years':
	    case 'year':
	    case 'yrs':
	    case 'yr':
	    case 'y':
	      return n * y;
	    case 'weeks':
	    case 'week':
	    case 'w':
	      return n * w;
	    case 'days':
	    case 'day':
	    case 'd':
	      return n * d;
	    case 'hours':
	    case 'hour':
	    case 'hrs':
	    case 'hr':
	    case 'h':
	      return n * h;
	    case 'minutes':
	    case 'minute':
	    case 'mins':
	    case 'min':
	    case 'm':
	      return n * m;
	    case 'seconds':
	    case 'second':
	    case 'secs':
	    case 'sec':
	    case 's':
	      return n * s;
	    case 'milliseconds':
	    case 'millisecond':
	    case 'msecs':
	    case 'msec':
	    case 'ms':
	      return n;
	    default:
	      return undefined;
	  }
	}

	/**
	 * Short format for `ms`.
	 *
	 * @param {Number} ms
	 * @return {String}
	 * @api private
	 */

	function fmtShort(ms) {
	  var msAbs = Math.abs(ms);
	  if (msAbs >= d) {
	    return Math.round(ms / d) + 'd';
	  }
	  if (msAbs >= h) {
	    return Math.round(ms / h) + 'h';
	  }
	  if (msAbs >= m) {
	    return Math.round(ms / m) + 'm';
	  }
	  if (msAbs >= s) {
	    return Math.round(ms / s) + 's';
	  }
	  return ms + 'ms';
	}

	/**
	 * Long format for `ms`.
	 *
	 * @param {Number} ms
	 * @return {String}
	 * @api private
	 */

	function fmtLong(ms) {
	  var msAbs = Math.abs(ms);
	  if (msAbs >= d) {
	    return plural(ms, msAbs, d, 'day');
	  }
	  if (msAbs >= h) {
	    return plural(ms, msAbs, h, 'hour');
	  }
	  if (msAbs >= m) {
	    return plural(ms, msAbs, m, 'minute');
	  }
	  if (msAbs >= s) {
	    return plural(ms, msAbs, s, 'second');
	  }
	  return ms + ' ms';
	}

	/**
	 * Pluralization helper.
	 */

	function plural(ms, msAbs, n, name) {
	  var isPlural = msAbs >= n * 1.5;
	  return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
	}

	/**
	 * This is the common logic for both the Node.js and web browser
	 * implementations of `debug()`.
	 */

	function setup(env) {
		createDebug.debug = createDebug;
		createDebug.default = createDebug;
		createDebug.coerce = coerce;
		createDebug.disable = disable;
		createDebug.enable = enable;
		createDebug.enabled = enabled;
		createDebug.humanize = ms;
		createDebug.destroy = destroy;

		Object.keys(env).forEach(key => {
			createDebug[key] = env[key];
		});

		/**
		* The currently active debug mode names, and names to skip.
		*/

		createDebug.names = [];
		createDebug.skips = [];

		/**
		* Map of special "%n" handling functions, for the debug "format" argument.
		*
		* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
		*/
		createDebug.formatters = {};

		/**
		* Selects a color for a debug namespace
		* @param {String} namespace The namespace string for the for the debug instance to be colored
		* @return {Number|String} An ANSI color code for the given namespace
		* @api private
		*/
		function selectColor(namespace) {
			let hash = 0;

			for (let i = 0; i < namespace.length; i++) {
				hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
				hash |= 0; // Convert to 32bit integer
			}

			return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
		}
		createDebug.selectColor = selectColor;

		/**
		* Create a debugger with the given `namespace`.
		*
		* @param {String} namespace
		* @return {Function}
		* @api public
		*/
		function createDebug(namespace) {
			let prevTime;
			let enableOverride = null;

			function debug(...args) {
				// Disabled?
				if (!debug.enabled) {
					return;
				}

				const self = debug;

				// Set `diff` timestamp
				const curr = Number(new Date());
				const ms = curr - (prevTime || curr);
				self.diff = ms;
				self.prev = prevTime;
				self.curr = curr;
				prevTime = curr;

				args[0] = createDebug.coerce(args[0]);

				if (typeof args[0] !== 'string') {
					// Anything else let's inspect with %O
					args.unshift('%O');
				}

				// Apply any `formatters` transformations
				let index = 0;
				args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
					// If we encounter an escaped % then don't increase the array index
					if (match === '%%') {
						return '%';
					}
					index++;
					const formatter = createDebug.formatters[format];
					if (typeof formatter === 'function') {
						const val = args[index];
						match = formatter.call(self, val);

						// Now we need to remove `args[index]` since it's inlined in the `format`
						args.splice(index, 1);
						index--;
					}
					return match;
				});

				// Apply env-specific formatting (colors, etc.)
				createDebug.formatArgs.call(self, args);

				const logFn = self.log || createDebug.log;
				logFn.apply(self, args);
			}

			debug.namespace = namespace;
			debug.useColors = createDebug.useColors();
			debug.color = createDebug.selectColor(namespace);
			debug.extend = extend;
			debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.

			Object.defineProperty(debug, 'enabled', {
				enumerable: true,
				configurable: false,
				get: () => enableOverride === null ? createDebug.enabled(namespace) : enableOverride,
				set: v => {
					enableOverride = v;
				}
			});

			// Env-specific initialization logic for debug instances
			if (typeof createDebug.init === 'function') {
				createDebug.init(debug);
			}

			return debug;
		}

		function extend(namespace, delimiter) {
			const newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
			newDebug.log = this.log;
			return newDebug;
		}

		/**
		* Enables a debug mode by namespaces. This can include modes
		* separated by a colon and wildcards.
		*
		* @param {String} namespaces
		* @api public
		*/
		function enable(namespaces) {
			createDebug.save(namespaces);

			createDebug.names = [];
			createDebug.skips = [];

			let i;
			const split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
			const len = split.length;

			for (i = 0; i < len; i++) {
				if (!split[i]) {
					// ignore empty strings
					continue;
				}

				namespaces = split[i].replace(/\*/g, '.*?');

				if (namespaces[0] === '-') {
					createDebug.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
				} else {
					createDebug.names.push(new RegExp('^' + namespaces + '$'));
				}
			}
		}

		/**
		* Disable debug output.
		*
		* @return {String} namespaces
		* @api public
		*/
		function disable() {
			const namespaces = [
				...createDebug.names.map(toNamespace),
				...createDebug.skips.map(toNamespace).map(namespace => '-' + namespace)
			].join(',');
			createDebug.enable('');
			return namespaces;
		}

		/**
		* Returns true if the given mode name is enabled, false otherwise.
		*
		* @param {String} name
		* @return {Boolean}
		* @api public
		*/
		function enabled(name) {
			if (name[name.length - 1] === '*') {
				return true;
			}

			let i;
			let len;

			for (i = 0, len = createDebug.skips.length; i < len; i++) {
				if (createDebug.skips[i].test(name)) {
					return false;
				}
			}

			for (i = 0, len = createDebug.names.length; i < len; i++) {
				if (createDebug.names[i].test(name)) {
					return true;
				}
			}

			return false;
		}

		/**
		* Convert regexp to namespace
		*
		* @param {RegExp} regxep
		* @return {String} namespace
		* @api private
		*/
		function toNamespace(regexp) {
			return regexp.toString()
				.substring(2, regexp.toString().length - 2)
				.replace(/\.\*\?$/, '*');
		}

		/**
		* Coerce `val`.
		*
		* @param {Mixed} val
		* @return {Mixed}
		* @api private
		*/
		function coerce(val) {
			if (val instanceof Error) {
				return val.stack || val.message;
			}
			return val;
		}

		/**
		* XXX DO NOT USE. This is a temporary stub function.
		* XXX It WILL be removed in the next major release.
		*/
		function destroy() {
			console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
		}

		createDebug.enable(createDebug.load());

		return createDebug;
	}

	var common = setup;

	var browser = createCommonjsModule(function (module, exports) {
	/* eslint-env browser */

	/**
	 * This is the web browser implementation of `debug()`.
	 */

	exports.formatArgs = formatArgs;
	exports.save = save;
	exports.load = load;
	exports.useColors = useColors;
	exports.storage = localstorage();
	exports.destroy = (() => {
		let warned = false;

		return () => {
			if (!warned) {
				warned = true;
				console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
			}
		};
	})();

	/**
	 * Colors.
	 */

	exports.colors = [
		'#0000CC',
		'#0000FF',
		'#0033CC',
		'#0033FF',
		'#0066CC',
		'#0066FF',
		'#0099CC',
		'#0099FF',
		'#00CC00',
		'#00CC33',
		'#00CC66',
		'#00CC99',
		'#00CCCC',
		'#00CCFF',
		'#3300CC',
		'#3300FF',
		'#3333CC',
		'#3333FF',
		'#3366CC',
		'#3366FF',
		'#3399CC',
		'#3399FF',
		'#33CC00',
		'#33CC33',
		'#33CC66',
		'#33CC99',
		'#33CCCC',
		'#33CCFF',
		'#6600CC',
		'#6600FF',
		'#6633CC',
		'#6633FF',
		'#66CC00',
		'#66CC33',
		'#9900CC',
		'#9900FF',
		'#9933CC',
		'#9933FF',
		'#99CC00',
		'#99CC33',
		'#CC0000',
		'#CC0033',
		'#CC0066',
		'#CC0099',
		'#CC00CC',
		'#CC00FF',
		'#CC3300',
		'#CC3333',
		'#CC3366',
		'#CC3399',
		'#CC33CC',
		'#CC33FF',
		'#CC6600',
		'#CC6633',
		'#CC9900',
		'#CC9933',
		'#CCCC00',
		'#CCCC33',
		'#FF0000',
		'#FF0033',
		'#FF0066',
		'#FF0099',
		'#FF00CC',
		'#FF00FF',
		'#FF3300',
		'#FF3333',
		'#FF3366',
		'#FF3399',
		'#FF33CC',
		'#FF33FF',
		'#FF6600',
		'#FF6633',
		'#FF9900',
		'#FF9933',
		'#FFCC00',
		'#FFCC33'
	];

	/**
	 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
	 * and the Firebug extension (any Firefox version) are known
	 * to support "%c" CSS customizations.
	 *
	 * TODO: add a `localStorage` variable to explicitly enable/disable colors
	 */

	// eslint-disable-next-line complexity
	function useColors() {
		// NB: In an Electron preload script, document will be defined but not fully
		// initialized. Since we know we're in Chrome, we'll just detect this case
		// explicitly
		if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
			return true;
		}

		// Internet Explorer and Edge do not support colors.
		if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
			return false;
		}

		// Is webkit? http://stackoverflow.com/a/16459606/376773
		// document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
		return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
			// Is firebug? http://stackoverflow.com/a/398120/376773
			(typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
			// Is firefox >= v31?
			// https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
			(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
			// Double check webkit in userAgent just in case we are in a worker
			(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
	}

	/**
	 * Colorize log arguments if enabled.
	 *
	 * @api public
	 */

	function formatArgs(args) {
		args[0] = (this.useColors ? '%c' : '') +
			this.namespace +
			(this.useColors ? ' %c' : ' ') +
			args[0] +
			(this.useColors ? '%c ' : ' ') +
			'+' + module.exports.humanize(this.diff);

		if (!this.useColors) {
			return;
		}

		const c = 'color: ' + this.color;
		args.splice(1, 0, c, 'color: inherit');

		// The final "%c" is somewhat tricky, because there could be other
		// arguments passed either before or after the %c, so we need to
		// figure out the correct index to insert the CSS into
		let index = 0;
		let lastC = 0;
		args[0].replace(/%[a-zA-Z%]/g, match => {
			if (match === '%%') {
				return;
			}
			index++;
			if (match === '%c') {
				// We only are interested in the *last* %c
				// (the user may have provided their own)
				lastC = index;
			}
		});

		args.splice(lastC, 0, c);
	}

	/**
	 * Invokes `console.debug()` when available.
	 * No-op when `console.debug` is not a "function".
	 * If `console.debug` is not available, falls back
	 * to `console.log`.
	 *
	 * @api public
	 */
	exports.log = console.debug || console.log || (() => {});

	/**
	 * Save `namespaces`.
	 *
	 * @param {String} namespaces
	 * @api private
	 */
	function save(namespaces) {
		try {
			if (namespaces) {
				exports.storage.setItem('debug', namespaces);
			} else {
				exports.storage.removeItem('debug');
			}
		} catch (error) {
			// Swallow
			// XXX (@Qix-) should we be logging these?
		}
	}

	/**
	 * Load `namespaces`.
	 *
	 * @return {String} returns the previously persisted debug modes
	 * @api private
	 */
	function load() {
		let r;
		try {
			r = exports.storage.getItem('debug');
		} catch (error) {
			// Swallow
			// XXX (@Qix-) should we be logging these?
		}

		// If debug isn't set in LS, and we're in Electron, try to load $DEBUG
		if (!r && typeof process !== 'undefined' && 'env' in process) {
			r = process.env.DEBUG;
		}

		return r;
	}

	/**
	 * Localstorage attempts to return the localstorage.
	 *
	 * This is necessary because safari throws
	 * when a user disables cookies/localstorage
	 * and you attempt to access it.
	 *
	 * @return {LocalStorage}
	 * @api private
	 */

	function localstorage() {
		try {
			// TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
			// The Browser also has localStorage in the global context.
			return localStorage;
		} catch (error) {
			// Swallow
			// XXX (@Qix-) should we be logging these?
		}
	}

	module.exports = common(exports);

	const {formatters} = module.exports;

	/**
	 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
	 */

	formatters.j = function (v) {
		try {
			return JSON.stringify(v);
		} catch (error) {
			return '[UnexpectedJSONParseError]: ' + error.message;
		}
	};
	});
	browser.formatArgs;
	browser.save;
	browser.load;
	browser.useColors;
	browser.storage;
	browser.destroy;
	browser.colors;
	browser.log;

	var url_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.url = void 0;

	const debug = browser("socket.io-client:url");
	/**
	 * URL parser.
	 *
	 * @param uri - url
	 * @param loc - An object meant to mimic window.location.
	 *        Defaults to window.location.
	 * @public
	 */
	function url(uri, loc) {
	    let obj = uri;
	    // default to window.location
	    loc = loc || (typeof location !== "undefined" && location);
	    if (null == uri)
	        uri = loc.protocol + "//" + loc.host;
	    // relative path support
	    if (typeof uri === "string") {
	        if ("/" === uri.charAt(0)) {
	            if ("/" === uri.charAt(1)) {
	                uri = loc.protocol + uri;
	            }
	            else {
	                uri = loc.host + uri;
	            }
	        }
	        if (!/^(https?|wss?):\/\//.test(uri)) {
	            debug("protocol-less url %s", uri);
	            if ("undefined" !== typeof loc) {
	                uri = loc.protocol + "//" + uri;
	            }
	            else {
	                uri = "https://" + uri;
	            }
	        }
	        // parse
	        debug("parse %s", uri);
	        obj = parseuri(uri);
	    }
	    // make sure we treat `localhost:80` and `localhost` equally
	    if (!obj.port) {
	        if (/^(http|ws)$/.test(obj.protocol)) {
	            obj.port = "80";
	        }
	        else if (/^(http|ws)s$/.test(obj.protocol)) {
	            obj.port = "443";
	        }
	    }
	    obj.path = obj.path || "/";
	    const ipv6 = obj.host.indexOf(":") !== -1;
	    const host = ipv6 ? "[" + obj.host + "]" : obj.host;
	    // define unique id
	    obj.id = obj.protocol + "://" + host + ":" + obj.port;
	    // define href
	    obj.href =
	        obj.protocol +
	            "://" +
	            host +
	            (loc && loc.port === obj.port ? "" : ":" + obj.port);
	    return obj;
	}
	exports.url = url;
	});

	unwrapExports(url_1);
	url_1.url;

	var hasCors = createCommonjsModule(function (module) {
	/**
	 * Module exports.
	 *
	 * Logic borrowed from Modernizr:
	 *
	 *   - https://github.com/Modernizr/Modernizr/blob/master/feature-detects/cors.js
	 */

	try {
	  module.exports = typeof XMLHttpRequest !== 'undefined' &&
	    'withCredentials' in new XMLHttpRequest();
	} catch (err) {
	  // if XMLHttp support is disabled in IE then it will throw
	  // when trying to create
	  module.exports = false;
	}
	});

	var globalThis_browser = (() => {
	  if (typeof self !== "undefined") {
	    return self;
	  } else if (typeof window !== "undefined") {
	    return window;
	  } else {
	    return Function("return this")();
	  }
	})();

	// browser shim for xmlhttprequest module




	var xmlhttprequest = function(opts) {
	  const xdomain = opts.xdomain;

	  // scheme must be same when usign XDomainRequest
	  // http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx
	  const xscheme = opts.xscheme;

	  // XDomainRequest has a flow of not sending cookie, therefore it should be disabled as a default.
	  // https://github.com/Automattic/engine.io-client/pull/217
	  const enablesXDR = opts.enablesXDR;

	  // XMLHttpRequest can be disabled on IE
	  try {
	    if ("undefined" !== typeof XMLHttpRequest && (!xdomain || hasCors)) {
	      return new XMLHttpRequest();
	    }
	  } catch (e) {}

	  // Use XDomainRequest for IE8 if enablesXDR is true
	  // because loading bar keeps flashing when using jsonp-polling
	  // https://github.com/yujiosaka/socke.io-ie8-loading-example
	  try {
	    if ("undefined" !== typeof XDomainRequest && !xscheme && enablesXDR) {
	      return new XDomainRequest();
	    }
	  } catch (e) {}

	  if (!xdomain) {
	    try {
	      return new globalThis_browser[["Active"].concat("Object").join("X")](
	        "Microsoft.XMLHTTP"
	      );
	    } catch (e) {}
	  }
	};

	const PACKET_TYPES = Object.create(null); // no Map = no polyfill
	PACKET_TYPES["open"] = "0";
	PACKET_TYPES["close"] = "1";
	PACKET_TYPES["ping"] = "2";
	PACKET_TYPES["pong"] = "3";
	PACKET_TYPES["message"] = "4";
	PACKET_TYPES["upgrade"] = "5";
	PACKET_TYPES["noop"] = "6";

	const PACKET_TYPES_REVERSE = Object.create(null);
	Object.keys(PACKET_TYPES).forEach(key => {
	  PACKET_TYPES_REVERSE[PACKET_TYPES[key]] = key;
	});

	const ERROR_PACKET = { type: "error", data: "parser error" };

	var commons = {
	  PACKET_TYPES,
	  PACKET_TYPES_REVERSE,
	  ERROR_PACKET
	};

	const { PACKET_TYPES: PACKET_TYPES$1 } = commons;

	const withNativeBlob =
	  typeof Blob === "function" ||
	  (typeof Blob !== "undefined" &&
	    Object.prototype.toString.call(Blob) === "[object BlobConstructor]");
	const withNativeArrayBuffer = typeof ArrayBuffer === "function";

	// ArrayBuffer.isView method is not defined in IE10
	const isView = obj => {
	  return typeof ArrayBuffer.isView === "function"
	    ? ArrayBuffer.isView(obj)
	    : obj && obj.buffer instanceof ArrayBuffer;
	};

	const encodePacket = ({ type, data }, supportsBinary, callback) => {
	  if (withNativeBlob && data instanceof Blob) {
	    if (supportsBinary) {
	      return callback(data);
	    } else {
	      return encodeBlobAsBase64(data, callback);
	    }
	  } else if (
	    withNativeArrayBuffer &&
	    (data instanceof ArrayBuffer || isView(data))
	  ) {
	    if (supportsBinary) {
	      return callback(data instanceof ArrayBuffer ? data : data.buffer);
	    } else {
	      return encodeBlobAsBase64(new Blob([data]), callback);
	    }
	  }
	  // plain string
	  return callback(PACKET_TYPES$1[type] + (data || ""));
	};

	const encodeBlobAsBase64 = (data, callback) => {
	  const fileReader = new FileReader();
	  fileReader.onload = function() {
	    const content = fileReader.result.split(",")[1];
	    callback("b" + content);
	  };
	  return fileReader.readAsDataURL(data);
	};

	var encodePacket_browser = encodePacket;

	var base64Arraybuffer = createCommonjsModule(function (module, exports) {
	/*
	 * base64-arraybuffer
	 * https://github.com/niklasvh/base64-arraybuffer
	 *
	 * Copyright (c) 2012 Niklas von Hertzen
	 * Licensed under the MIT license.
	 */
	(function(chars){

	  exports.encode = function(arraybuffer) {
	    var bytes = new Uint8Array(arraybuffer),
	    i, len = bytes.length, base64 = "";

	    for (i = 0; i < len; i+=3) {
	      base64 += chars[bytes[i] >> 2];
	      base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
	      base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
	      base64 += chars[bytes[i + 2] & 63];
	    }

	    if ((len % 3) === 2) {
	      base64 = base64.substring(0, base64.length - 1) + "=";
	    } else if (len % 3 === 1) {
	      base64 = base64.substring(0, base64.length - 2) + "==";
	    }

	    return base64;
	  };

	  exports.decode =  function(base64) {
	    var bufferLength = base64.length * 0.75,
	    len = base64.length, i, p = 0,
	    encoded1, encoded2, encoded3, encoded4;

	    if (base64[base64.length - 1] === "=") {
	      bufferLength--;
	      if (base64[base64.length - 2] === "=") {
	        bufferLength--;
	      }
	    }

	    var arraybuffer = new ArrayBuffer(bufferLength),
	    bytes = new Uint8Array(arraybuffer);

	    for (i = 0; i < len; i+=4) {
	      encoded1 = chars.indexOf(base64[i]);
	      encoded2 = chars.indexOf(base64[i+1]);
	      encoded3 = chars.indexOf(base64[i+2]);
	      encoded4 = chars.indexOf(base64[i+3]);

	      bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
	      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
	      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
	    }

	    return arraybuffer;
	  };
	})("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/");
	});
	base64Arraybuffer.encode;
	base64Arraybuffer.decode;

	const { PACKET_TYPES_REVERSE: PACKET_TYPES_REVERSE$1, ERROR_PACKET: ERROR_PACKET$1 } = commons;

	const withNativeArrayBuffer$1 = typeof ArrayBuffer === "function";

	let base64decoder;
	if (withNativeArrayBuffer$1) {
	  base64decoder = base64Arraybuffer;
	}

	const decodePacket = (encodedPacket, binaryType) => {
	  if (typeof encodedPacket !== "string") {
	    return {
	      type: "message",
	      data: mapBinary(encodedPacket, binaryType)
	    };
	  }
	  const type = encodedPacket.charAt(0);
	  if (type === "b") {
	    return {
	      type: "message",
	      data: decodeBase64Packet(encodedPacket.substring(1), binaryType)
	    };
	  }
	  const packetType = PACKET_TYPES_REVERSE$1[type];
	  if (!packetType) {
	    return ERROR_PACKET$1;
	  }
	  return encodedPacket.length > 1
	    ? {
	        type: PACKET_TYPES_REVERSE$1[type],
	        data: encodedPacket.substring(1)
	      }
	    : {
	        type: PACKET_TYPES_REVERSE$1[type]
	      };
	};

	const decodeBase64Packet = (data, binaryType) => {
	  if (base64decoder) {
	    const decoded = base64decoder.decode(data);
	    return mapBinary(decoded, binaryType);
	  } else {
	    return { base64: true, data }; // fallback for old browsers
	  }
	};

	const mapBinary = (data, binaryType) => {
	  switch (binaryType) {
	    case "blob":
	      return data instanceof ArrayBuffer ? new Blob([data]) : data;
	    case "arraybuffer":
	    default:
	      return data; // assuming the data is already an ArrayBuffer
	  }
	};

	var decodePacket_browser = decodePacket;

	const SEPARATOR = String.fromCharCode(30); // see https://en.wikipedia.org/wiki/Delimiter#ASCII_delimited_text

	const encodePayload = (packets, callback) => {
	  // some packets may be added to the array while encoding, so the initial length must be saved
	  const length = packets.length;
	  const encodedPackets = new Array(length);
	  let count = 0;

	  packets.forEach((packet, i) => {
	    // force base64 encoding for binary packets
	    encodePacket_browser(packet, false, encodedPacket => {
	      encodedPackets[i] = encodedPacket;
	      if (++count === length) {
	        callback(encodedPackets.join(SEPARATOR));
	      }
	    });
	  });
	};

	const decodePayload = (encodedPayload, binaryType) => {
	  const encodedPackets = encodedPayload.split(SEPARATOR);
	  const packets = [];
	  for (let i = 0; i < encodedPackets.length; i++) {
	    const decodedPacket = decodePacket_browser(encodedPackets[i], binaryType);
	    packets.push(decodedPacket);
	    if (decodedPacket.type === "error") {
	      break;
	    }
	  }
	  return packets;
	};

	var lib = {
	  protocol: 4,
	  encodePacket: encodePacket_browser,
	  encodePayload,
	  decodePacket: decodePacket_browser,
	  decodePayload
	};

	var componentEmitter = createCommonjsModule(function (module) {
	/**
	 * Expose `Emitter`.
	 */

	{
	  module.exports = Emitter;
	}

	/**
	 * Initialize a new `Emitter`.
	 *
	 * @api public
	 */

	function Emitter(obj) {
	  if (obj) return mixin(obj);
	}
	/**
	 * Mixin the emitter properties.
	 *
	 * @param {Object} obj
	 * @return {Object}
	 * @api private
	 */

	function mixin(obj) {
	  for (var key in Emitter.prototype) {
	    obj[key] = Emitter.prototype[key];
	  }
	  return obj;
	}

	/**
	 * Listen on the given `event` with `fn`.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */

	Emitter.prototype.on =
	Emitter.prototype.addEventListener = function(event, fn){
	  this._callbacks = this._callbacks || {};
	  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
	    .push(fn);
	  return this;
	};

	/**
	 * Adds an `event` listener that will be invoked a single
	 * time then automatically removed.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */

	Emitter.prototype.once = function(event, fn){
	  function on() {
	    this.off(event, on);
	    fn.apply(this, arguments);
	  }

	  on.fn = fn;
	  this.on(event, on);
	  return this;
	};

	/**
	 * Remove the given callback for `event` or all
	 * registered callbacks.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */

	Emitter.prototype.off =
	Emitter.prototype.removeListener =
	Emitter.prototype.removeAllListeners =
	Emitter.prototype.removeEventListener = function(event, fn){
	  this._callbacks = this._callbacks || {};

	  // all
	  if (0 == arguments.length) {
	    this._callbacks = {};
	    return this;
	  }

	  // specific event
	  var callbacks = this._callbacks['$' + event];
	  if (!callbacks) return this;

	  // remove all handlers
	  if (1 == arguments.length) {
	    delete this._callbacks['$' + event];
	    return this;
	  }

	  // remove specific handler
	  var cb;
	  for (var i = 0; i < callbacks.length; i++) {
	    cb = callbacks[i];
	    if (cb === fn || cb.fn === fn) {
	      callbacks.splice(i, 1);
	      break;
	    }
	  }

	  // Remove event specific arrays for event types that no
	  // one is subscribed for to avoid memory leak.
	  if (callbacks.length === 0) {
	    delete this._callbacks['$' + event];
	  }

	  return this;
	};

	/**
	 * Emit `event` with the given args.
	 *
	 * @param {String} event
	 * @param {Mixed} ...
	 * @return {Emitter}
	 */

	Emitter.prototype.emit = function(event){
	  this._callbacks = this._callbacks || {};

	  var args = new Array(arguments.length - 1)
	    , callbacks = this._callbacks['$' + event];

	  for (var i = 1; i < arguments.length; i++) {
	    args[i - 1] = arguments[i];
	  }

	  if (callbacks) {
	    callbacks = callbacks.slice(0);
	    for (var i = 0, len = callbacks.length; i < len; ++i) {
	      callbacks[i].apply(this, args);
	    }
	  }

	  return this;
	};

	/**
	 * Return array of callbacks for `event`.
	 *
	 * @param {String} event
	 * @return {Array}
	 * @api public
	 */

	Emitter.prototype.listeners = function(event){
	  this._callbacks = this._callbacks || {};
	  return this._callbacks['$' + event] || [];
	};

	/**
	 * Check if this emitter has `event` handlers.
	 *
	 * @param {String} event
	 * @return {Boolean}
	 * @api public
	 */

	Emitter.prototype.hasListeners = function(event){
	  return !! this.listeners(event).length;
	};
	});

	class Transport extends componentEmitter {
	  /**
	   * Transport abstract constructor.
	   *
	   * @param {Object} options.
	   * @api private
	   */
	  constructor(opts) {
	    super();

	    this.opts = opts;
	    this.query = opts.query;
	    this.readyState = "";
	    this.socket = opts.socket;
	  }

	  /**
	   * Emits an error.
	   *
	   * @param {String} str
	   * @return {Transport} for chaining
	   * @api public
	   */
	  onError(msg, desc) {
	    const err = new Error(msg);
	    err.type = "TransportError";
	    err.description = desc;
	    this.emit("error", err);
	    return this;
	  }

	  /**
	   * Opens the transport.
	   *
	   * @api public
	   */
	  open() {
	    if ("closed" === this.readyState || "" === this.readyState) {
	      this.readyState = "opening";
	      this.doOpen();
	    }

	    return this;
	  }

	  /**
	   * Closes the transport.
	   *
	   * @api private
	   */
	  close() {
	    if ("opening" === this.readyState || "open" === this.readyState) {
	      this.doClose();
	      this.onClose();
	    }

	    return this;
	  }

	  /**
	   * Sends multiple packets.
	   *
	   * @param {Array} packets
	   * @api private
	   */
	  send(packets) {
	    if ("open" === this.readyState) {
	      this.write(packets);
	    } else {
	      throw new Error("Transport not open");
	    }
	  }

	  /**
	   * Called upon open
	   *
	   * @api private
	   */
	  onOpen() {
	    this.readyState = "open";
	    this.writable = true;
	    this.emit("open");
	  }

	  /**
	   * Called with data.
	   *
	   * @param {String} data
	   * @api private
	   */
	  onData(data) {
	    const packet = lib.decodePacket(data, this.socket.binaryType);
	    this.onPacket(packet);
	  }

	  /**
	   * Called with a decoded packet.
	   */
	  onPacket(packet) {
	    this.emit("packet", packet);
	  }

	  /**
	   * Called upon close.
	   *
	   * @api private
	   */
	  onClose() {
	    this.readyState = "closed";
	    this.emit("close");
	  }
	}

	var transport = Transport;

	/**
	 * Compiles a querystring
	 * Returns string representation of the object
	 *
	 * @param {Object}
	 * @api private
	 */

	var encode = function (obj) {
	  var str = '';

	  for (var i in obj) {
	    if (obj.hasOwnProperty(i)) {
	      if (str.length) str += '&';
	      str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
	    }
	  }

	  return str;
	};

	/**
	 * Parses a simple querystring into an object
	 *
	 * @param {String} qs
	 * @api private
	 */

	var decode = function(qs){
	  var qry = {};
	  var pairs = qs.split('&');
	  for (var i = 0, l = pairs.length; i < l; i++) {
	    var pair = pairs[i].split('=');
	    qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
	  }
	  return qry;
	};

	var parseqs = {
		encode: encode,
		decode: decode
	};

	var alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'.split('')
	  , length = 64
	  , map = {}
	  , seed = 0
	  , i = 0
	  , prev;

	/**
	 * Return a string representing the specified number.
	 *
	 * @param {Number} num The number to convert.
	 * @returns {String} The string representation of the number.
	 * @api public
	 */
	function encode$1(num) {
	  var encoded = '';

	  do {
	    encoded = alphabet[num % length] + encoded;
	    num = Math.floor(num / length);
	  } while (num > 0);

	  return encoded;
	}

	/**
	 * Return the integer value specified by the given string.
	 *
	 * @param {String} str The string to convert.
	 * @returns {Number} The integer value represented by the string.
	 * @api public
	 */
	function decode$1(str) {
	  var decoded = 0;

	  for (i = 0; i < str.length; i++) {
	    decoded = decoded * length + map[str.charAt(i)];
	  }

	  return decoded;
	}

	/**
	 * Yeast: A tiny growing id generator.
	 *
	 * @returns {String} A unique id.
	 * @api public
	 */
	function yeast() {
	  var now = encode$1(+new Date());

	  if (now !== prev) return seed = 0, prev = now;
	  return now +'.'+ encode$1(seed++);
	}

	//
	// Map each character to its index.
	//
	for (; i < length; i++) map[alphabet[i]] = i;

	//
	// Expose the `yeast`, `encode` and `decode` functions.
	//
	yeast.encode = encode$1;
	yeast.decode = decode$1;
	var yeast_1 = yeast;

	const debug = browser("engine.io-client:polling");

	class Polling extends transport {
	  /**
	   * Transport name.
	   */
	  get name() {
	    return "polling";
	  }

	  /**
	   * Opens the socket (triggers polling). We write a PING message to determine
	   * when the transport is open.
	   *
	   * @api private
	   */
	  doOpen() {
	    this.poll();
	  }

	  /**
	   * Pauses polling.
	   *
	   * @param {Function} callback upon buffers are flushed and transport is paused
	   * @api private
	   */
	  pause(onPause) {
	    const self = this;

	    this.readyState = "pausing";

	    function pause() {
	      debug("paused");
	      self.readyState = "paused";
	      onPause();
	    }

	    if (this.polling || !this.writable) {
	      let total = 0;

	      if (this.polling) {
	        debug("we are currently polling - waiting to pause");
	        total++;
	        this.once("pollComplete", function() {
	          debug("pre-pause polling complete");
	          --total || pause();
	        });
	      }

	      if (!this.writable) {
	        debug("we are currently writing - waiting to pause");
	        total++;
	        this.once("drain", function() {
	          debug("pre-pause writing complete");
	          --total || pause();
	        });
	      }
	    } else {
	      pause();
	    }
	  }

	  /**
	   * Starts polling cycle.
	   *
	   * @api public
	   */
	  poll() {
	    debug("polling");
	    this.polling = true;
	    this.doPoll();
	    this.emit("poll");
	  }

	  /**
	   * Overloads onData to detect payloads.
	   *
	   * @api private
	   */
	  onData(data) {
	    const self = this;
	    debug("polling got data %s", data);
	    const callback = function(packet, index, total) {
	      // if its the first message we consider the transport open
	      if ("opening" === self.readyState && packet.type === "open") {
	        self.onOpen();
	      }

	      // if its a close packet, we close the ongoing requests
	      if ("close" === packet.type) {
	        self.onClose();
	        return false;
	      }

	      // otherwise bypass onData and handle the message
	      self.onPacket(packet);
	    };

	    // decode payload
	    lib.decodePayload(data, this.socket.binaryType).forEach(callback);

	    // if an event did not trigger closing
	    if ("closed" !== this.readyState) {
	      // if we got data we're not polling
	      this.polling = false;
	      this.emit("pollComplete");

	      if ("open" === this.readyState) {
	        this.poll();
	      } else {
	        debug('ignoring poll - transport state "%s"', this.readyState);
	      }
	    }
	  }

	  /**
	   * For polling, send a close packet.
	   *
	   * @api private
	   */
	  doClose() {
	    const self = this;

	    function close() {
	      debug("writing close packet");
	      self.write([{ type: "close" }]);
	    }

	    if ("open" === this.readyState) {
	      debug("transport open - closing");
	      close();
	    } else {
	      // in case we're trying to close while
	      // handshaking is in progress (GH-164)
	      debug("transport not open - deferring close");
	      this.once("open", close);
	    }
	  }

	  /**
	   * Writes a packets payload.
	   *
	   * @param {Array} data packets
	   * @param {Function} drain callback
	   * @api private
	   */
	  write(packets) {
	    this.writable = false;

	    lib.encodePayload(packets, data => {
	      this.doWrite(data, () => {
	        this.writable = true;
	        this.emit("drain");
	      });
	    });
	  }

	  /**
	   * Generates uri for connection.
	   *
	   * @api private
	   */
	  uri() {
	    let query = this.query || {};
	    const schema = this.opts.secure ? "https" : "http";
	    let port = "";

	    // cache busting is forced
	    if (false !== this.opts.timestampRequests) {
	      query[this.opts.timestampParam] = yeast_1();
	    }

	    if (!this.supportsBinary && !query.sid) {
	      query.b64 = 1;
	    }

	    query = parseqs.encode(query);

	    // avoid port if default for schema
	    if (
	      this.opts.port &&
	      (("https" === schema && Number(this.opts.port) !== 443) ||
	        ("http" === schema && Number(this.opts.port) !== 80))
	    ) {
	      port = ":" + this.opts.port;
	    }

	    // prepend ? to query
	    if (query.length) {
	      query = "?" + query;
	    }

	    const ipv6 = this.opts.hostname.indexOf(":") !== -1;
	    return (
	      schema +
	      "://" +
	      (ipv6 ? "[" + this.opts.hostname + "]" : this.opts.hostname) +
	      port +
	      this.opts.path +
	      query
	    );
	  }
	}

	var polling = Polling;

	var pick = (obj, ...attr) => {
	  return attr.reduce((acc, k) => {
	    if (obj.hasOwnProperty(k)) {
	      acc[k] = obj[k];
	    }
	    return acc;
	  }, {});
	};

	var util = {
		pick: pick
	};

	/* global attachEvent */




	const { pick: pick$1 } = util;


	const debug$1 = browser("engine.io-client:polling-xhr");

	/**
	 * Empty function
	 */

	function empty$1() {}

	const hasXHR2 = (function() {
	  const xhr = new xmlhttprequest({ xdomain: false });
	  return null != xhr.responseType;
	})();

	class XHR extends polling {
	  /**
	   * XHR Polling constructor.
	   *
	   * @param {Object} opts
	   * @api public
	   */
	  constructor(opts) {
	    super(opts);

	    if (typeof location !== "undefined") {
	      const isSSL = "https:" === location.protocol;
	      let port = location.port;

	      // some user agents have empty `location.port`
	      if (!port) {
	        port = isSSL ? 443 : 80;
	      }

	      this.xd =
	        (typeof location !== "undefined" &&
	          opts.hostname !== location.hostname) ||
	        port !== opts.port;
	      this.xs = opts.secure !== isSSL;
	    }
	    /**
	     * XHR supports binary
	     */
	    const forceBase64 = opts && opts.forceBase64;
	    this.supportsBinary = hasXHR2 && !forceBase64;
	  }

	  /**
	   * Creates a request.
	   *
	   * @param {String} method
	   * @api private
	   */
	  request(opts = {}) {
	    Object.assign(opts, { xd: this.xd, xs: this.xs }, this.opts);
	    return new Request(this.uri(), opts);
	  }

	  /**
	   * Sends data.
	   *
	   * @param {String} data to send.
	   * @param {Function} called upon flush.
	   * @api private
	   */
	  doWrite(data, fn) {
	    const req = this.request({
	      method: "POST",
	      data: data
	    });
	    const self = this;
	    req.on("success", fn);
	    req.on("error", function(err) {
	      self.onError("xhr post error", err);
	    });
	  }

	  /**
	   * Starts a poll cycle.
	   *
	   * @api private
	   */
	  doPoll() {
	    debug$1("xhr poll");
	    const req = this.request();
	    const self = this;
	    req.on("data", function(data) {
	      self.onData(data);
	    });
	    req.on("error", function(err) {
	      self.onError("xhr poll error", err);
	    });
	    this.pollXhr = req;
	  }
	}

	class Request extends componentEmitter {
	  /**
	   * Request constructor
	   *
	   * @param {Object} options
	   * @api public
	   */
	  constructor(uri, opts) {
	    super();
	    this.opts = opts;

	    this.method = opts.method || "GET";
	    this.uri = uri;
	    this.async = false !== opts.async;
	    this.data = undefined !== opts.data ? opts.data : null;

	    this.create();
	  }

	  /**
	   * Creates the XHR object and sends the request.
	   *
	   * @api private
	   */
	  create() {
	    const opts = pick$1(
	      this.opts,
	      "agent",
	      "enablesXDR",
	      "pfx",
	      "key",
	      "passphrase",
	      "cert",
	      "ca",
	      "ciphers",
	      "rejectUnauthorized"
	    );
	    opts.xdomain = !!this.opts.xd;
	    opts.xscheme = !!this.opts.xs;

	    const xhr = (this.xhr = new xmlhttprequest(opts));
	    const self = this;

	    try {
	      debug$1("xhr open %s: %s", this.method, this.uri);
	      xhr.open(this.method, this.uri, this.async);
	      try {
	        if (this.opts.extraHeaders) {
	          xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);
	          for (let i in this.opts.extraHeaders) {
	            if (this.opts.extraHeaders.hasOwnProperty(i)) {
	              xhr.setRequestHeader(i, this.opts.extraHeaders[i]);
	            }
	          }
	        }
	      } catch (e) {}

	      if ("POST" === this.method) {
	        try {
	          xhr.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
	        } catch (e) {}
	      }

	      try {
	        xhr.setRequestHeader("Accept", "*/*");
	      } catch (e) {}

	      // ie6 check
	      if ("withCredentials" in xhr) {
	        xhr.withCredentials = this.opts.withCredentials;
	      }

	      if (this.opts.requestTimeout) {
	        xhr.timeout = this.opts.requestTimeout;
	      }

	      if (this.hasXDR()) {
	        xhr.onload = function() {
	          self.onLoad();
	        };
	        xhr.onerror = function() {
	          self.onError(xhr.responseText);
	        };
	      } else {
	        xhr.onreadystatechange = function() {
	          if (4 !== xhr.readyState) return;
	          if (200 === xhr.status || 1223 === xhr.status) {
	            self.onLoad();
	          } else {
	            // make sure the `error` event handler that's user-set
	            // does not throw in the same tick and gets caught here
	            setTimeout(function() {
	              self.onError(typeof xhr.status === "number" ? xhr.status : 0);
	            }, 0);
	          }
	        };
	      }

	      debug$1("xhr data %s", this.data);
	      xhr.send(this.data);
	    } catch (e) {
	      // Need to defer since .create() is called directly from the constructor
	      // and thus the 'error' event can only be only bound *after* this exception
	      // occurs.  Therefore, also, we cannot throw here at all.
	      setTimeout(function() {
	        self.onError(e);
	      }, 0);
	      return;
	    }

	    if (typeof document !== "undefined") {
	      this.index = Request.requestsCount++;
	      Request.requests[this.index] = this;
	    }
	  }

	  /**
	   * Called upon successful response.
	   *
	   * @api private
	   */
	  onSuccess() {
	    this.emit("success");
	    this.cleanup();
	  }

	  /**
	   * Called if we have data.
	   *
	   * @api private
	   */
	  onData(data) {
	    this.emit("data", data);
	    this.onSuccess();
	  }

	  /**
	   * Called upon error.
	   *
	   * @api private
	   */
	  onError(err) {
	    this.emit("error", err);
	    this.cleanup(true);
	  }

	  /**
	   * Cleans up house.
	   *
	   * @api private
	   */
	  cleanup(fromError) {
	    if ("undefined" === typeof this.xhr || null === this.xhr) {
	      return;
	    }
	    // xmlhttprequest
	    if (this.hasXDR()) {
	      this.xhr.onload = this.xhr.onerror = empty$1;
	    } else {
	      this.xhr.onreadystatechange = empty$1;
	    }

	    if (fromError) {
	      try {
	        this.xhr.abort();
	      } catch (e) {}
	    }

	    if (typeof document !== "undefined") {
	      delete Request.requests[this.index];
	    }

	    this.xhr = null;
	  }

	  /**
	   * Called upon load.
	   *
	   * @api private
	   */
	  onLoad() {
	    const data = this.xhr.responseText;
	    if (data !== null) {
	      this.onData(data);
	    }
	  }

	  /**
	   * Check if it has XDomainRequest.
	   *
	   * @api private
	   */
	  hasXDR() {
	    return typeof XDomainRequest !== "undefined" && !this.xs && this.enablesXDR;
	  }

	  /**
	   * Aborts the request.
	   *
	   * @api public
	   */
	  abort() {
	    this.cleanup();
	  }
	}

	/**
	 * Aborts pending requests when unloading the window. This is needed to prevent
	 * memory leaks (e.g. when using IE) and to ensure that no spurious error is
	 * emitted.
	 */

	Request.requestsCount = 0;
	Request.requests = {};

	if (typeof document !== "undefined") {
	  if (typeof attachEvent === "function") {
	    attachEvent("onunload", unloadHandler);
	  } else if (typeof addEventListener === "function") {
	    const terminationEvent = "onpagehide" in globalThis_browser ? "pagehide" : "unload";
	    addEventListener(terminationEvent, unloadHandler, false);
	  }
	}

	function unloadHandler() {
	  for (let i in Request.requests) {
	    if (Request.requests.hasOwnProperty(i)) {
	      Request.requests[i].abort();
	    }
	  }
	}

	var pollingXhr = XHR;
	var Request_1 = Request;
	pollingXhr.Request = Request_1;

	const rNewline = /\n/g;
	const rEscapedNewline = /\\n/g;

	/**
	 * Global JSONP callbacks.
	 */

	let callbacks;

	/**
	 * Noop.
	 */

	function empty$2() {}

	class JSONPPolling extends polling {
	  /**
	   * JSONP Polling constructor.
	   *
	   * @param {Object} opts.
	   * @api public
	   */
	  constructor(opts) {
	    super(opts);

	    this.query = this.query || {};

	    // define global callbacks array if not present
	    // we do this here (lazily) to avoid unneeded global pollution
	    if (!callbacks) {
	      // we need to consider multiple engines in the same page
	      callbacks = globalThis_browser.___eio = globalThis_browser.___eio || [];
	    }

	    // callback identifier
	    this.index = callbacks.length;

	    // add callback to jsonp global
	    const self = this;
	    callbacks.push(function(msg) {
	      self.onData(msg);
	    });

	    // append to query string
	    this.query.j = this.index;

	    // prevent spurious errors from being emitted when the window is unloaded
	    if (typeof addEventListener === "function") {
	      addEventListener(
	        "beforeunload",
	        function() {
	          if (self.script) self.script.onerror = empty$2;
	        },
	        false
	      );
	    }
	  }

	  /**
	   * JSONP only supports binary as base64 encoded strings
	   */
	  get supportsBinary() {
	    return false;
	  }

	  /**
	   * Closes the socket.
	   *
	   * @api private
	   */
	  doClose() {
	    if (this.script) {
	      this.script.parentNode.removeChild(this.script);
	      this.script = null;
	    }

	    if (this.form) {
	      this.form.parentNode.removeChild(this.form);
	      this.form = null;
	      this.iframe = null;
	    }

	    super.doClose();
	  }

	  /**
	   * Starts a poll cycle.
	   *
	   * @api private
	   */
	  doPoll() {
	    const self = this;
	    const script = document.createElement("script");

	    if (this.script) {
	      this.script.parentNode.removeChild(this.script);
	      this.script = null;
	    }

	    script.async = true;
	    script.src = this.uri();
	    script.onerror = function(e) {
	      self.onError("jsonp poll error", e);
	    };

	    const insertAt = document.getElementsByTagName("script")[0];
	    if (insertAt) {
	      insertAt.parentNode.insertBefore(script, insertAt);
	    } else {
	      (document.head || document.body).appendChild(script);
	    }
	    this.script = script;

	    const isUAgecko =
	      "undefined" !== typeof navigator && /gecko/i.test(navigator.userAgent);

	    if (isUAgecko) {
	      setTimeout(function() {
	        const iframe = document.createElement("iframe");
	        document.body.appendChild(iframe);
	        document.body.removeChild(iframe);
	      }, 100);
	    }
	  }

	  /**
	   * Writes with a hidden iframe.
	   *
	   * @param {String} data to send
	   * @param {Function} called upon flush.
	   * @api private
	   */
	  doWrite(data, fn) {
	    const self = this;
	    let iframe;

	    if (!this.form) {
	      const form = document.createElement("form");
	      const area = document.createElement("textarea");
	      const id = (this.iframeId = "eio_iframe_" + this.index);

	      form.className = "socketio";
	      form.style.position = "absolute";
	      form.style.top = "-1000px";
	      form.style.left = "-1000px";
	      form.target = id;
	      form.method = "POST";
	      form.setAttribute("accept-charset", "utf-8");
	      area.name = "d";
	      form.appendChild(area);
	      document.body.appendChild(form);

	      this.form = form;
	      this.area = area;
	    }

	    this.form.action = this.uri();

	    function complete() {
	      initIframe();
	      fn();
	    }

	    function initIframe() {
	      if (self.iframe) {
	        try {
	          self.form.removeChild(self.iframe);
	        } catch (e) {
	          self.onError("jsonp polling iframe removal error", e);
	        }
	      }

	      try {
	        // ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
	        const html = '<iframe src="javascript:0" name="' + self.iframeId + '">';
	        iframe = document.createElement(html);
	      } catch (e) {
	        iframe = document.createElement("iframe");
	        iframe.name = self.iframeId;
	        iframe.src = "javascript:0";
	      }

	      iframe.id = self.iframeId;

	      self.form.appendChild(iframe);
	      self.iframe = iframe;
	    }

	    initIframe();

	    // escape \n to prevent it from being converted into \r\n by some UAs
	    // double escaping is required for escaped new lines because unescaping of new lines can be done safely on server-side
	    data = data.replace(rEscapedNewline, "\\\n");
	    this.area.value = data.replace(rNewline, "\\n");

	    try {
	      this.form.submit();
	    } catch (e) {}

	    if (this.iframe.attachEvent) {
	      this.iframe.onreadystatechange = function() {
	        if (self.iframe.readyState === "complete") {
	          complete();
	        }
	      };
	    } else {
	      this.iframe.onload = complete;
	    }
	  }
	}

	var pollingJsonp = JSONPPolling;

	var websocketConstructor_browser = {
	  WebSocket: globalThis_browser.WebSocket || globalThis_browser.MozWebSocket,
	  usingBrowserWebSocket: true,
	  defaultBinaryType: "arraybuffer"
	};

	const { pick: pick$2 } = util;
	const {
	  WebSocket,
	  usingBrowserWebSocket,
	  defaultBinaryType
	} = websocketConstructor_browser;

	const debug$2 = browser("engine.io-client:websocket");

	// detect ReactNative environment
	const isReactNative =
	  typeof navigator !== "undefined" &&
	  typeof navigator.product === "string" &&
	  navigator.product.toLowerCase() === "reactnative";

	class WS extends transport {
	  /**
	   * WebSocket transport constructor.
	   *
	   * @api {Object} connection options
	   * @api public
	   */
	  constructor(opts) {
	    super(opts);

	    this.supportsBinary = !opts.forceBase64;
	  }

	  /**
	   * Transport name.
	   *
	   * @api public
	   */
	  get name() {
	    return "websocket";
	  }

	  /**
	   * Opens socket.
	   *
	   * @api private
	   */
	  doOpen() {
	    if (!this.check()) {
	      // let probe timeout
	      return;
	    }

	    const uri = this.uri();
	    const protocols = this.opts.protocols;

	    // React Native only supports the 'headers' option, and will print a warning if anything else is passed
	    const opts = isReactNative
	      ? {}
	      : pick$2(
	          this.opts,
	          "agent",
	          "perMessageDeflate",
	          "pfx",
	          "key",
	          "passphrase",
	          "cert",
	          "ca",
	          "ciphers",
	          "rejectUnauthorized",
	          "localAddress",
	          "protocolVersion",
	          "origin",
	          "maxPayload",
	          "family",
	          "checkServerIdentity"
	        );

	    if (this.opts.extraHeaders) {
	      opts.headers = this.opts.extraHeaders;
	    }

	    try {
	      this.ws =
	        usingBrowserWebSocket && !isReactNative
	          ? protocols
	            ? new WebSocket(uri, protocols)
	            : new WebSocket(uri)
	          : new WebSocket(uri, protocols, opts);
	    } catch (err) {
	      return this.emit("error", err);
	    }

	    this.ws.binaryType = this.socket.binaryType || defaultBinaryType;

	    this.addEventListeners();
	  }

	  /**
	   * Adds event listeners to the socket
	   *
	   * @api private
	   */
	  addEventListeners() {
	    const self = this;

	    this.ws.onopen = function() {
	      self.onOpen();
	    };
	    this.ws.onclose = function() {
	      self.onClose();
	    };
	    this.ws.onmessage = function(ev) {
	      self.onData(ev.data);
	    };
	    this.ws.onerror = function(e) {
	      self.onError("websocket error", e);
	    };
	  }

	  /**
	   * Writes data to socket.
	   *
	   * @param {Array} array of packets.
	   * @api private
	   */
	  write(packets) {
	    const self = this;
	    this.writable = false;

	    // encodePacket efficient as it uses WS framing
	    // no need for encodePayload
	    let total = packets.length;
	    let i = 0;
	    const l = total;
	    for (; i < l; i++) {
	      (function(packet) {
	        lib.encodePacket(packet, self.supportsBinary, function(data) {
	          // always create a new object (GH-437)
	          const opts = {};
	          if (!usingBrowserWebSocket) {
	            if (packet.options) {
	              opts.compress = packet.options.compress;
	            }

	            if (self.opts.perMessageDeflate) {
	              const len =
	                "string" === typeof data
	                  ? Buffer.byteLength(data)
	                  : data.length;
	              if (len < self.opts.perMessageDeflate.threshold) {
	                opts.compress = false;
	              }
	            }
	          }

	          // Sometimes the websocket has already been closed but the browser didn't
	          // have a chance of informing us about it yet, in that case send will
	          // throw an error
	          try {
	            if (usingBrowserWebSocket) {
	              // TypeError is thrown when passing the second argument on Safari
	              self.ws.send(data);
	            } else {
	              self.ws.send(data, opts);
	            }
	          } catch (e) {
	            debug$2("websocket closed before onclose event");
	          }

	          --total || done();
	        });
	      })(packets[i]);
	    }

	    function done() {
	      self.emit("flush");

	      // fake drain
	      // defer to next tick to allow Socket to clear writeBuffer
	      setTimeout(function() {
	        self.writable = true;
	        self.emit("drain");
	      }, 0);
	    }
	  }

	  /**
	   * Called upon close
	   *
	   * @api private
	   */
	  onClose() {
	    transport.prototype.onClose.call(this);
	  }

	  /**
	   * Closes socket.
	   *
	   * @api private
	   */
	  doClose() {
	    if (typeof this.ws !== "undefined") {
	      this.ws.close();
	    }
	  }

	  /**
	   * Generates uri for connection.
	   *
	   * @api private
	   */
	  uri() {
	    let query = this.query || {};
	    const schema = this.opts.secure ? "wss" : "ws";
	    let port = "";

	    // avoid port if default for schema
	    if (
	      this.opts.port &&
	      (("wss" === schema && Number(this.opts.port) !== 443) ||
	        ("ws" === schema && Number(this.opts.port) !== 80))
	    ) {
	      port = ":" + this.opts.port;
	    }

	    // append timestamp to URI
	    if (this.opts.timestampRequests) {
	      query[this.opts.timestampParam] = yeast_1();
	    }

	    // communicate binary support capabilities
	    if (!this.supportsBinary) {
	      query.b64 = 1;
	    }

	    query = parseqs.encode(query);

	    // prepend ? to query
	    if (query.length) {
	      query = "?" + query;
	    }

	    const ipv6 = this.opts.hostname.indexOf(":") !== -1;
	    return (
	      schema +
	      "://" +
	      (ipv6 ? "[" + this.opts.hostname + "]" : this.opts.hostname) +
	      port +
	      this.opts.path +
	      query
	    );
	  }

	  /**
	   * Feature detection for WebSocket.
	   *
	   * @return {Boolean} whether this transport is available.
	   * @api public
	   */
	  check() {
	    return (
	      !!WebSocket &&
	      !("__initialize" in WebSocket && this.name === WS.prototype.name)
	    );
	  }
	}

	var websocket = WS;

	var polling_1 = polling$1;
	var websocket_1 = websocket;

	/**
	 * Polling transport polymorphic constructor.
	 * Decides on xhr vs jsonp based on feature detection.
	 *
	 * @api private
	 */

	function polling$1(opts) {
	  let xhr;
	  let xd = false;
	  let xs = false;
	  const jsonp = false !== opts.jsonp;

	  if (typeof location !== "undefined") {
	    const isSSL = "https:" === location.protocol;
	    let port = location.port;

	    // some user agents have empty `location.port`
	    if (!port) {
	      port = isSSL ? 443 : 80;
	    }

	    xd = opts.hostname !== location.hostname || port !== opts.port;
	    xs = opts.secure !== isSSL;
	  }

	  opts.xdomain = xd;
	  opts.xscheme = xs;
	  xhr = new xmlhttprequest(opts);

	  if ("open" in xhr && !opts.forceJSONP) {
	    return new pollingXhr(opts);
	  } else {
	    if (!jsonp) throw new Error("JSONP disabled");
	    return new pollingJsonp(opts);
	  }
	}

	var transports = {
		polling: polling_1,
		websocket: websocket_1
	};

	const debug$3 = browser("engine.io-client:socket");




	class Socket extends componentEmitter {
	  /**
	   * Socket constructor.
	   *
	   * @param {String|Object} uri or options
	   * @param {Object} options
	   * @api public
	   */
	  constructor(uri, opts = {}) {
	    super();

	    if (uri && "object" === typeof uri) {
	      opts = uri;
	      uri = null;
	    }

	    if (uri) {
	      uri = parseuri(uri);
	      opts.hostname = uri.host;
	      opts.secure = uri.protocol === "https" || uri.protocol === "wss";
	      opts.port = uri.port;
	      if (uri.query) opts.query = uri.query;
	    } else if (opts.host) {
	      opts.hostname = parseuri(opts.host).host;
	    }

	    this.secure =
	      null != opts.secure
	        ? opts.secure
	        : typeof location !== "undefined" && "https:" === location.protocol;

	    if (opts.hostname && !opts.port) {
	      // if no port is specified manually, use the protocol default
	      opts.port = this.secure ? "443" : "80";
	    }

	    this.hostname =
	      opts.hostname ||
	      (typeof location !== "undefined" ? location.hostname : "localhost");
	    this.port =
	      opts.port ||
	      (typeof location !== "undefined" && location.port
	        ? location.port
	        : this.secure
	        ? 443
	        : 80);

	    this.transports = opts.transports || ["polling", "websocket"];
	    this.readyState = "";
	    this.writeBuffer = [];
	    this.prevBufferLen = 0;

	    this.opts = Object.assign(
	      {
	        path: "/engine.io",
	        agent: false,
	        withCredentials: false,
	        upgrade: true,
	        jsonp: true,
	        timestampParam: "t",
	        rememberUpgrade: false,
	        rejectUnauthorized: true,
	        perMessageDeflate: {
	          threshold: 1024
	        },
	        transportOptions: {}
	      },
	      opts
	    );

	    this.opts.path = this.opts.path.replace(/\/$/, "") + "/";

	    if (typeof this.opts.query === "string") {
	      this.opts.query = parseqs.decode(this.opts.query);
	    }

	    // set on handshake
	    this.id = null;
	    this.upgrades = null;
	    this.pingInterval = null;
	    this.pingTimeout = null;

	    // set on heartbeat
	    this.pingTimeoutTimer = null;

	    this.open();
	  }

	  /**
	   * Creates transport of the given type.
	   *
	   * @param {String} transport name
	   * @return {Transport}
	   * @api private
	   */
	  createTransport(name) {
	    debug$3('creating transport "%s"', name);
	    const query = clone(this.opts.query);

	    // append engine.io protocol identifier
	    query.EIO = lib.protocol;

	    // transport name
	    query.transport = name;

	    // session id if we already have one
	    if (this.id) query.sid = this.id;

	    const opts = Object.assign(
	      {},
	      this.opts.transportOptions[name],
	      this.opts,
	      {
	        query,
	        socket: this,
	        hostname: this.hostname,
	        secure: this.secure,
	        port: this.port
	      }
	    );

	    debug$3("options: %j", opts);

	    return new transports[name](opts);
	  }

	  /**
	   * Initializes transport to use and starts probe.
	   *
	   * @api private
	   */
	  open() {
	    let transport;
	    if (
	      this.opts.rememberUpgrade &&
	      Socket.priorWebsocketSuccess &&
	      this.transports.indexOf("websocket") !== -1
	    ) {
	      transport = "websocket";
	    } else if (0 === this.transports.length) {
	      // Emit error on next tick so it can be listened to
	      const self = this;
	      setTimeout(function() {
	        self.emit("error", "No transports available");
	      }, 0);
	      return;
	    } else {
	      transport = this.transports[0];
	    }
	    this.readyState = "opening";

	    // Retry with the next transport if the transport is disabled (jsonp: false)
	    try {
	      transport = this.createTransport(transport);
	    } catch (e) {
	      debug$3("error while creating transport: %s", e);
	      this.transports.shift();
	      this.open();
	      return;
	    }

	    transport.open();
	    this.setTransport(transport);
	  }

	  /**
	   * Sets the current transport. Disables the existing one (if any).
	   *
	   * @api private
	   */
	  setTransport(transport) {
	    debug$3("setting transport %s", transport.name);
	    const self = this;

	    if (this.transport) {
	      debug$3("clearing existing transport %s", this.transport.name);
	      this.transport.removeAllListeners();
	    }

	    // set up transport
	    this.transport = transport;

	    // set up transport listeners
	    transport
	      .on("drain", function() {
	        self.onDrain();
	      })
	      .on("packet", function(packet) {
	        self.onPacket(packet);
	      })
	      .on("error", function(e) {
	        self.onError(e);
	      })
	      .on("close", function() {
	        self.onClose("transport close");
	      });
	  }

	  /**
	   * Probes a transport.
	   *
	   * @param {String} transport name
	   * @api private
	   */
	  probe(name) {
	    debug$3('probing transport "%s"', name);
	    let transport = this.createTransport(name, { probe: 1 });
	    let failed = false;
	    const self = this;

	    Socket.priorWebsocketSuccess = false;

	    function onTransportOpen() {
	      if (self.onlyBinaryUpgrades) {
	        const upgradeLosesBinary =
	          !this.supportsBinary && self.transport.supportsBinary;
	        failed = failed || upgradeLosesBinary;
	      }
	      if (failed) return;

	      debug$3('probe transport "%s" opened', name);
	      transport.send([{ type: "ping", data: "probe" }]);
	      transport.once("packet", function(msg) {
	        if (failed) return;
	        if ("pong" === msg.type && "probe" === msg.data) {
	          debug$3('probe transport "%s" pong', name);
	          self.upgrading = true;
	          self.emit("upgrading", transport);
	          if (!transport) return;
	          Socket.priorWebsocketSuccess = "websocket" === transport.name;

	          debug$3('pausing current transport "%s"', self.transport.name);
	          self.transport.pause(function() {
	            if (failed) return;
	            if ("closed" === self.readyState) return;
	            debug$3("changing transport and sending upgrade packet");

	            cleanup();

	            self.setTransport(transport);
	            transport.send([{ type: "upgrade" }]);
	            self.emit("upgrade", transport);
	            transport = null;
	            self.upgrading = false;
	            self.flush();
	          });
	        } else {
	          debug$3('probe transport "%s" failed', name);
	          const err = new Error("probe error");
	          err.transport = transport.name;
	          self.emit("upgradeError", err);
	        }
	      });
	    }

	    function freezeTransport() {
	      if (failed) return;

	      // Any callback called by transport should be ignored since now
	      failed = true;

	      cleanup();

	      transport.close();
	      transport = null;
	    }

	    // Handle any error that happens while probing
	    function onerror(err) {
	      const error = new Error("probe error: " + err);
	      error.transport = transport.name;

	      freezeTransport();

	      debug$3('probe transport "%s" failed because of error: %s', name, err);

	      self.emit("upgradeError", error);
	    }

	    function onTransportClose() {
	      onerror("transport closed");
	    }

	    // When the socket is closed while we're probing
	    function onclose() {
	      onerror("socket closed");
	    }

	    // When the socket is upgraded while we're probing
	    function onupgrade(to) {
	      if (transport && to.name !== transport.name) {
	        debug$3('"%s" works - aborting "%s"', to.name, transport.name);
	        freezeTransport();
	      }
	    }

	    // Remove all listeners on the transport and on self
	    function cleanup() {
	      transport.removeListener("open", onTransportOpen);
	      transport.removeListener("error", onerror);
	      transport.removeListener("close", onTransportClose);
	      self.removeListener("close", onclose);
	      self.removeListener("upgrading", onupgrade);
	    }

	    transport.once("open", onTransportOpen);
	    transport.once("error", onerror);
	    transport.once("close", onTransportClose);

	    this.once("close", onclose);
	    this.once("upgrading", onupgrade);

	    transport.open();
	  }

	  /**
	   * Called when connection is deemed open.
	   *
	   * @api public
	   */
	  onOpen() {
	    debug$3("socket open");
	    this.readyState = "open";
	    Socket.priorWebsocketSuccess = "websocket" === this.transport.name;
	    this.emit("open");
	    this.flush();

	    // we check for `readyState` in case an `open`
	    // listener already closed the socket
	    if (
	      "open" === this.readyState &&
	      this.opts.upgrade &&
	      this.transport.pause
	    ) {
	      debug$3("starting upgrade probes");
	      let i = 0;
	      const l = this.upgrades.length;
	      for (; i < l; i++) {
	        this.probe(this.upgrades[i]);
	      }
	    }
	  }

	  /**
	   * Handles a packet.
	   *
	   * @api private
	   */
	  onPacket(packet) {
	    if (
	      "opening" === this.readyState ||
	      "open" === this.readyState ||
	      "closing" === this.readyState
	    ) {
	      debug$3('socket receive: type "%s", data "%s"', packet.type, packet.data);

	      this.emit("packet", packet);

	      // Socket is live - any packet counts
	      this.emit("heartbeat");

	      switch (packet.type) {
	        case "open":
	          this.onHandshake(JSON.parse(packet.data));
	          break;

	        case "ping":
	          this.resetPingTimeout();
	          this.sendPacket("pong");
	          this.emit("pong");
	          break;

	        case "error":
	          const err = new Error("server error");
	          err.code = packet.data;
	          this.onError(err);
	          break;

	        case "message":
	          this.emit("data", packet.data);
	          this.emit("message", packet.data);
	          break;
	      }
	    } else {
	      debug$3('packet received with socket readyState "%s"', this.readyState);
	    }
	  }

	  /**
	   * Called upon handshake completion.
	   *
	   * @param {Object} handshake obj
	   * @api private
	   */
	  onHandshake(data) {
	    this.emit("handshake", data);
	    this.id = data.sid;
	    this.transport.query.sid = data.sid;
	    this.upgrades = this.filterUpgrades(data.upgrades);
	    this.pingInterval = data.pingInterval;
	    this.pingTimeout = data.pingTimeout;
	    this.onOpen();
	    // In case open handler closes socket
	    if ("closed" === this.readyState) return;
	    this.resetPingTimeout();
	  }

	  /**
	   * Sets and resets ping timeout timer based on server pings.
	   *
	   * @api private
	   */
	  resetPingTimeout() {
	    clearTimeout(this.pingTimeoutTimer);
	    this.pingTimeoutTimer = setTimeout(() => {
	      this.onClose("ping timeout");
	    }, this.pingInterval + this.pingTimeout);
	  }

	  /**
	   * Called on `drain` event
	   *
	   * @api private
	   */
	  onDrain() {
	    this.writeBuffer.splice(0, this.prevBufferLen);

	    // setting prevBufferLen = 0 is very important
	    // for example, when upgrading, upgrade packet is sent over,
	    // and a nonzero prevBufferLen could cause problems on `drain`
	    this.prevBufferLen = 0;

	    if (0 === this.writeBuffer.length) {
	      this.emit("drain");
	    } else {
	      this.flush();
	    }
	  }

	  /**
	   * Flush write buffers.
	   *
	   * @api private
	   */
	  flush() {
	    if (
	      "closed" !== this.readyState &&
	      this.transport.writable &&
	      !this.upgrading &&
	      this.writeBuffer.length
	    ) {
	      debug$3("flushing %d packets in socket", this.writeBuffer.length);
	      this.transport.send(this.writeBuffer);
	      // keep track of current length of writeBuffer
	      // splice writeBuffer and callbackBuffer on `drain`
	      this.prevBufferLen = this.writeBuffer.length;
	      this.emit("flush");
	    }
	  }

	  /**
	   * Sends a message.
	   *
	   * @param {String} message.
	   * @param {Function} callback function.
	   * @param {Object} options.
	   * @return {Socket} for chaining.
	   * @api public
	   */
	  write(msg, options, fn) {
	    this.sendPacket("message", msg, options, fn);
	    return this;
	  }

	  send(msg, options, fn) {
	    this.sendPacket("message", msg, options, fn);
	    return this;
	  }

	  /**
	   * Sends a packet.
	   *
	   * @param {String} packet type.
	   * @param {String} data.
	   * @param {Object} options.
	   * @param {Function} callback function.
	   * @api private
	   */
	  sendPacket(type, data, options, fn) {
	    if ("function" === typeof data) {
	      fn = data;
	      data = undefined;
	    }

	    if ("function" === typeof options) {
	      fn = options;
	      options = null;
	    }

	    if ("closing" === this.readyState || "closed" === this.readyState) {
	      return;
	    }

	    options = options || {};
	    options.compress = false !== options.compress;

	    const packet = {
	      type: type,
	      data: data,
	      options: options
	    };
	    this.emit("packetCreate", packet);
	    this.writeBuffer.push(packet);
	    if (fn) this.once("flush", fn);
	    this.flush();
	  }

	  /**
	   * Closes the connection.
	   *
	   * @api private
	   */
	  close() {
	    const self = this;

	    if ("opening" === this.readyState || "open" === this.readyState) {
	      this.readyState = "closing";

	      if (this.writeBuffer.length) {
	        this.once("drain", function() {
	          if (this.upgrading) {
	            waitForUpgrade();
	          } else {
	            close();
	          }
	        });
	      } else if (this.upgrading) {
	        waitForUpgrade();
	      } else {
	        close();
	      }
	    }

	    function close() {
	      self.onClose("forced close");
	      debug$3("socket closing - telling transport to close");
	      self.transport.close();
	    }

	    function cleanupAndClose() {
	      self.removeListener("upgrade", cleanupAndClose);
	      self.removeListener("upgradeError", cleanupAndClose);
	      close();
	    }

	    function waitForUpgrade() {
	      // wait for upgrade to finish since we can't send packets while pausing a transport
	      self.once("upgrade", cleanupAndClose);
	      self.once("upgradeError", cleanupAndClose);
	    }

	    return this;
	  }

	  /**
	   * Called upon transport error
	   *
	   * @api private
	   */
	  onError(err) {
	    debug$3("socket error %j", err);
	    Socket.priorWebsocketSuccess = false;
	    this.emit("error", err);
	    this.onClose("transport error", err);
	  }

	  /**
	   * Called upon transport close.
	   *
	   * @api private
	   */
	  onClose(reason, desc) {
	    if (
	      "opening" === this.readyState ||
	      "open" === this.readyState ||
	      "closing" === this.readyState
	    ) {
	      debug$3('socket close with reason: "%s"', reason);
	      const self = this;

	      // clear timers
	      clearTimeout(this.pingIntervalTimer);
	      clearTimeout(this.pingTimeoutTimer);

	      // stop event from firing again for transport
	      this.transport.removeAllListeners("close");

	      // ensure transport won't stay open
	      this.transport.close();

	      // ignore further transport communication
	      this.transport.removeAllListeners();

	      // set ready state
	      this.readyState = "closed";

	      // clear session id
	      this.id = null;

	      // emit close event
	      this.emit("close", reason, desc);

	      // clean buffers after, so users can still
	      // grab the buffers on `close` event
	      self.writeBuffer = [];
	      self.prevBufferLen = 0;
	    }
	  }

	  /**
	   * Filters upgrades, returning only those matching client transports.
	   *
	   * @param {Array} server upgrades
	   * @api private
	   *
	   */
	  filterUpgrades(upgrades) {
	    const filteredUpgrades = [];
	    let i = 0;
	    const j = upgrades.length;
	    for (; i < j; i++) {
	      if (~this.transports.indexOf(upgrades[i]))
	        filteredUpgrades.push(upgrades[i]);
	    }
	    return filteredUpgrades;
	  }
	}

	Socket.priorWebsocketSuccess = false;

	/**
	 * Protocol version.
	 *
	 * @api public
	 */

	Socket.protocol = lib.protocol; // this is an int

	function clone(obj) {
	  const o = {};
	  for (let i in obj) {
	    if (obj.hasOwnProperty(i)) {
	      o[i] = obj[i];
	    }
	  }
	  return o;
	}

	var socket = Socket;

	var lib$1 = (uri, opts) => new socket(uri, opts);

	/**
	 * Expose deps for legacy compatibility
	 * and standalone browser access.
	 */

	var Socket_1 = socket;
	var protocol = socket.protocol; // this is an int
	var Transport$1 = transport;
	var transports$1 = transports;
	var parser = lib;
	lib$1.Socket = Socket_1;
	lib$1.protocol = protocol;
	lib$1.Transport = Transport$1;
	lib$1.transports = transports$1;
	lib$1.parser = parser;

	var isBinary_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.hasBinary = exports.isBinary = void 0;
	const withNativeArrayBuffer = typeof ArrayBuffer === "function";
	const isView = (obj) => {
	    return typeof ArrayBuffer.isView === "function"
	        ? ArrayBuffer.isView(obj)
	        : obj.buffer instanceof ArrayBuffer;
	};
	const toString = Object.prototype.toString;
	const withNativeBlob = typeof Blob === "function" ||
	    (typeof Blob !== "undefined" &&
	        toString.call(Blob) === "[object BlobConstructor]");
	const withNativeFile = typeof File === "function" ||
	    (typeof File !== "undefined" &&
	        toString.call(File) === "[object FileConstructor]");
	/**
	 * Returns true if obj is a Buffer, an ArrayBuffer, a Blob or a File.
	 *
	 * @private
	 */
	function isBinary(obj) {
	    return ((withNativeArrayBuffer && (obj instanceof ArrayBuffer || isView(obj))) ||
	        (withNativeBlob && obj instanceof Blob) ||
	        (withNativeFile && obj instanceof File));
	}
	exports.isBinary = isBinary;
	function hasBinary(obj, toJSON) {
	    if (!obj || typeof obj !== "object") {
	        return false;
	    }
	    if (Array.isArray(obj)) {
	        for (let i = 0, l = obj.length; i < l; i++) {
	            if (hasBinary(obj[i])) {
	                return true;
	            }
	        }
	        return false;
	    }
	    if (isBinary(obj)) {
	        return true;
	    }
	    if (obj.toJSON &&
	        typeof obj.toJSON === "function" &&
	        arguments.length === 1) {
	        return hasBinary(obj.toJSON(), true);
	    }
	    for (const key in obj) {
	        if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
	            return true;
	        }
	    }
	    return false;
	}
	exports.hasBinary = hasBinary;
	});

	unwrapExports(isBinary_1);
	isBinary_1.hasBinary;
	isBinary_1.isBinary;

	var binary = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.reconstructPacket = exports.deconstructPacket = void 0;

	/**
	 * Replaces every Buffer | ArrayBuffer | Blob | File in packet with a numbered placeholder.
	 *
	 * @param {Object} packet - socket.io event packet
	 * @return {Object} with deconstructed packet and list of buffers
	 * @public
	 */
	function deconstructPacket(packet) {
	    const buffers = [];
	    const packetData = packet.data;
	    const pack = packet;
	    pack.data = _deconstructPacket(packetData, buffers);
	    pack.attachments = buffers.length; // number of binary 'attachments'
	    return { packet: pack, buffers: buffers };
	}
	exports.deconstructPacket = deconstructPacket;
	function _deconstructPacket(data, buffers) {
	    if (!data)
	        return data;
	    if (isBinary_1.isBinary(data)) {
	        const placeholder = { _placeholder: true, num: buffers.length };
	        buffers.push(data);
	        return placeholder;
	    }
	    else if (Array.isArray(data)) {
	        const newData = new Array(data.length);
	        for (let i = 0; i < data.length; i++) {
	            newData[i] = _deconstructPacket(data[i], buffers);
	        }
	        return newData;
	    }
	    else if (typeof data === "object" && !(data instanceof Date)) {
	        const newData = {};
	        for (const key in data) {
	            if (data.hasOwnProperty(key)) {
	                newData[key] = _deconstructPacket(data[key], buffers);
	            }
	        }
	        return newData;
	    }
	    return data;
	}
	/**
	 * Reconstructs a binary packet from its placeholder packet and buffers
	 *
	 * @param {Object} packet - event packet with placeholders
	 * @param {Array} buffers - binary buffers to put in placeholder positions
	 * @return {Object} reconstructed packet
	 * @public
	 */
	function reconstructPacket(packet, buffers) {
	    packet.data = _reconstructPacket(packet.data, buffers);
	    packet.attachments = undefined; // no longer useful
	    return packet;
	}
	exports.reconstructPacket = reconstructPacket;
	function _reconstructPacket(data, buffers) {
	    if (!data)
	        return data;
	    if (data && data._placeholder) {
	        return buffers[data.num]; // appropriate buffer (should be natural order anyway)
	    }
	    else if (Array.isArray(data)) {
	        for (let i = 0; i < data.length; i++) {
	            data[i] = _reconstructPacket(data[i], buffers);
	        }
	    }
	    else if (typeof data === "object") {
	        for (const key in data) {
	            if (data.hasOwnProperty(key)) {
	                data[key] = _reconstructPacket(data[key], buffers);
	            }
	        }
	    }
	    return data;
	}
	});

	unwrapExports(binary);
	binary.reconstructPacket;
	binary.deconstructPacket;

	var dist = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Decoder = exports.Encoder = exports.PacketType = exports.protocol = void 0;



	const debug = browser("socket.io-parser");
	/**
	 * Protocol version.
	 *
	 * @public
	 */
	exports.protocol = 5;
	var PacketType;
	(function (PacketType) {
	    PacketType[PacketType["CONNECT"] = 0] = "CONNECT";
	    PacketType[PacketType["DISCONNECT"] = 1] = "DISCONNECT";
	    PacketType[PacketType["EVENT"] = 2] = "EVENT";
	    PacketType[PacketType["ACK"] = 3] = "ACK";
	    PacketType[PacketType["CONNECT_ERROR"] = 4] = "CONNECT_ERROR";
	    PacketType[PacketType["BINARY_EVENT"] = 5] = "BINARY_EVENT";
	    PacketType[PacketType["BINARY_ACK"] = 6] = "BINARY_ACK";
	})(PacketType = exports.PacketType || (exports.PacketType = {}));
	/**
	 * A socket.io Encoder instance
	 */
	class Encoder {
	    /**
	     * Encode a packet as a single string if non-binary, or as a
	     * buffer sequence, depending on packet type.
	     *
	     * @param {Object} obj - packet object
	     */
	    encode(obj) {
	        debug("encoding packet %j", obj);
	        if (obj.type === PacketType.EVENT || obj.type === PacketType.ACK) {
	            if (isBinary_1.hasBinary(obj)) {
	                obj.type =
	                    obj.type === PacketType.EVENT
	                        ? PacketType.BINARY_EVENT
	                        : PacketType.BINARY_ACK;
	                return this.encodeAsBinary(obj);
	            }
	        }
	        return [this.encodeAsString(obj)];
	    }
	    /**
	     * Encode packet as string.
	     */
	    encodeAsString(obj) {
	        // first is type
	        let str = "" + obj.type;
	        // attachments if we have them
	        if (obj.type === PacketType.BINARY_EVENT ||
	            obj.type === PacketType.BINARY_ACK) {
	            str += obj.attachments + "-";
	        }
	        // if we have a namespace other than `/`
	        // we append it followed by a comma `,`
	        if (obj.nsp && "/" !== obj.nsp) {
	            str += obj.nsp + ",";
	        }
	        // immediately followed by the id
	        if (null != obj.id) {
	            str += obj.id;
	        }
	        // json data
	        if (null != obj.data) {
	            str += JSON.stringify(obj.data);
	        }
	        debug("encoded %j as %s", obj, str);
	        return str;
	    }
	    /**
	     * Encode packet as 'buffer sequence' by removing blobs, and
	     * deconstructing packet into object with placeholders and
	     * a list of buffers.
	     */
	    encodeAsBinary(obj) {
	        const deconstruction = binary.deconstructPacket(obj);
	        const pack = this.encodeAsString(deconstruction.packet);
	        const buffers = deconstruction.buffers;
	        buffers.unshift(pack); // add packet info to beginning of data list
	        return buffers; // write all the buffers
	    }
	}
	exports.Encoder = Encoder;
	/**
	 * A socket.io Decoder instance
	 *
	 * @return {Object} decoder
	 */
	class Decoder extends componentEmitter {
	    constructor() {
	        super();
	    }
	    /**
	     * Decodes an encoded packet string into packet JSON.
	     *
	     * @param {String} obj - encoded packet
	     */
	    add(obj) {
	        let packet;
	        if (typeof obj === "string") {
	            packet = this.decodeString(obj);
	            if (packet.type === PacketType.BINARY_EVENT ||
	                packet.type === PacketType.BINARY_ACK) {
	                // binary packet's json
	                this.reconstructor = new BinaryReconstructor(packet);
	                // no attachments, labeled binary but no binary data to follow
	                if (packet.attachments === 0) {
	                    super.emit("decoded", packet);
	                }
	            }
	            else {
	                // non-binary full packet
	                super.emit("decoded", packet);
	            }
	        }
	        else if (isBinary_1.isBinary(obj) || obj.base64) {
	            // raw binary data
	            if (!this.reconstructor) {
	                throw new Error("got binary data when not reconstructing a packet");
	            }
	            else {
	                packet = this.reconstructor.takeBinaryData(obj);
	                if (packet) {
	                    // received final buffer
	                    this.reconstructor = null;
	                    super.emit("decoded", packet);
	                }
	            }
	        }
	        else {
	            throw new Error("Unknown type: " + obj);
	        }
	    }
	    /**
	     * Decode a packet String (JSON data)
	     *
	     * @param {String} str
	     * @return {Object} packet
	     */
	    decodeString(str) {
	        let i = 0;
	        // look up type
	        const p = {
	            type: Number(str.charAt(0)),
	        };
	        if (PacketType[p.type] === undefined) {
	            throw new Error("unknown packet type " + p.type);
	        }
	        // look up attachments if type binary
	        if (p.type === PacketType.BINARY_EVENT ||
	            p.type === PacketType.BINARY_ACK) {
	            const start = i + 1;
	            while (str.charAt(++i) !== "-" && i != str.length) { }
	            const buf = str.substring(start, i);
	            if (buf != Number(buf) || str.charAt(i) !== "-") {
	                throw new Error("Illegal attachments");
	            }
	            p.attachments = Number(buf);
	        }
	        // look up namespace (if any)
	        if ("/" === str.charAt(i + 1)) {
	            const start = i + 1;
	            while (++i) {
	                const c = str.charAt(i);
	                if ("," === c)
	                    break;
	                if (i === str.length)
	                    break;
	            }
	            p.nsp = str.substring(start, i);
	        }
	        else {
	            p.nsp = "/";
	        }
	        // look up id
	        const next = str.charAt(i + 1);
	        if ("" !== next && Number(next) == next) {
	            const start = i + 1;
	            while (++i) {
	                const c = str.charAt(i);
	                if (null == c || Number(c) != c) {
	                    --i;
	                    break;
	                }
	                if (i === str.length)
	                    break;
	            }
	            p.id = Number(str.substring(start, i + 1));
	        }
	        // look up json data
	        if (str.charAt(++i)) {
	            const payload = tryParse(str.substr(i));
	            if (Decoder.isPayloadValid(p.type, payload)) {
	                p.data = payload;
	            }
	            else {
	                throw new Error("invalid payload");
	            }
	        }
	        debug("decoded %s as %j", str, p);
	        return p;
	    }
	    static isPayloadValid(type, payload) {
	        switch (type) {
	            case PacketType.CONNECT:
	                return typeof payload === "object";
	            case PacketType.DISCONNECT:
	                return payload === undefined;
	            case PacketType.CONNECT_ERROR:
	                return typeof payload === "string" || typeof payload === "object";
	            case PacketType.EVENT:
	            case PacketType.BINARY_EVENT:
	                return Array.isArray(payload) && payload.length > 0;
	            case PacketType.ACK:
	            case PacketType.BINARY_ACK:
	                return Array.isArray(payload);
	        }
	    }
	    /**
	     * Deallocates a parser's resources
	     */
	    destroy() {
	        if (this.reconstructor) {
	            this.reconstructor.finishedReconstruction();
	        }
	    }
	}
	exports.Decoder = Decoder;
	function tryParse(str) {
	    try {
	        return JSON.parse(str);
	    }
	    catch (e) {
	        return false;
	    }
	}
	/**
	 * A manager of a binary event's 'buffer sequence'. Should
	 * be constructed whenever a packet of type BINARY_EVENT is
	 * decoded.
	 *
	 * @param {Object} packet
	 * @return {BinaryReconstructor} initialized reconstructor
	 */
	class BinaryReconstructor {
	    constructor(packet) {
	        this.packet = packet;
	        this.buffers = [];
	        this.reconPack = packet;
	    }
	    /**
	     * Method to be called when binary data received from connection
	     * after a BINARY_EVENT packet.
	     *
	     * @param {Buffer | ArrayBuffer} binData - the raw binary data received
	     * @return {null | Object} returns null if more binary data is expected or
	     *   a reconstructed packet object if all buffers have been received.
	     */
	    takeBinaryData(binData) {
	        this.buffers.push(binData);
	        if (this.buffers.length === this.reconPack.attachments) {
	            // done with buffer list
	            const packet = binary.reconstructPacket(this.reconPack, this.buffers);
	            this.finishedReconstruction();
	            return packet;
	        }
	        return null;
	    }
	    /**
	     * Cleans up binary packet reconstruction variables.
	     */
	    finishedReconstruction() {
	        this.reconPack = null;
	        this.buffers = [];
	    }
	}
	});

	unwrapExports(dist);
	dist.Decoder;
	dist.Encoder;
	dist.PacketType;
	dist.protocol;

	var on_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.on = void 0;
	function on(obj, ev, fn) {
	    obj.on(ev, fn);
	    return function subDestroy() {
	        obj.off(ev, fn);
	    };
	}
	exports.on = on;
	});

	unwrapExports(on_1);
	on_1.on;

	var socket$1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Socket = void 0;



	const debug = browser("socket.io-client:socket");
	/**
	 * Internal events.
	 * These events can't be emitted by the user.
	 */
	const RESERVED_EVENTS = Object.freeze({
	    connect: 1,
	    connect_error: 1,
	    disconnect: 1,
	    disconnecting: 1,
	    // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
	    newListener: 1,
	    removeListener: 1,
	});
	class Socket extends componentEmitter {
	    /**
	     * `Socket` constructor.
	     *
	     * @public
	     */
	    constructor(io, nsp, opts) {
	        super();
	        this.receiveBuffer = [];
	        this.sendBuffer = [];
	        this.ids = 0;
	        this.acks = {};
	        this.flags = {};
	        this.io = io;
	        this.nsp = nsp;
	        this.ids = 0;
	        this.acks = {};
	        this.receiveBuffer = [];
	        this.sendBuffer = [];
	        this.connected = false;
	        this.disconnected = true;
	        this.flags = {};
	        if (opts && opts.auth) {
	            this.auth = opts.auth;
	        }
	        if (this.io._autoConnect)
	            this.open();
	    }
	    /**
	     * Subscribe to open, close and packet events
	     *
	     * @private
	     */
	    subEvents() {
	        if (this.subs)
	            return;
	        const io = this.io;
	        this.subs = [
	            on_1.on(io, "open", this.onopen.bind(this)),
	            on_1.on(io, "packet", this.onpacket.bind(this)),
	            on_1.on(io, "error", this.onerror.bind(this)),
	            on_1.on(io, "close", this.onclose.bind(this)),
	        ];
	    }
	    /**
	     * Whether the Socket will try to reconnect when its Manager connects or reconnects
	     */
	    get active() {
	        return !!this.subs;
	    }
	    /**
	     * "Opens" the socket.
	     *
	     * @public
	     */
	    connect() {
	        if (this.connected)
	            return this;
	        this.subEvents();
	        if (!this.io["_reconnecting"])
	            this.io.open(); // ensure open
	        if ("open" === this.io._readyState)
	            this.onopen();
	        return this;
	    }
	    /**
	     * Alias for connect()
	     */
	    open() {
	        return this.connect();
	    }
	    /**
	     * Sends a `message` event.
	     *
	     * @return self
	     * @public
	     */
	    send(...args) {
	        args.unshift("message");
	        this.emit.apply(this, args);
	        return this;
	    }
	    /**
	     * Override `emit`.
	     * If the event is in `events`, it's emitted normally.
	     *
	     * @param ev - event name
	     * @return self
	     * @public
	     */
	    emit(ev, ...args) {
	        if (RESERVED_EVENTS.hasOwnProperty(ev)) {
	            throw new Error('"' + ev + '" is a reserved event name');
	        }
	        args.unshift(ev);
	        const packet = {
	            type: dist.PacketType.EVENT,
	            data: args,
	        };
	        packet.options = {};
	        packet.options.compress = this.flags.compress !== false;
	        // event ack callback
	        if ("function" === typeof args[args.length - 1]) {
	            debug("emitting packet with ack id %d", this.ids);
	            this.acks[this.ids] = args.pop();
	            packet.id = this.ids++;
	        }
	        const isTransportWritable = this.io.engine &&
	            this.io.engine.transport &&
	            this.io.engine.transport.writable;
	        const discardPacket = this.flags.volatile && (!isTransportWritable || !this.connected);
	        if (discardPacket) {
	            debug("discard packet as the transport is not currently writable");
	        }
	        else if (this.connected) {
	            this.packet(packet);
	        }
	        else {
	            this.sendBuffer.push(packet);
	        }
	        this.flags = {};
	        return this;
	    }
	    /**
	     * Sends a packet.
	     *
	     * @param packet
	     * @private
	     */
	    packet(packet) {
	        packet.nsp = this.nsp;
	        this.io._packet(packet);
	    }
	    /**
	     * Called upon engine `open`.
	     *
	     * @private
	     */
	    onopen() {
	        debug("transport is open - connecting");
	        if (typeof this.auth == "function") {
	            this.auth((data) => {
	                this.packet({ type: dist.PacketType.CONNECT, data });
	            });
	        }
	        else {
	            this.packet({ type: dist.PacketType.CONNECT, data: this.auth });
	        }
	    }
	    /**
	     * Called upon engine or manager `error`.
	     *
	     * @param err
	     * @private
	     */
	    onerror(err) {
	        if (!this.connected) {
	            super.emit("connect_error", err);
	        }
	    }
	    /**
	     * Called upon engine `close`.
	     *
	     * @param reason
	     * @private
	     */
	    onclose(reason) {
	        debug("close (%s)", reason);
	        this.connected = false;
	        this.disconnected = true;
	        delete this.id;
	        super.emit("disconnect", reason);
	    }
	    /**
	     * Called with socket packet.
	     *
	     * @param packet
	     * @private
	     */
	    onpacket(packet) {
	        const sameNamespace = packet.nsp === this.nsp;
	        if (!sameNamespace)
	            return;
	        switch (packet.type) {
	            case dist.PacketType.CONNECT:
	                if (packet.data && packet.data.sid) {
	                    const id = packet.data.sid;
	                    this.onconnect(id);
	                }
	                else {
	                    super.emit("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
	                }
	                break;
	            case dist.PacketType.EVENT:
	                this.onevent(packet);
	                break;
	            case dist.PacketType.BINARY_EVENT:
	                this.onevent(packet);
	                break;
	            case dist.PacketType.ACK:
	                this.onack(packet);
	                break;
	            case dist.PacketType.BINARY_ACK:
	                this.onack(packet);
	                break;
	            case dist.PacketType.DISCONNECT:
	                this.ondisconnect();
	                break;
	            case dist.PacketType.CONNECT_ERROR:
	                const err = new Error(packet.data.message);
	                // @ts-ignore
	                err.data = packet.data.data;
	                super.emit("connect_error", err);
	                break;
	        }
	    }
	    /**
	     * Called upon a server event.
	     *
	     * @param packet
	     * @private
	     */
	    onevent(packet) {
	        const args = packet.data || [];
	        debug("emitting event %j", args);
	        if (null != packet.id) {
	            debug("attaching ack callback to event");
	            args.push(this.ack(packet.id));
	        }
	        if (this.connected) {
	            this.emitEvent(args);
	        }
	        else {
	            this.receiveBuffer.push(Object.freeze(args));
	        }
	    }
	    emitEvent(args) {
	        if (this._anyListeners && this._anyListeners.length) {
	            const listeners = this._anyListeners.slice();
	            for (const listener of listeners) {
	                listener.apply(this, args);
	            }
	        }
	        super.emit.apply(this, args);
	    }
	    /**
	     * Produces an ack callback to emit with an event.
	     *
	     * @private
	     */
	    ack(id) {
	        const self = this;
	        let sent = false;
	        return function (...args) {
	            // prevent double callbacks
	            if (sent)
	                return;
	            sent = true;
	            debug("sending ack %j", args);
	            self.packet({
	                type: dist.PacketType.ACK,
	                id: id,
	                data: args,
	            });
	        };
	    }
	    /**
	     * Called upon a server acknowlegement.
	     *
	     * @param packet
	     * @private
	     */
	    onack(packet) {
	        const ack = this.acks[packet.id];
	        if ("function" === typeof ack) {
	            debug("calling ack %s with %j", packet.id, packet.data);
	            ack.apply(this, packet.data);
	            delete this.acks[packet.id];
	        }
	        else {
	            debug("bad ack %s", packet.id);
	        }
	    }
	    /**
	     * Called upon server connect.
	     *
	     * @private
	     */
	    onconnect(id) {
	        debug("socket connected with id %s", id);
	        this.id = id;
	        this.connected = true;
	        this.disconnected = false;
	        super.emit("connect");
	        this.emitBuffered();
	    }
	    /**
	     * Emit buffered events (received and emitted).
	     *
	     * @private
	     */
	    emitBuffered() {
	        this.receiveBuffer.forEach((args) => this.emitEvent(args));
	        this.receiveBuffer = [];
	        this.sendBuffer.forEach((packet) => this.packet(packet));
	        this.sendBuffer = [];
	    }
	    /**
	     * Called upon server disconnect.
	     *
	     * @private
	     */
	    ondisconnect() {
	        debug("server disconnect (%s)", this.nsp);
	        this.destroy();
	        this.onclose("io server disconnect");
	    }
	    /**
	     * Called upon forced client/server side disconnections,
	     * this method ensures the manager stops tracking us and
	     * that reconnections don't get triggered for this.
	     *
	     * @private
	     */
	    destroy() {
	        if (this.subs) {
	            // clean subscriptions to avoid reconnections
	            this.subs.forEach((subDestroy) => subDestroy());
	            this.subs = undefined;
	        }
	        this.io["_destroy"](this);
	    }
	    /**
	     * Disconnects the socket manually.
	     *
	     * @return self
	     * @public
	     */
	    disconnect() {
	        if (this.connected) {
	            debug("performing disconnect (%s)", this.nsp);
	            this.packet({ type: dist.PacketType.DISCONNECT });
	        }
	        // remove socket from pool
	        this.destroy();
	        if (this.connected) {
	            // fire events
	            this.onclose("io client disconnect");
	        }
	        return this;
	    }
	    /**
	     * Alias for disconnect()
	     *
	     * @return self
	     * @public
	     */
	    close() {
	        return this.disconnect();
	    }
	    /**
	     * Sets the compress flag.
	     *
	     * @param compress - if `true`, compresses the sending data
	     * @return self
	     * @public
	     */
	    compress(compress) {
	        this.flags.compress = compress;
	        return this;
	    }
	    /**
	     * Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
	     * ready to send messages.
	     *
	     * @returns self
	     * @public
	     */
	    get volatile() {
	        this.flags.volatile = true;
	        return this;
	    }
	    /**
	     * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
	     * callback.
	     *
	     * @param listener
	     * @public
	     */
	    onAny(listener) {
	        this._anyListeners = this._anyListeners || [];
	        this._anyListeners.push(listener);
	        return this;
	    }
	    /**
	     * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
	     * callback. The listener is added to the beginning of the listeners array.
	     *
	     * @param listener
	     * @public
	     */
	    prependAny(listener) {
	        this._anyListeners = this._anyListeners || [];
	        this._anyListeners.unshift(listener);
	        return this;
	    }
	    /**
	     * Removes the listener that will be fired when any event is emitted.
	     *
	     * @param listener
	     * @public
	     */
	    offAny(listener) {
	        if (!this._anyListeners) {
	            return this;
	        }
	        if (listener) {
	            const listeners = this._anyListeners;
	            for (let i = 0; i < listeners.length; i++) {
	                if (listener === listeners[i]) {
	                    listeners.splice(i, 1);
	                    return this;
	                }
	            }
	        }
	        else {
	            this._anyListeners = [];
	        }
	        return this;
	    }
	    /**
	     * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
	     * e.g. to remove listeners.
	     *
	     * @public
	     */
	    listenersAny() {
	        return this._anyListeners || [];
	    }
	}
	exports.Socket = Socket;
	});

	unwrapExports(socket$1);
	socket$1.Socket;

	/**
	 * Expose `Backoff`.
	 */

	var backo2 = Backoff;

	/**
	 * Initialize backoff timer with `opts`.
	 *
	 * - `min` initial timeout in milliseconds [100]
	 * - `max` max timeout [10000]
	 * - `jitter` [0]
	 * - `factor` [2]
	 *
	 * @param {Object} opts
	 * @api public
	 */

	function Backoff(opts) {
	  opts = opts || {};
	  this.ms = opts.min || 100;
	  this.max = opts.max || 10000;
	  this.factor = opts.factor || 2;
	  this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
	  this.attempts = 0;
	}

	/**
	 * Return the backoff duration.
	 *
	 * @return {Number}
	 * @api public
	 */

	Backoff.prototype.duration = function(){
	  var ms = this.ms * Math.pow(this.factor, this.attempts++);
	  if (this.jitter) {
	    var rand =  Math.random();
	    var deviation = Math.floor(rand * this.jitter * ms);
	    ms = (Math.floor(rand * 10) & 1) == 0  ? ms - deviation : ms + deviation;
	  }
	  return Math.min(ms, this.max) | 0;
	};

	/**
	 * Reset the number of attempts.
	 *
	 * @api public
	 */

	Backoff.prototype.reset = function(){
	  this.attempts = 0;
	};

	/**
	 * Set the minimum duration
	 *
	 * @api public
	 */

	Backoff.prototype.setMin = function(min){
	  this.ms = min;
	};

	/**
	 * Set the maximum duration
	 *
	 * @api public
	 */

	Backoff.prototype.setMax = function(max){
	  this.max = max;
	};

	/**
	 * Set the jitter
	 *
	 * @api public
	 */

	Backoff.prototype.setJitter = function(jitter){
	  this.jitter = jitter;
	};

	var manager = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Manager = void 0;






	const debug = browser("socket.io-client:manager");
	class Manager extends componentEmitter {
	    constructor(uri, opts) {
	        super();
	        this.nsps = {};
	        this.subs = [];
	        if (uri && "object" === typeof uri) {
	            opts = uri;
	            uri = undefined;
	        }
	        opts = opts || {};
	        opts.path = opts.path || "/socket.io";
	        this.opts = opts;
	        this.reconnection(opts.reconnection !== false);
	        this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
	        this.reconnectionDelay(opts.reconnectionDelay || 1000);
	        this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);
	        this.randomizationFactor(opts.randomizationFactor || 0.5);
	        this.backoff = new backo2({
	            min: this.reconnectionDelay(),
	            max: this.reconnectionDelayMax(),
	            jitter: this.randomizationFactor(),
	        });
	        this.timeout(null == opts.timeout ? 20000 : opts.timeout);
	        this._readyState = "closed";
	        this.uri = uri;
	        const _parser = opts.parser || dist;
	        this.encoder = new _parser.Encoder();
	        this.decoder = new _parser.Decoder();
	        this._autoConnect = opts.autoConnect !== false;
	        if (this._autoConnect)
	            this.open();
	    }
	    reconnection(v) {
	        if (!arguments.length)
	            return this._reconnection;
	        this._reconnection = !!v;
	        return this;
	    }
	    reconnectionAttempts(v) {
	        if (v === undefined)
	            return this._reconnectionAttempts;
	        this._reconnectionAttempts = v;
	        return this;
	    }
	    reconnectionDelay(v) {
	        var _a;
	        if (v === undefined)
	            return this._reconnectionDelay;
	        this._reconnectionDelay = v;
	        (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMin(v);
	        return this;
	    }
	    randomizationFactor(v) {
	        var _a;
	        if (v === undefined)
	            return this._randomizationFactor;
	        this._randomizationFactor = v;
	        (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setJitter(v);
	        return this;
	    }
	    reconnectionDelayMax(v) {
	        var _a;
	        if (v === undefined)
	            return this._reconnectionDelayMax;
	        this._reconnectionDelayMax = v;
	        (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMax(v);
	        return this;
	    }
	    timeout(v) {
	        if (!arguments.length)
	            return this._timeout;
	        this._timeout = v;
	        return this;
	    }
	    /**
	     * Starts trying to reconnect if reconnection is enabled and we have not
	     * started reconnecting yet
	     *
	     * @private
	     */
	    maybeReconnectOnOpen() {
	        // Only try to reconnect if it's the first time we're connecting
	        if (!this._reconnecting &&
	            this._reconnection &&
	            this.backoff.attempts === 0) {
	            // keeps reconnection from firing twice for the same reconnection loop
	            this.reconnect();
	        }
	    }
	    /**
	     * Sets the current transport `socket`.
	     *
	     * @param {Function} fn - optional, callback
	     * @return self
	     * @public
	     */
	    open(fn) {
	        debug("readyState %s", this._readyState);
	        if (~this._readyState.indexOf("open"))
	            return this;
	        debug("opening %s", this.uri);
	        this.engine = lib$1(this.uri, this.opts);
	        const socket = this.engine;
	        const self = this;
	        this._readyState = "opening";
	        this.skipReconnect = false;
	        // emit `open`
	        const openSubDestroy = on_1.on(socket, "open", function () {
	            self.onopen();
	            fn && fn();
	        });
	        // emit `error`
	        const errorSub = on_1.on(socket, "error", (err) => {
	            debug("error");
	            self.cleanup();
	            self._readyState = "closed";
	            super.emit("error", err);
	            if (fn) {
	                fn(err);
	            }
	            else {
	                // Only do this if there is no fn to handle the error
	                self.maybeReconnectOnOpen();
	            }
	        });
	        if (false !== this._timeout) {
	            const timeout = this._timeout;
	            debug("connect attempt will timeout after %d", timeout);
	            if (timeout === 0) {
	                openSubDestroy(); // prevents a race condition with the 'open' event
	            }
	            // set timer
	            const timer = setTimeout(() => {
	                debug("connect attempt timed out after %d", timeout);
	                openSubDestroy();
	                socket.close();
	                socket.emit("error", new Error("timeout"));
	            }, timeout);
	            this.subs.push(function subDestroy() {
	                clearTimeout(timer);
	            });
	        }
	        this.subs.push(openSubDestroy);
	        this.subs.push(errorSub);
	        return this;
	    }
	    /**
	     * Alias for open()
	     *
	     * @return self
	     * @public
	     */
	    connect(fn) {
	        return this.open(fn);
	    }
	    /**
	     * Called upon transport open.
	     *
	     * @private
	     */
	    onopen() {
	        debug("open");
	        // clear old subs
	        this.cleanup();
	        // mark as open
	        this._readyState = "open";
	        super.emit("open");
	        // add new subs
	        const socket = this.engine;
	        this.subs.push(on_1.on(socket, "ping", this.onping.bind(this)), on_1.on(socket, "data", this.ondata.bind(this)), on_1.on(socket, "error", this.onerror.bind(this)), on_1.on(socket, "close", this.onclose.bind(this)), on_1.on(this.decoder, "decoded", this.ondecoded.bind(this)));
	    }
	    /**
	     * Called upon a ping.
	     *
	     * @private
	     */
	    onping() {
	        super.emit("ping");
	    }
	    /**
	     * Called with data.
	     *
	     * @private
	     */
	    ondata(data) {
	        this.decoder.add(data);
	    }
	    /**
	     * Called when parser fully decodes a packet.
	     *
	     * @private
	     */
	    ondecoded(packet) {
	        super.emit("packet", packet);
	    }
	    /**
	     * Called upon socket error.
	     *
	     * @private
	     */
	    onerror(err) {
	        debug("error", err);
	        super.emit("error", err);
	    }
	    /**
	     * Creates a new socket for the given `nsp`.
	     *
	     * @return {Socket}
	     * @public
	     */
	    socket(nsp, opts) {
	        let socket = this.nsps[nsp];
	        if (!socket) {
	            socket = new socket$1.Socket(this, nsp, opts);
	            this.nsps[nsp] = socket;
	        }
	        return socket;
	    }
	    /**
	     * Called upon a socket close.
	     *
	     * @param socket
	     * @private
	     */
	    _destroy(socket) {
	        const nsps = Object.keys(this.nsps);
	        for (const nsp of nsps) {
	            const socket = this.nsps[nsp];
	            if (socket.active) {
	                debug("socket %s is still active, skipping close", nsp);
	                return;
	            }
	        }
	        this._close();
	    }
	    /**
	     * Writes a packet.
	     *
	     * @param packet
	     * @private
	     */
	    _packet(packet) {
	        debug("writing packet %j", packet);
	        if (packet.query && packet.type === 0)
	            packet.nsp += "?" + packet.query;
	        const encodedPackets = this.encoder.encode(packet);
	        for (let i = 0; i < encodedPackets.length; i++) {
	            this.engine.write(encodedPackets[i], packet.options);
	        }
	    }
	    /**
	     * Clean up transport subscriptions and packet buffer.
	     *
	     * @private
	     */
	    cleanup() {
	        debug("cleanup");
	        this.subs.forEach((subDestroy) => subDestroy());
	        this.subs.length = 0;
	        this.decoder.destroy();
	    }
	    /**
	     * Close the current socket.
	     *
	     * @private
	     */
	    _close() {
	        debug("disconnect");
	        this.skipReconnect = true;
	        this._reconnecting = false;
	        if ("opening" === this._readyState) {
	            // `onclose` will not fire because
	            // an open event never happened
	            this.cleanup();
	        }
	        this.backoff.reset();
	        this._readyState = "closed";
	        if (this.engine)
	            this.engine.close();
	    }
	    /**
	     * Alias for close()
	     *
	     * @private
	     */
	    disconnect() {
	        return this._close();
	    }
	    /**
	     * Called upon engine close.
	     *
	     * @private
	     */
	    onclose(reason) {
	        debug("onclose");
	        this.cleanup();
	        this.backoff.reset();
	        this._readyState = "closed";
	        super.emit("close", reason);
	        if (this._reconnection && !this.skipReconnect) {
	            this.reconnect();
	        }
	    }
	    /**
	     * Attempt a reconnection.
	     *
	     * @private
	     */
	    reconnect() {
	        if (this._reconnecting || this.skipReconnect)
	            return this;
	        const self = this;
	        if (this.backoff.attempts >= this._reconnectionAttempts) {
	            debug("reconnect failed");
	            this.backoff.reset();
	            super.emit("reconnect_failed");
	            this._reconnecting = false;
	        }
	        else {
	            const delay = this.backoff.duration();
	            debug("will wait %dms before reconnect attempt", delay);
	            this._reconnecting = true;
	            const timer = setTimeout(() => {
	                if (self.skipReconnect)
	                    return;
	                debug("attempting reconnect");
	                super.emit("reconnect_attempt", self.backoff.attempts);
	                // check again for the case socket closed in above events
	                if (self.skipReconnect)
	                    return;
	                self.open((err) => {
	                    if (err) {
	                        debug("reconnect attempt error");
	                        self._reconnecting = false;
	                        self.reconnect();
	                        super.emit("reconnect_error", err);
	                    }
	                    else {
	                        debug("reconnect success");
	                        self.onreconnect();
	                    }
	                });
	            }, delay);
	            this.subs.push(function subDestroy() {
	                clearTimeout(timer);
	            });
	        }
	    }
	    /**
	     * Called upon successful reconnect.
	     *
	     * @private
	     */
	    onreconnect() {
	        const attempt = this.backoff.attempts;
	        this._reconnecting = false;
	        this.backoff.reset();
	        super.emit("reconnect", attempt);
	    }
	}
	exports.Manager = Manager;
	});

	unwrapExports(manager);
	manager.Manager;

	var build = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Socket = exports.io = exports.Manager = exports.protocol = void 0;



	Object.defineProperty(exports, "Socket", { enumerable: true, get: function () { return socket$1.Socket; } });
	const debug = browser("socket.io-client");
	/**
	 * Module exports.
	 */
	module.exports = exports = lookup;
	/**
	 * Managers cache.
	 */
	const cache = (exports.managers = {});
	function lookup(uri, opts) {
	    if (typeof uri === "object") {
	        opts = uri;
	        uri = undefined;
	    }
	    opts = opts || {};
	    const parsed = url_1.url(uri);
	    const source = parsed.source;
	    const id = parsed.id;
	    const path = parsed.path;
	    const sameNamespace = cache[id] && path in cache[id]["nsps"];
	    const newConnection = opts.forceNew ||
	        opts["force new connection"] ||
	        false === opts.multiplex ||
	        sameNamespace;
	    let io;
	    if (newConnection) {
	        debug("ignoring socket cache for %s", source);
	        io = new manager.Manager(source, opts);
	    }
	    else {
	        if (!cache[id]) {
	            debug("new io instance for %s", source);
	            cache[id] = new manager.Manager(source, opts);
	        }
	        io = cache[id];
	    }
	    if (parsed.query && !opts.query) {
	        opts.query = parsed.query;
	    }
	    return io.socket(parsed.path, opts);
	}
	exports.io = lookup;
	/**
	 * Protocol version.
	 *
	 * @public
	 */

	Object.defineProperty(exports, "protocol", { enumerable: true, get: function () { return dist.protocol; } });
	/**
	 * `connect`.
	 *
	 * @param {String} uri
	 * @public
	 */
	exports.connect = lookup;
	/**
	 * Expose constructors for standalone build.
	 *
	 * @public
	 */
	var manager_2 = manager;
	Object.defineProperty(exports, "Manager", { enumerable: true, get: function () { return manager_2.Manager; } });
	});

	unwrapExports(build);
	build.Socket;
	build.io;
	build.Manager;
	build.protocol;
	build.managers;
	build.connect;

	var WebsocketBridge = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.sendNewVersion = exports.broadcastNewVersion = exports.unsubscribeFromRemoteChanges = exports.subscribeToRemoteChanges = exports.previousInQueue = exports.nextInQueue = exports.connect = void 0;

	const subscribers = [];
	let socket = null;
	let id = -1;
	function connect(url = "http://localhost", port = 5000, namespace = "") {
	    socket = build(`${url}:${port}/${namespace}`);
	    socket.on('broadcast_spec', function (msg) {
	        onExternallyUpdatedSpec(msg);
	        console.log(msg);
	    });
	    socket.on("send_spec", function (msg) {
	        if (msg.target !== id) {
	            return;
	        }
	        onExternallyUpdatedSpec(msg);
	        console.log(msg);
	    });
	    id = Math.random();
	    socket.emit("register", { "id": id });
	}
	exports.connect = connect;
	function onExternallyUpdatedSpec(message) {
	    subscribers.forEach((callback) => callback(message.spec, message.version));
	}
	function nextInQueue(spec, version) {
	    socket.emit("get_next", { spec, version, source: id });
	}
	exports.nextInQueue = nextInQueue;
	function previousInQueue(spec, version) {
	    socket.emit("get_previous", { spec, version, source: id });
	}
	exports.previousInQueue = previousInQueue;
	function subscribeToRemoteChanges(callback) {
	    subscribers.push(callback);
	}
	exports.subscribeToRemoteChanges = subscribeToRemoteChanges;
	function unsubscribeFromRemoteChanges(callback) {
	    const indexInSubscribers = subscribers.indexOf(callback);
	    if (indexInSubscribers > -1) {
	        subscribers.splice(indexInSubscribers, 1);
	    }
	}
	exports.unsubscribeFromRemoteChanges = unsubscribeFromRemoteChanges;
	function broadcastNewVersion(spec, version) {
	    socket.emit("update_spec", { spec, version });
	}
	exports.broadcastNewVersion = broadcastNewVersion;
	function sendNewVersion(spec, version) {
	    socket.emit("send_spec", { spec, version });
	}
	exports.sendNewVersion = sendNewVersion;
	});

	unwrapExports(WebsocketBridge);
	WebsocketBridge.sendNewVersion;
	WebsocketBridge.broadcastNewVersion;
	WebsocketBridge.unsubscribeFromRemoteChanges;
	WebsocketBridge.subscribeToRemoteChanges;
	WebsocketBridge.previousInQueue;
	WebsocketBridge.nextInQueue;
	WebsocketBridge.connect;

	var dist$1 = createCommonjsModule(function (module, exports) {
	var __createBinding = (commonjsGlobal && commonjsGlobal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __exportStar = (commonjsGlobal && commonjsGlobal.__exportStar) || function(m, exports) {
	    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	__exportStar(ViewModel, exports);
	__exportStar(DataModel, exports);
	__exportStar(WebsocketBridge, exports);
	});

	var index = unwrapExports(dist$1);

	return index;

})));
//# sourceMappingURL=bundle.js.map
