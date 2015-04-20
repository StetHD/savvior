(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module unless amdModuleId is set
    define('savvior', ["enquire"], function (a0) {
      return (root['new GridDispatch()'] = factory(a0));
    });
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(require("enquire"));
  } else {
    root['savvior'] = factory(enquire);
  }
}(this, function (enquire) {

/*jshint unused:false */

function addToDataset(element, key, value) {
  // Use dataset function or a fallback for <IE10
  if (element.dataset) {
    element.dataset[key] = value;
  }
  else {
    element.setAttribute('data-'+ key, value);
  }

  return;
}

/**
 * Helper function for iterating over a collection
 *
 * @param collection
 * @param fn
 * @param scope
 */
function each(collection, fn, scope) {
  var i = 0,
    cont;

  for (i; i < collection.length; i++) {
    cont = fn.call(scope, collection[i], i);
    if (cont === false) {
      break; //allow early exit
    }
  }
}

/**
 * Helper function for determining whether target object is a function
 *
 * @param target the object under test
 * @return {Boolean} true if function, false otherwise
 */
function isFunction(target) {
  return typeof target === 'function';
}

/**
 * Helper function to determine if an object or array is empty.
 *
 * @param  {[type]}  obj The object or array to check.
 * @return {Boolean}     TRUE if empty, FALSE if not.
 */
function isEmpty(obj, p) {
  for (p in obj) {
    return !1;
  }
  return !0;
}

/**
 * CustomEvent polyfill
 */
if (typeof window.CustomEvent !== 'function') {
  (function() {
    function CustomEvent(event, params) {
      params = params || { bubbles: false, cancelable: false, detail: undefined };
      var evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
      return evt;
     }

    window.CustomEvent = CustomEvent;

    CustomEvent.prototype = window.CustomEvent.prototype;
  })();
}


/**
 * requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
 *
 * @see http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 * @see http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
 * @license MIT
 */
(function() {
  var lastTime = 0;
  var vendors = ['ms', 'moz', 'webkit', 'o'];

  for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
  }

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function(callback, element) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function() { callback(currTime + timeToCall); },
        timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  }

  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function(id) {
      clearTimeout(id);
    };
  }
}());
/**
 * Implements the grid element and its internal manipulation features
 *
 * @param {Object} Grid
 * @param {String} Grid.columns  Stores the current number of columns
 * @param {Object} Grid.element  Stores the DOM object of the grid element
 * @param {Boolean} Grid.status  Pointer to maintain the Grid status
 * @constructor
 */
var Grid = function(element) {
  this.columns = null;
  this.element = element;
  this.status = false;
  this.currentFilter = null;
  this.filtered = document.createDocumentFragment();
};

/**
 * Set up the grid element and add columns
 *
 * @param  {Integer} columns    The number of columns to create on init
 * @param  {Function} callback  Optional. Callback function to call when done
 * @todo   fix docs
 */
Grid.prototype.setup = function(options, callback) {
  // Run this only once on a grid.
  if (this.status) {
    return false;
  }

  // Retrieve the list of items from the grid itself.
  var range = document.createRange();
  var items = document.createElement('div');

  range.selectNodeContents(this.element);
  items.appendChild(range.extractContents());

  window.requestAnimationFrame(function() {
    addToDataset(items, 'columns', 0);

    this.addColumns(items, options);
    this.status = true;

    isFunction(callback) && callback(this);
  }.bind(this));
};

/**
 * Create columns with the configured classes and add a list of items to them.
 */
Grid.prototype.addColumns = function(items, options) {
  var columnClasses = ['column', 'size-1of'+ options.columns];
  var columnsFragment = document.createDocumentFragment();
  var columnsItems = [];
  var i = options.columns;
  var childSelector;
  // var column, rowsFragment, index, filtered, nodeList;
  var column, rowsFragment;

  items = this.filterItems(items, options.filter);

  while (i-- !== 0) {
    childSelector = '[data-columns] > *:nth-child(' + options.columns + 'n-' + i + ')';
    columnsItems.push(items.querySelectorAll(childSelector));
  }

  each(columnsItems, function(rows) {
    column = document.createElement('div');
    rowsFragment = document.createDocumentFragment();

    column.className = columnClasses.join(' ');

    each(rows, function(row) {
      rowsFragment.appendChild(row);
    });
    column.appendChild(rowsFragment);
    columnsFragment.appendChild(column);
  });

  this.element.appendChild(columnsFragment);
  addToDataset(this.element, 'columns', options.columns);
  this.columns = options.columns;
};

/**
 * Filter items if needed
 * @param  {[type]} items  [description]
 * @param  {[type]} filter [description]
 * @return {[type]}        [description]
 */
Grid.prototype.filterItems = function(items, filter) {
  if (!filter) {
    return items;
  }

  var index, filtered, nodeList;

  if (filter) {
    nodeList = Array.prototype.slice.call(items.children);
    filtered = items.querySelectorAll('[data-columns] > ' + filter);
    each(filtered, function(item) {
      index = (nodeList.indexOf(item));
      this.filtered.appendChild(item);
      addToDataset(item, 'position', index);
    }, this);
  }

  return items;
};

/**
 * Remove all the columns from a grid and prepare it for populating again.
 *
 * @param  Object grid The grid element object
 * @return Object      A list of items sorted by the ordering of columns
 */
Grid.prototype.removeColumns = function() {
  var range = document.createRange();
  var container = document.createElement('div');
  var sortedRows = [];
  var columns;

  range.selectNodeContents(this.element);

  columns = Array.prototype.filter.call(range.extractContents().childNodes, function filterElements(node) {
    return node instanceof window.HTMLElement;
  });

  sortedRows.length = columns[0].childNodes.length * columns.length;

  each(columns, function iterateColumns(column, columnIndex) {
    each(column.children, function iterateRows(row, rowIndex) {
      sortedRows[rowIndex * columns.length + columnIndex] = row;
    });
  });

  addToDataset(container, 'columns', 0);

  sortedRows.filter(function(child) {
    return !!child;
  })
  .forEach(function(child) {
    container.appendChild(child);
  });

  return container;
};


/**
 * Remove all the columns from the grid, and add them again if the number of
 * columns have changed.
 *
 * @param  {[type]}   newColumns The number of columns to transform the Grid
 *   element to.
 * @param  {Function} callback   Optional. Callback function to call when done
 * @return {[type]}              [description]
 */
Grid.prototype.redraw = function(newOptions, callback) {
  var evt = new CustomEvent('savvior:redraw', {
    detail: {
      element: this.element,
      from: this.columns,
      to: newOptions.columns,
      filter: newOptions.filter || null
    }
  });
  var items;

  window.requestAnimationFrame(function() {
    if (this.columns !== newOptions.columns) {
      items = this.restoreFiltered(this.removeColumns());
      this.addColumns(items, newOptions);
    }

    window.dispatchEvent(evt);
    isFunction(callback) && callback(this);
  }.bind(this));
};


/**
 * Restore filtered items
 * @param  {[type]} container [description]
 * @return {[type]}           [description]
 */
Grid.prototype.restoreFiltered = function(container) {
  if (!this.filtered.children) {
    return container;
  }

  var allItems = container;
  var pos;

  each(this.filtered.querySelectorAll('[data-position]'), function(item) {
    pos = Number(item.getAttribute('data-position'));
    item.removeAttribute('data-position');
    allItems.insertBefore(item, allItems.children[pos]);
  });

  return container;
};

/**
 * Restore the Grid element to its original state
 *
 * @param  {Function} callback  Optional. Callback function to call when done
 */
Grid.prototype.restore = function(callback, scope) {
  if (!this.status) {
    isFunction(callback) && callback(false);
    return false;
  }

  var fragment = document.createDocumentFragment();
  var children = [];
  var container;
  var evt = new CustomEvent('savvior:restore', {
    detail: {
      element: this.element,
      from: this.columns
    }
  });

  window.requestAnimationFrame(function() {
    container = this.restoreFiltered(this.removeColumns());

    each(container.childNodes, function(item) {
      children.push(item);
    });

    children.forEach(function(child) {
      fragment.appendChild(child);
    });

    this.element.appendChild(fragment);
    this.element.removeAttribute('data-columns');

    window.dispatchEvent(evt);
    isFunction(callback) && callback.call(scope, scope || this);
  }.bind(this));
};
/* global Grid: true */
/**
 * Implements the handling of a grid element.
 *
 * This performs operations via registered enquire handlers
 *
 * @param {Object} GridHandler
 * @param {String} GridHandler.selector Stores the selector of the Grid
 *   instance element
 * @param {Object} GridHandler.options  Defines the number of columns a grid
 *   should have for each media query registered
 * @param {Array} GridHandler.queryHandlers  Stores all registered enquire
 *   handlers so they are unregisterable
 * @param {Object} GridHandler.grid  The Grid object reference
 * @param {Boolean} GridHandler.ready  Pointer to maintain the Grid status
 * @constructor
 */
var GridHandler = function(selector, options) {
  this.selector = selector;
  this.options = options;
  this.queryHandlers = [];
  this.grids = [];
  this.ready = false;
};

/**
 * Register the Grid object instances and their enquire handlers.
 */
GridHandler.prototype.register = function() {
  each(document.querySelectorAll(this.selector), function(el) {
    this.grids.push(new Grid(el, this.options));
  }, this);

  for (var mq in this.options) {
    this.queryHandlers.push(this.constructHandler(mq, this.options[mq]));
  }

  each(this.queryHandlers, function(h) {
    enquire.register(h.mq, h.handler);
  });

  this.ready = true;

  return this;
};

/**
 * Helper function to construct enquire handler objects
 *
 * @param  {String} mq The media query to register
 * @return {Object}    The handler object containing this.handler to
 *   register with enquire
 */
GridHandler.prototype.constructHandler = function(mq) {
  return {
    mq: mq,
    handler: {
      deferSetup: true,

      setup: function() {
        this.gridSetup(mq);
      }.bind(this),

      match: function() {
        this.gridMatch(mq);
      }.bind(this),

      destroy: function() {
        return;
      }
    }
  };
};

/**
 * Enquire setup callback
 *
 * @param  {[type]} mq The current query
 */
GridHandler.prototype.gridSetup = function(mq) {
  var evt;

  each(this.grids, function(grid) {
    grid.setup(this.options[mq], function() {
      evt = new CustomEvent('savvior:setup', {
        detail: {
          element: grid.element,
          columns: grid.columns,
          filter: this.filter
        }
      });
      window.dispatchEvent(evt);
    });
  }, this);
};

/**
 * Enquire match callback
 *
 * @param  {[type]} mq The current query
 */
GridHandler.prototype.gridMatch = function(mq) {
  var evt;

  each(this.grids, function(grid) {
    evt = new CustomEvent('savvior:match', {
      detail: {
        element: grid.element,
        from: grid.columns,
        to: this.options[mq].columns,
        query: mq
      }
    });

    grid.redraw(this.options[mq], function() {
      window.dispatchEvent(evt);
    });
  }, this);
};

/**
 * Restore the grid to its original state.
 *
 * This unregisters any previously registered enquire handlers and clears up
 * the object instance
 */
GridHandler.prototype.unregister = function(callback, scope) {
  each(this.queryHandlers, function(h) {
    enquire.unregister(h.mq);
  });

  each(this.grids, function(grid) {
    grid.restore(function() {
      // Cleanup
      this.queryHandlers = [];
      this.ready = false;

      isFunction(callback) && callback.call(this, scope || this);
    }, this);
  }, this);

  this.grids = [];
};
/* global GridHandler: true */
/**
 * Implements the top level registration of grid handlers and manages their
 * states.
 *
 * @param {Object} GridDispatch.grids  Collection of grid handlers
 * @constructor
 */
var GridDispatch = function() {
  if (!enquire) {
    throw new Error('enquire.js not present, please load it before calling any methods');
  }

  this.grids = {};
};

/**
 * Registers a single grid handler
 *
 * @param  {String} selector The selector of the grid element
 * @param  {Object} options  Defines the number of columns a grid should have
 *   for each media query registered.
 * @return {Object}          The dispatch object instance
 */
GridDispatch.prototype.init = function(selector, options) {
  if (!selector) {
    throw new TypeError('Missing selector');
  }

  if (typeof selector !== 'string') {
    throw new TypeError('Selector must be a string');
  }

  if (typeof options !== 'object') {
    throw new TypeError('Options must be an object');
  }

  // Prevent setting up the same grid selector more than once.
  if (this.grids[selector]) {
    return this;
  }

  // Do not act if element cannot be found.
  if (document.querySelectorAll(selector).length < 1) {
    return this;
  }

  // Construct GridHandlers and register them.
  this.grids[selector] = new GridHandler(selector, options);
  this.grids[selector].register(options);

  // Dispatch event.
  window.dispatchEvent(new CustomEvent('savvior:init'));

  return this;
};

/**
 * Restores one or all of the grids into their original state
 *
 * @param  {Array} selector     The selectors of the grids to destroy as given
 *   during the init call.
 * @param  {Function} callback  Optional. Callback function to call when done
 */
GridDispatch.prototype.destroy = function(selectors, callback) {
  var evt = new CustomEvent('savvior:destroy');
  var grids = (selectors === undefined || isEmpty(selectors)) ? Object.keys(this.grids) : selectors;
  var total = grids.length;
  var counter = 0;
  var done = function(args) {
    delete this.grids[grids[counter]];
    if (++counter === total) {
      window.dispatchEvent(evt);
      isFunction(callback) && callback.call(args, this);
    }
  }.bind(this);

  each(grids, function(selector) {
    (this.grids[selector]) && this.grids[selector].unregister(done);
  }, this);
};

/**
 * Tells if one or all the grids are initialised
 *
 * @param  {String} selector Optional. The selector of the grid used in init()
 * @return {Boolean}         If selector is given, returns a boolean value, or
 *   undefined if selector does not exist. If called without an argument, an
 *   array of ready grids is returned.
 */
GridDispatch.prototype.ready = function(selector) {
  if (selector === undefined) {
    var grids = [];
    for (var key in this.grids) {
      (this.grids[key].ready) && grids.push(key);
    }
    return (grids.length > 0) ? grids : false;
  }

  return (this.grids[selector]) ? this.grids[selector].ready : false;
};

return new GridDispatch();

}));
