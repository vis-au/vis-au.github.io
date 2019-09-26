(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = global || self, global.vl = factory());
}(this, function () { 'use strict';

	function unwrapExports (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var Template_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	class Template {
	    constructor(visualElements, layout, parent) {
	        this.visualElements = visualElements;
	        this.layout = layout;
	        this.parent = parent;
	        this.id = `template${Math.round(Math.random() * 10000)}`;
	        this.hierarchyLevel = -1;
	        this.dataNode = null;
	        this.encodings = new Map();
	        this.overwrittenEncodings = new Map();
	    }
	    /**
	     * Returns the flattened hierarchy of templates succeeding this one.
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
	     * Returns the hierarchy level of this template, starting at 0.
	     */
	    getHierarchyLevel() {
	        if (this.hierarchyLevel > -1) {
	            return this.hierarchyLevel;
	        }
	        // since the template may have visual elements from different leves, output the highest value
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
	exports.Template = Template;
	});

	unwrapExports(Template_1);
	var Template_2 = Template_1.Template;

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

	var id = field('id');

	var identity = accessor(function(_) { return _; }, empty, 'identity');

	var zero = accessor(function() { return 0; }, empty, 'zero');

	var one = accessor(function() { return 1; }, empty, 'one');

	var truthy = accessor(function() { return true; }, empty, 'true');

	var falsy = accessor(function() { return false; }, empty, 'false');

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

	if ( module.exports) {
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
	function flagKeys(f) {
	    return keys(f);
	}
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
	const PRIMITIVE_MARKS = flagKeys(MARK_INDEX);
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
	    line: ['point'],
	    text: ['shortTimeLabels'],
	    tick: ['bandSize', 'thickness']
	};
	const defaultMarkConfig = {
	    color: '#4c78a8',
	    tooltip: { content: 'encoding' }
	};
	const defaultBarConfig = {
	    binSpacing: 1,
	    continuousBandSize: 5
	};
	const defaultTickConfig = {
	    thickness: 1
	};
	function getMarkType(m) {
	    return isMarkDef(m) ? m.type : m;
	}

	var mark = /*#__PURE__*/Object.freeze({
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
		defaultTickConfig: defaultTickConfig,
		getMarkType: getMarkType
	});

	var PlotTemplate_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });


	class PlotTemplate extends Template_1.Template {
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
	exports.PlotTemplate = PlotTemplate;
	});

	unwrapExports(PlotTemplate_1);
	var PlotTemplate_2 = PlotTemplate_1.PlotTemplate;

	var CompositionTemplate_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });

	class CompositionTemplate extends Template_1.Template {
	    constructor(composition, visualElements, parent = null) {
	        super(visualElements, composition, parent);
	    }
	}
	exports.CompositionTemplate = CompositionTemplate;
	});

	unwrapExports(CompositionTemplate_1);
	var CompositionTemplate_2 = CompositionTemplate_1.CompositionTemplate;

	var ConcatTemplate_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });

	class ConcatTemplate extends CompositionTemplate_1.CompositionTemplate {
	    constructor(visualElements, parent = null) {
	        super('concatenate', visualElements, parent);
	        this.isVertical = true;
	        this.isWrappable = false;
	    }
	}
	exports.ConcatTemplate = ConcatTemplate;
	});

	unwrapExports(ConcatTemplate_1);
	var ConcatTemplate_2 = ConcatTemplate_1.ConcatTemplate;

	var FacetTemplate_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });

	class FacetTemplate extends CompositionTemplate_1.CompositionTemplate {
	    constructor(visualElements, parent = null) {
	        super('facet', visualElements, parent);
	        this.isInlineFacetted = false;
	    }
	}
	exports.FacetTemplate = FacetTemplate;
	});

	unwrapExports(FacetTemplate_1);
	var FacetTemplate_2 = FacetTemplate_1.FacetTemplate;

	var LayerTemplate_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });

	class LayerTemplate extends CompositionTemplate_1.CompositionTemplate {
	    constructor(visualElements, parent = null) {
	        super('overlay', visualElements, parent);
	        this.groupEncodings = new Map();
	    }
	}
	exports.LayerTemplate = LayerTemplate;
	});

	unwrapExports(LayerTemplate_1);
	var LayerTemplate_2 = LayerTemplate_1.LayerTemplate;

	var RepeatTemplate_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });

	class RepeatTemplate extends CompositionTemplate_1.CompositionTemplate {
	    constructor(visualElements, parent = null) {
	        super('repeat', visualElements, parent);
	        this.repeat = {};
	    }
	}
	exports.RepeatTemplate = RepeatTemplate;
	});

	unwrapExports(RepeatTemplate_1);
	var RepeatTemplate_2 = RepeatTemplate_1.RepeatTemplate;

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
	var MarkEncoding_1 = MarkEncoding.positionEncodings;
	var MarkEncoding_2 = MarkEncoding.geographicPositionEncodings;
	var MarkEncoding_3 = MarkEncoding.markPropertiesChannelEncodings;
	var MarkEncoding_4 = MarkEncoding.textTooltipChannelEncodings;
	var MarkEncoding_5 = MarkEncoding.hyperLinkChannelEncodings;
	var MarkEncoding_6 = MarkEncoding.keyChannelEncodings;
	var MarkEncoding_7 = MarkEncoding.orderChannelEncodings;
	var MarkEncoding_8 = MarkEncoding.loDChannelEncodings;
	var MarkEncoding_9 = MarkEncoding.facetChannelEncodings;
	var MarkEncoding_10 = MarkEncoding.markEncodings;
	var MarkEncoding_11 = MarkEncoding.markEncodingGroups;

	var SpecUtils = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });



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
	function getJoinedDatasetsOfChildNodes(template) {
	    const joinedDatasets = {};
	    const visualElements = template.getFlatHierarchy();
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
	function getAllDatasetsInHierarchy(template) {
	    const allDatasetsInHierarchy = getJoinedDatasetsOfChildNodes(template);
	    let rootTemplate = template;
	    // only get datasets that are direct ancestors of the template, as siblings are not relevant
	    while (rootTemplate.parent !== null) {
	        rootTemplate = rootTemplate.parent;
	        if (rootTemplate.datasets) {
	            Object.keys(rootTemplate.datasets).forEach(key => {
	                allDatasetsInHierarchy[key] = rootTemplate.datasets[key];
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
	var SpecUtils_1 = SpecUtils.isAtomicSchema;
	var SpecUtils_2 = SpecUtils.isOverlaySchema;
	var SpecUtils_3 = SpecUtils.isRepeatSchema;
	var SpecUtils_4 = SpecUtils.isConcatenateSchema;
	var SpecUtils_5 = SpecUtils.isInlineFacetSchema;
	var SpecUtils_6 = SpecUtils.isFacetSchema;
	var SpecUtils_7 = SpecUtils.isCompositionSchema;
	var SpecUtils_8 = SpecUtils.isPlotSchema;
	var SpecUtils_9 = SpecUtils.getCompositionType;
	var SpecUtils_10 = SpecUtils.getLayerAbstraction;
	var SpecUtils_11 = SpecUtils.getRepeatAbstraction;
	var SpecUtils_12 = SpecUtils.getFacetAbstraction;
	var SpecUtils_13 = SpecUtils.getConcatAbstraction;
	var SpecUtils_14 = SpecUtils.getMarkPropertiesAsMap;
	var SpecUtils_15 = SpecUtils.getAtomicAbstraction;
	var SpecUtils_16 = SpecUtils.setSingleViewProperties;
	var SpecUtils_17 = SpecUtils.getJoinedDatasetsOfChildNodes;
	var SpecUtils_18 = SpecUtils.getAllDatasetsInHierarchy;
	var SpecUtils_19 = SpecUtils.getAbstraction;
	var SpecUtils_20 = SpecUtils.setSchemaSize;

	var GraphNode_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
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
	var GraphNode_2 = GraphNode_1.GraphNode;

	var DatasetNode_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });

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
	var DatasetNode_2 = DatasetNode_1.DatasetNode;

	var TranformNode = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });


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
	var TranformNode_1 = TranformNode.TransformNode;

	var TransformTypes = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.transformNames = ['aggregate', 'bin', 'calculate', 'filter', 'flatten',
	    'fold', 'impute', 'join aggregate', 'lookup', 'sample', 'stack', 'time unit'];
	});

	unwrapExports(TransformTypes);
	var TransformTypes_1 = TransformTypes.transformNames;

	var InlineDatasetNode_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });

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
	var InlineDatasetNode_2 = InlineDatasetNode_1.InlineDatasetNode;

	var NamedDataSourceNode_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });

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
	var NamedDataSourceNode_2 = NamedDataSourceNode_1.NamedDataSourceNode;

	var URLDatasetNode_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });

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
	var URLDatasetNode_2 = URLDatasetNode_1.URLDatasetNode;

	var EOL = {},
	    EOF = {},
	    QUOTE = 34,
	    NEWLINE = 10,
	    RETURN = 13;

	function objectConverter(columns) {
	  return new Function("d", "return {" + columns.map(function(name, i) {
	    return JSON.stringify(name) + ": d[" + i + "]";
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
	    formatRows: formatRows
	  };
	}

	var csv = dsv(",");

	var csvParse = csv.parse;
	var csvParseRows = csv.parseRows;
	var csvFormat = csv.format;
	var csvFormatBody = csv.formatBody;
	var csvFormatRows = csv.formatRows;

	var tsv = dsv("\t");

	var tsvParse = tsv.parse;
	var tsvParseRows = tsv.parseRows;
	var tsvFormat = tsv.format;
	var tsvFormatBody = tsv.formatBody;
	var tsvFormatRows = tsv.formatRows;

	function autoType(object) {
	  for (var key in object) {
	    var value = object[key].trim(), number;
	    if (!value) value = null;
	    else if (value === "true") value = true;
	    else if (value === "false") value = false;
	    else if (value === "NaN") value = NaN;
	    else if (!isNaN(number = +value)) value = number;
	    else if (/^([-+]\d{2})?\d{4}(-\d{2}(-\d{2})?)?(T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?(Z|[-+]\d{2}:\d{2})?)?$/.test(value)) value = new Date(value);
	    else continue;
	    object[key] = value;
	  }
	  return object;
	}



	var src = /*#__PURE__*/Object.freeze({
		dsvFormat: dsv,
		csvParse: csvParse,
		csvParseRows: csvParseRows,
		csvFormat: csvFormat,
		csvFormatBody: csvFormatBody,
		csvFormatRows: csvFormatRows,
		tsvParse: tsvParse,
		tsvParseRows: tsvParseRows,
		tsvFormat: tsvFormat,
		tsvFormatBody: tsvFormatBody,
		tsvFormatRows: tsvFormatRows,
		autoType: autoType
	});

	var DataImporter_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });




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
	var DataImporter_2 = DataImporter_1.DataImporter;

	var DataModel = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });

	exports.GraphNode = GraphNode_1.GraphNode;

	exports.TransformNode = TranformNode.TransformNode;

	exports.transformNames = TransformTypes.transformNames;

	exports.DatasetNode = DatasetNode_1.DatasetNode;

	exports.InlineDatasetNode = InlineDatasetNode_1.InlineDatasetNode;

	exports.NamedDataSourceNode = NamedDataSourceNode_1.NamedDataSourceNode;

	exports.URLDatasetNode = URLDatasetNode_1.URLDatasetNode;

	exports.DataImporter = DataImporter_1.DataImporter;
	});

	unwrapExports(DataModel);
	var DataModel_1 = DataModel.GraphNode;
	var DataModel_2 = DataModel.TransformNode;
	var DataModel_3 = DataModel.transformNames;
	var DataModel_4 = DataModel.DatasetNode;
	var DataModel_5 = DataModel.InlineDatasetNode;
	var DataModel_6 = DataModel.NamedDataSourceNode;
	var DataModel_7 = DataModel.URLDatasetNode;
	var DataModel_8 = DataModel.DataImporter;

	var SpecCompiler_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });









	class SpecCompiler {
	    getBasicSchema(template) {
	        // check for empty templates, which should also generate valid specs
	        if (template && template.visualElements.length === 0 && template.parent === null) {
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
	    setCompositionProperties(schema, template) {
	        if (template.columns !== undefined) {
	            schema.columns = template.columns;
	        }
	        if (template.spacing !== undefined) {
	            schema.spacing = template.spacing;
	        }
	        return schema;
	    }
	    setToplevelProperties(schema, template, includeData = true) {
	        if (includeData && !!template.data) {
	            schema.data = template.data;
	            const dataNode = template.dataTransformationNode;
	            if (dataNode instanceof DataModel.TransformNode) {
	                schema.transform = dataNode.getTransform();
	            }
	            else if (dataNode instanceof DataModel.DatasetNode) {
	                schema.transform = dataNode.getAllChildNodes().map(node => node.transform);
	            }
	        }
	        if (includeData && !!template.datasets) {
	            schema.datasets = template.datasets;
	        }
	        if (template.bounds !== undefined) {
	            schema.bounds = template.bounds;
	        }
	        if (template.height !== undefined) {
	            schema.height = template.height;
	        }
	        if (template.width !== undefined) {
	            schema.width = template.width;
	        }
	        if (template.config !== undefined) {
	            schema.config = template.config;
	        }
	        if (template instanceof CompositionTemplate_1.CompositionTemplate) {
	            schema = this.setCompositionProperties(schema, template);
	        }
	        return schema;
	    }
	    getRootTemplate(template) {
	        let workingNode = template;
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
	    applyRepeatLayout(template, schema) {
	        schema = this.abstractCompositions(schema, 'spec');
	        // parent must be repeat template to reach this branch
	        schema.repeat = template.parent.repeat;
	        return schema;
	    }
	    applyFacetLayout(template, schema) {
	        const parentTemplate = template.parent;
	        if (parentTemplate.isInlineFacetted) {
	            if (schema.encoding === undefined) {
	                schema.encoding = {};
	            }
	            schema.encoding.facet = parentTemplate.facet;
	        }
	        else {
	            schema = this.abstractCompositions(schema, 'spec');
	            schema.facet = parentTemplate.facet;
	        }
	        return schema;
	    }
	    applyConcatLayout(schema) {
	        return this.abstractCompositions(schema, 'hconcat');
	    }
	    applyOverlayLayout(schema) {
	        return this.abstractCompositions(schema, 'layer');
	    }
	    applyCompositionLayout(template, schema, composition) {
	        if (composition === 'repeat') {
	            this.applyRepeatLayout(template, schema);
	        }
	        else if (composition === 'facet') {
	            this.applyFacetLayout(template, schema);
	        }
	        else if (composition === 'concatenate') {
	            this.applyConcatLayout(schema);
	        }
	        else if (composition === 'overlay') {
	            this.applyOverlayLayout(schema);
	        }
	        return schema;
	    }
	    getDataInHierarchy(template) {
	        // data can be stored either in a child node or on the top level template, therefore find the
	        // top level, get its flat hierarchy and find a template with a dataset bound to it
	        let topLevelTemplate = template;
	        let data = null;
	        while (topLevelTemplate.parent !== null) {
	            if (topLevelTemplate.data !== undefined && topLevelTemplate.data !== null) {
	                data = topLevelTemplate.data;
	                return data;
	            }
	            topLevelTemplate = topLevelTemplate.parent;
	        }
	        const flatHierarchy = topLevelTemplate.getFlatHierarchy();
	        const dataTemplate = flatHierarchy.find(t => {
	            return t.data !== null && t.data !== undefined;
	        });
	        // could occur when template has no parent, no visualelements and no data (i.e. is "empty")
	        if (dataTemplate === undefined) {
	            return {
	                values: [],
	            };
	        }
	        data = dataTemplate.data;
	        return data;
	    }
	    getDatasetsInAncestry(template) {
	        // if the template references a namedDataset, also include that dataset.
	        if (template.data !== null && !data.isNamedData(template.data)) {
	            return null;
	        }
	        let workingNode = template;
	        while (workingNode !== null && (workingNode.datasets === null || workingNode.datasets === undefined)) {
	            workingNode = workingNode.parent;
	        }
	        if (workingNode === null) {
	            return null;
	        }
	        return workingNode.datasets;
	    }
	    getRepeatSpec(parentTemplate) {
	        const template = parentTemplate.visualElements[0];
	        const layout = parentTemplate.layout;
	        let schema = null;
	        schema = this.getVegaSpecification(template, false);
	        if (schema !== null) {
	            schema = this.applyCompositionLayout(template, schema, layout);
	        }
	        return schema;
	    }
	    getFacetSpec(parentTemplate) {
	        const encodingTemplate = parentTemplate.visualElements[0];
	        let schema = null;
	        // use the encodings from the child template, then apply facetting properties
	        schema = this.getVegaSpecification(encodingTemplate, false);
	        schema = this.applyCompositionLayout(encodingTemplate, schema, 'facet');
	        return schema;
	    }
	    getMultiViewSpec(template, useOverwrittenEncodings) {
	        const templates = template.visualElements;
	        const schema = this.getBasicSchema();
	        const overwriteChildEncodings = !(template instanceof RepeatTemplate_1.RepeatTemplate) && useOverwrittenEncodings;
	        const individualSchemas = templates
	            .map(t => this.getVegaSpecification(t, false, overwriteChildEncodings));
	        const individualViewAbstractions = individualSchemas
	            .map(s => SpecUtils.getAbstraction(s));
	        if (template instanceof ConcatTemplate_1.ConcatTemplate) {
	            if (template.isVertical) {
	                schema.vconcat = individualViewAbstractions;
	            }
	            else {
	                schema.hconcat = individualViewAbstractions;
	            }
	        }
	        else if (template instanceof LayerTemplate_1.LayerTemplate) {
	            if (template.groupEncodings.size > 0) {
	                schema.encoding = {};
	                template.groupEncodings.forEach((value, key) => schema.encoding[key] = value);
	                individualViewAbstractions.forEach(abstraction => {
	                    delete abstraction.data;
	                    delete abstraction.datasets;
	                });
	            }
	            schema.layer = individualViewAbstractions;
	        }
	        return schema;
	    }
	    getPlotSchema(template, inferData, useOverwrittenEncodings) {
	        const schema = this.getBasicSchema();
	        let data = template.data;
	        let datasets = template.datasets;
	        if (inferData) {
	            data = this.getDataInHierarchy(template);
	            datasets = this.getDatasetsInAncestry(template);
	        }
	        if (data !== undefined && data !== null) {
	            schema.data = data;
	        }
	        if (datasets !== undefined && datasets !== null) {
	            schema.datasets = datasets;
	        }
	        schema.mark = template.mark;
	        if (template.selection !== undefined) {
	            schema.selection = template.selection;
	        }
	        schema.encoding = {};
	        template.encodings.forEach((value, key) => {
	            schema.encoding[key] = value;
	        });
	        // do not overwrite encodings of repeated plots, as this would in turn use a mapping to a field
	        // instead of the repeated column/row
	        if (useOverwrittenEncodings) {
	            template.overwrittenEncodings.forEach((value, key) => {
	                schema.encoding[key] = value;
	            });
	        }
	        return schema;
	    }
	    getCompositionSchema(template, inferData, useOverwrittenEncodings) {
	        let schema = null;
	        let data = null;
	        let datasets = null;
	        if (template.visualElements.length === 0) {
	            schema = this.getBasicSchema(template);
	        }
	        else if (template instanceof RepeatTemplate_1.RepeatTemplate) {
	            schema = this.getRepeatSpec(template);
	        }
	        else if (template instanceof FacetTemplate_1.FacetTemplate) {
	            schema = this.getFacetSpec(template);
	        }
	        else {
	            schema = this.getMultiViewSpec(template, useOverwrittenEncodings);
	        }
	        if (inferData) {
	            data = this.getDataInHierarchy(template);
	            datasets = SpecUtils.getAllDatasetsInHierarchy(template);
	        }
	        else {
	            data = template.data;
	            datasets = template.datasets;
	        }
	        if (data !== undefined && data !== null) {
	            schema.data = data;
	        }
	        if (datasets !== undefined && datasets !== null) {
	            schema.datasets = datasets;
	        }
	        if (template.resolve !== undefined) {
	            schema.resolve = template.resolve;
	        }
	        return schema;
	    }
	    getVegaSpecification(template, inferProperties = false, useOverwrittenEncodings = false) {
	        let schema = null;
	        if (template instanceof PlotTemplate_1.PlotTemplate) {
	            schema = this.getPlotSchema(template, inferProperties, useOverwrittenEncodings);
	        }
	        else if (template instanceof CompositionTemplate_1.CompositionTemplate) {
	            schema = this.getCompositionSchema(template, inferProperties, useOverwrittenEncodings);
	        }
	        schema = this.setToplevelProperties(schema, template);
	        if (inferProperties) {
	            const rootTemplate = this.getRootTemplate(template);
	            schema = this.setToplevelProperties(schema, rootTemplate, false);
	        }
	        return schema;
	    }
	}
	exports.SpecCompiler = SpecCompiler;
	});

	unwrapExports(SpecCompiler_1);
	var SpecCompiler_2 = SpecCompiler_1.SpecCompiler;

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
	        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
	            t[p[i]] = s[p[i]];
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
	const SHARED_DOMAIN_OP_INDEX = toSet(SHARED_DOMAIN_OPS);

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
	const GEOPOSITION_CHANNEL_INDEX = {
	    longitude: 1,
	    longitude2: 1,
	    latitude: 1,
	    latitude2: 1
	};
	const UNIT_CHANNEL_INDEX = Object.assign({ 
	    // position
	    x: 1, y: 1, x2: 1, y2: 1 }, GEOPOSITION_CHANNEL_INDEX, { 
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
	const SINGLE_DEF_CHANNEL_INDEX = __rest(CHANNEL_INDEX, ["order", "detail"]);
	const SINGLE_DEF_UNIT_CHANNEL_INDEX = __rest(CHANNEL_INDEX, ["order", "detail", "row", "column", "facet"]);
	function isSecondaryRangeChannel(c) {
	    const main = getMainRangeChannel(c);
	    return main !== c;
	}
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
	const POSITION_SCALE_CHANNELS = flagKeys(POSITION_SCALE_CHANNEL_INDEX);
	// NON_POSITION_SCALE_CHANNEL = SCALE_CHANNELS without X, Y
	const NONPOSITION_SCALE_CHANNEL_INDEX = __rest(NONPOSITION_CHANNEL_INDEX, ["text", "tooltip", "href", "detail", "key", "order"]);
	// Declare SCALE_CHANNEL_INDEX
	const SCALE_CHANNEL_INDEX = Object.assign({}, POSITION_SCALE_CHANNEL_INDEX, NONPOSITION_SCALE_CHANNEL_INDEX);
	function isScaleChannel(channel) {
	    return !!SCALE_CHANNEL_INDEX[channel];
	}
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
	 */
	function dateTimeExpr(d, normalize = false) {
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
	    if (d.utc) {
	        return `utc(${units.join(', ')})`;
	    }
	    else {
	        return `datetime(${units.join(', ')})`;
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
	const TIMEUNIT_PARTS = flagKeys(LOCAL_SINGLE_TIMEUNIT_INDEX);
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
	const UTC_TIMEUNIT_INDEX = Object.assign({}, UTC_SINGLE_TIMEUNIT_INDEX, UTC_MULTI_TIMEUNIT_INDEX);
	function getLocalTimeUnit(t) {
	    return t.substr(3);
	}
	const TIMEUNIT_INDEX = Object.assign({}, LOCAL_SINGLE_TIMEUNIT_INDEX, UTC_SINGLE_TIMEUNIT_INDEX, LOCAL_MULTI_TIMEUNIT_INDEX, UTC_MULTI_TIMEUNIT_INDEX);
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
	    return fieldDef;
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
	function isNumberFieldDef(fieldDef) {
	    return fieldDef.type === 'quantitative' || isBinning(fieldDef.bin);
	}
	/**
	 * Check if the field def uses a time format or does not use any format but is temporal (this does not cover field defs that are temporal but use a number format).
	 */
	function isTimeFormatFieldDef(fieldDef) {
	    const formatType = (isPositionFieldDef(fieldDef) && fieldDef.axis && fieldDef.axis.formatType) ||
	        (isMarkPropFieldDef(fieldDef) && fieldDef.legend && fieldDef.legend.formatType) ||
	        (isTextFieldDef(fieldDef) && fieldDef.formatType);
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
		isNumberFieldDef: isNumberFieldDef,
		isTimeFormatFieldDef: isTimeFormatFieldDef,
		isTimeFieldDef: isTimeFieldDef,
		valueExpr: valueExpr,
		valueArray: valueArray,
		binRequiresRange: binRequiresRange
	});

	var SpecParser_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
















	class SpecParser {
	    getEncodingsMapFromPlotSchema(schema) {
	        const templateEncodings = new Map();
	        // a mark can also be configured using the "global" encoding of layered views, in this case the
	        // mark's encoding can be empty
	        if (schema.encoding === undefined) {
	            return templateEncodings;
	        }
	        const schemaEncodings = Object.keys(schema.encoding);
	        schemaEncodings.forEach((encoding) => {
	            templateEncodings.set(encoding, schema.encoding[encoding]);
	        });
	        return templateEncodings;
	    }
	    setSingleViewProperties(schema, template) {
	        template.description = schema.description;
	        template.bounds = schema.bounds;
	        template.width = schema.width;
	        template.height = schema.height;
	        template.config = schema.config;
	        template.datasets = schema.datasets;
	        if (template instanceof CompositionTemplate_1.CompositionTemplate) {
	            template.spacing = schema.spacing;
	            template.columns = schema.columns;
	        }
	    }
	    getNonRepeatSubtrees(template) {
	        const nonRepeatSubtrees = [];
	        template.visualElements.forEach(t => {
	            if (!(t instanceof RepeatTemplate_1.RepeatTemplate)) {
	                nonRepeatSubtrees.push(t);
	                nonRepeatSubtrees.push(...this.getNonRepeatSubtrees(t));
	            }
	        });
	        return nonRepeatSubtrees;
	    }
	    /**
	     * In a repeat spec, the bindings inside the child templates can reference the repeated fields
	     * instead of fields from the data. In order to render such a template without its parent,
	     * modify this binding to the first entries in the repeated fields of the parent
	     */
	    removeRepeatFromChildTemplates(template) {
	        const nonRepeatSubTemplates = this.getNonRepeatSubtrees(template);
	        nonRepeatSubTemplates.forEach(childTemplate => {
	            const repeatedFields = template.repeat.column.concat(template.repeat.row);
	            childTemplate.encodings.forEach((value, key) => {
	                if (channeldef.isFieldDef(value)) {
	                    if (channeldef.isRepeatRef(value.field)) {
	                        const index = Math.floor(Math.random() * repeatedFields.length);
	                        const fieldRef = {
	                            field: repeatedFields[index],
	                            type: value.type
	                        };
	                        childTemplate.overwrittenEncodings.set(key, fieldRef);
	                    }
	                }
	            });
	        });
	    }
	    getRepeatTemplate(schema) {
	        const template = new RepeatTemplate_1.RepeatTemplate([]);
	        template.repeat = schema.repeat;
	        const childTemplate = this.parse(schema.spec);
	        template.visualElements = [childTemplate];
	        this.removeRepeatFromChildTemplates(template);
	        return template;
	    }
	    getFacetTemplate(schema) {
	        const template = new FacetTemplate_1.FacetTemplate([]);
	        const visualElements = [];
	        if (schema.facet !== undefined) {
	            template.facet = JSON.parse(JSON.stringify(schema.facet));
	            delete schema.facet;
	            visualElements.push(this.parse(schema.spec));
	        }
	        else if (schema.encoding.facet !== undefined) {
	            template.isInlineFacetted = true;
	            template.facet = JSON.parse(JSON.stringify(schema.encoding.facet));
	            delete schema.encoding.facet;
	            visualElements.push(this.parse(schema));
	        }
	        template.visualElements = visualElements;
	        return template;
	    }
	    getLayerTemplate(schema) {
	        const template = new LayerTemplate_1.LayerTemplate([]);
	        if (schema.encoding !== undefined) {
	            const groupEncodings = Object.keys(schema.encoding);
	            groupEncodings.forEach((encoding) => {
	                template.groupEncodings.set(encoding, schema.encoding[encoding]);
	            });
	        }
	        schema.layer.forEach((layer) => {
	            template.visualElements.push(this.parse(layer));
	        });
	        return template;
	    }
	    getConcatTemplate(schema) {
	        const template = new ConcatTemplate_1.ConcatTemplate([]);
	        if (spec.isVConcatSpec(schema)) {
	            template.isVertical = true;
	            template.isWrappable = false;
	            schema.vconcat.forEach((layer) => {
	                template.visualElements.push(this.parse(layer));
	            });
	        }
	        else if (spec.isHConcatSpec(schema)) {
	            template.isVertical = false;
	            template.isWrappable = false;
	            schema.hconcat.forEach((layer) => {
	                template.visualElements.push(this.parse(layer));
	            });
	        }
	        else if (concat.isConcatSpec(schema)) {
	            template.isVertical = false;
	            template.isWrappable = true;
	            schema.concat.forEach((layer) => {
	                template.visualElements.push(this.parse(layer));
	            });
	        }
	        return template;
	    }
	    getCompositionTemplate(schema) {
	        let template = null;
	        if (SpecUtils.isRepeatSchema(schema)) {
	            template = this.getRepeatTemplate(schema);
	        }
	        else if (SpecUtils.isOverlaySchema(schema)) {
	            template = this.getLayerTemplate(schema);
	        }
	        else if (SpecUtils.isFacetSchema(schema)) {
	            template = this.getFacetTemplate(schema);
	        }
	        else if (SpecUtils.isConcatenateSchema(schema)) {
	            template = this.getConcatTemplate(schema);
	        }
	        const encodings = this.getEncodingsMapFromPlotSchema(schema);
	        template.encodings = encodings;
	        template.resolve = schema.resolve;
	        template.visualElements.forEach(t => t.parent = template);
	        template.encodings.forEach((value, key) => {
	            template.visualElements.forEach(t => {
	                t.overwrittenEncodings.set(key, value);
	            });
	        });
	        return template;
	    }
	    getPlotTemplate(schema) {
	        const plotTemplate = new PlotTemplate_1.PlotTemplate(null);
	        plotTemplate.mark = schema.mark;
	        const encodings = this.getEncodingsMapFromPlotSchema(schema);
	        const properties = SpecUtils.getMarkPropertiesAsMap(schema.mark);
	        plotTemplate.encodings = encodings;
	        plotTemplate.staticMarkProperties = properties;
	        return plotTemplate;
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
	        let template = null;
	        if (SpecUtils.isCompositionSchema(schema)) {
	            template = this.getCompositionTemplate(schema);
	        }
	        else if (SpecUtils.isPlotSchema(schema)) {
	            template = this.getPlotTemplate(schema);
	        }
	        this.setSingleViewProperties(schema, template);
	        const dataTransformation = this.parseDataTransformation(schema);
	        template.dataTransformationNode = dataTransformation;
	        const datasets = SpecUtils.getJoinedDatasetsOfChildNodes(template);
	        if (template instanceof PlotTemplate_1.PlotTemplate) {
	            template.selection = schema.selection;
	        }
	        return template;
	    }
	}
	exports.SpecParser = SpecParser;
	});

	unwrapExports(SpecParser_1);
	var SpecParser_2 = SpecParser_1.SpecParser;

	var LayoutType = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.COMPOSITION_TYPES = ['repeat', 'overlay', 'facet', 'concatenate'];
	exports.PLOT_TYPES = ['node-link', 'bubble chart', 'timeline', 'radius',
	    'angular', 'polar coordinates', 'cartesian', 'histogram', 'parallel plot', 'star plot'];
	exports.layouts = exports.PLOT_TYPES.concat(exports.COMPOSITION_TYPES);
	});

	unwrapExports(LayoutType);
	var LayoutType_1 = LayoutType.COMPOSITION_TYPES;
	var LayoutType_2 = LayoutType.PLOT_TYPES;
	var LayoutType_3 = LayoutType.layouts;

	var MarkType = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.MARK_TYPES = ['area', 'bar', 'circle', 'geoshape', 'line', 'point', 'rect', 'rule', 'square', 'text', 'tick', 'trail'];
	});

	unwrapExports(MarkType);
	var MarkType_1 = MarkType.MARK_TYPES;

	var TemplateModel = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });

	exports.Template = Template_1.Template;

	exports.PlotTemplate = PlotTemplate_1.PlotTemplate;

	exports.CompositionTemplate = CompositionTemplate_1.CompositionTemplate;

	exports.ConcatTemplate = ConcatTemplate_1.ConcatTemplate;

	exports.FacetTemplate = FacetTemplate_1.FacetTemplate;

	exports.LayerTemplate = LayerTemplate_1.LayerTemplate;

	exports.RepeatTemplate = RepeatTemplate_1.RepeatTemplate;

	exports.SpecCompiler = SpecCompiler_1.SpecCompiler;

	exports.SpecParser = SpecParser_1.SpecParser;

	exports.COMPOSITION_TYPES = LayoutType.COMPOSITION_TYPES;
	exports.PLOT_TYPES = LayoutType.PLOT_TYPES;
	exports.layouts = LayoutType.layouts;

	exports.positionEncodings = MarkEncoding.positionEncodings;
	exports.geographicPositionEncodings = MarkEncoding.geographicPositionEncodings;
	exports.facetChannelEncodings = MarkEncoding.facetChannelEncodings;
	exports.hyperLinkChannelEncodings = MarkEncoding.hyperLinkChannelEncodings;
	exports.keyChannelEncodings = MarkEncoding.keyChannelEncodings;
	exports.loDChannelEncodings = MarkEncoding.loDChannelEncodings;
	exports.markEncodingGroups = MarkEncoding.markEncodingGroups;
	exports.markEncodings = MarkEncoding.markEncodings;
	exports.markPropertiesChannelEncodings = MarkEncoding.markPropertiesChannelEncodings;
	exports.orderChannelEncodings = MarkEncoding.orderChannelEncodings;
	exports.textTooltipChannelEncodings = MarkEncoding.textTooltipChannelEncodings;

	exports.MARK_TYPES = MarkType.MARK_TYPES;
	});

	unwrapExports(TemplateModel);
	var TemplateModel_1 = TemplateModel.Template;
	var TemplateModel_2 = TemplateModel.PlotTemplate;
	var TemplateModel_3 = TemplateModel.CompositionTemplate;
	var TemplateModel_4 = TemplateModel.ConcatTemplate;
	var TemplateModel_5 = TemplateModel.FacetTemplate;
	var TemplateModel_6 = TemplateModel.LayerTemplate;
	var TemplateModel_7 = TemplateModel.RepeatTemplate;
	var TemplateModel_8 = TemplateModel.SpecCompiler;
	var TemplateModel_9 = TemplateModel.SpecParser;
	var TemplateModel_10 = TemplateModel.COMPOSITION_TYPES;
	var TemplateModel_11 = TemplateModel.PLOT_TYPES;
	var TemplateModel_12 = TemplateModel.layouts;
	var TemplateModel_13 = TemplateModel.positionEncodings;
	var TemplateModel_14 = TemplateModel.geographicPositionEncodings;
	var TemplateModel_15 = TemplateModel.facetChannelEncodings;
	var TemplateModel_16 = TemplateModel.hyperLinkChannelEncodings;
	var TemplateModel_17 = TemplateModel.keyChannelEncodings;
	var TemplateModel_18 = TemplateModel.loDChannelEncodings;
	var TemplateModel_19 = TemplateModel.markEncodingGroups;
	var TemplateModel_20 = TemplateModel.markEncodings;
	var TemplateModel_21 = TemplateModel.markPropertiesChannelEncodings;
	var TemplateModel_22 = TemplateModel.orderChannelEncodings;
	var TemplateModel_23 = TemplateModel.textTooltipChannelEncodings;
	var TemplateModel_24 = TemplateModel.MARK_TYPES;

	var dist = createCommonjsModule(function (module, exports) {
	function __export(m) {
	    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
	}
	Object.defineProperty(exports, "__esModule", { value: true });
	__export(TemplateModel);
	__export(DataModel);
	});

	var index = unwrapExports(dist);

	return index;

}));
//# sourceMappingURL=remodel.js.map
