"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  HistoryType: () => HistoryType,
  Router: () => Router,
  createMemoryHistory: () => createMemoryHistory,
  createRouter: () => createRouter,
  createWebHashHistory: () => createWebHashHistory,
  createWebHistory: () => createWebHistory
});
module.exports = __toCommonJS(index_exports);

// src/utils/encoding.ts
function encodeParam(text) {
  return encodeURIComponent("" + text);
}
function decode(text) {
  try {
    return decodeURIComponent("" + text);
  } catch (err) {
    console.warn(`[routajs] Could not decode "${text}".`);
    return "" + text;
  }
}

// src/matcher/index.ts
function normalizeRouteRecord(record) {
  let pattern = record.path;
  const paramRegex = /:([a-zA-Z0-9_]+)/g;
  pattern = pattern.replace(paramRegex, "(?<$1>[^/]+)");
  pattern = pattern.replace(/\*/g, "(?<pathMatch>.*)");
  const endsWithWildcard = record.path.endsWith("*");
  const regex = new RegExp(`^${pattern}${endsWithWildcard ? "" : "/?"}$`);
  return {
    ...record,
    regex,
    components: record.component ? { default: record.component } : {}
  };
}
function createRouterMatcher(routes) {
  const matchers = [];
  function addRoute(record, parentPath = "") {
    const fullPath = parentPath + (record.path.startsWith("/") ? record.path : "/" + record.path);
    const cleanedPath = fullPath.replace(/\/+/g, "/");
    const normalized = normalizeRouteRecord({
      ...record,
      path: cleanedPath === "//" ? "/" : cleanedPath
    });
    matchers.push(normalized);
    if (record.children) {
      record.children.forEach((child) => {
        addRoute(child, normalized.path === "/" ? "" : normalized.path);
      });
    }
  }
  routes.forEach((r) => addRoute(r));
  function resolve(location, currentLocation) {
    let path;
    let query = {};
    let hash = "";
    if (typeof location === "string") {
      const tempUrl = new URL(location, "http://dummy.com");
      path = tempUrl.pathname;
      hash = tempUrl.hash;
      tempUrl.searchParams.forEach((value, key) => {
        query[key] = value;
      });
    } else {
      if (location.path) {
        path = location.path;
      } else if (location.name) {
        const matcher = matchers.find((m) => m.name === location.name);
        if (matcher) {
          path = matcher.path;
          if (location.params) {
            for (const key in location.params) {
              path = path.replace(`:${key}`, encodeParam(location.params[key]));
            }
          }
        } else {
          throw new Error(`Route with name '${String(location.name)}' not found`);
        }
      } else {
        path = currentLocation.path;
      }
      if (location.query) query = location.query;
      if (location.hash) hash = location.hash;
    }
    let matchedRecord;
    let params = {};
    for (const matcher of matchers) {
      const match = matcher.regex.exec(path);
      if (match) {
        matchedRecord = matcher;
        params = match.groups || {};
        break;
      }
    }
    if (!matchedRecord) {
      return {
        fullPath: path + (hash || ""),
        path,
        params: {},
        query,
        hash,
        matched: [],
        meta: {},
        previousFullPath: null
      };
    }
    Object.keys(params).forEach((key) => {
      params[key] = decode(params[key]);
    });
    const queryString = Object.keys(query).length ? "?" + new URLSearchParams(query).toString() : "";
    return {
      fullPath: path + queryString + (hash || ""),
      path,
      params,
      query,
      hash,
      name: matchedRecord.name,
      matched: [matchedRecord],
      meta: matchedRecord.meta || {},
      previousFullPath: null
    };
  }
  return {
    addRoute,
    resolve,
    getRoutes: () => matchers
  };
}

// src/router.ts
var Router = class {
  constructor(options) {
    __publicField(this, "history");
    __publicField(this, "matcher");
    __publicField(this, "currentRoute");
    __publicField(this, "previousRoute", null);
    __publicField(this, "beforeGuards", []);
    __publicField(this, "afterGuards", []);
    // Reactive listeners (simple pub/sub for UI frameworks to hook into)
    __publicField(this, "routeListeners", []);
    this.history = options.history;
    this.matcher = createRouterMatcher(options.routes);
    this.currentRoute = this.matcher.resolve(this.history.location, {
      fullPath: "/",
      path: "/",
      params: {},
      query: {},
      hash: "",
      matched: [],
      meta: {},
      previousFullPath: null
    });
    this.history.listen((toLocation, _fromLocation, info) => {
      this.handleNavigation(toLocation, info.direction);
    });
  }
  get current() {
    return this.currentRoute;
  }
  get previous() {
    return this.previousRoute;
  }
  // Public API to resolve a route without navigating
  resolve(to) {
    return this.matcher.resolve(to, this.currentRoute);
  }
  push(to) {
    return this.navigate(to, false);
  }
  replace(to) {
    return this.navigate(to, true);
  }
  go(delta) {
    this.history.go(delta);
  }
  back() {
    this.go(-1);
  }
  forward() {
    this.go(1);
  }
  beforeEach(guard) {
    this.beforeGuards.push(guard);
  }
  afterEach(guard) {
    this.afterGuards.push(guard);
  }
  // Internal navigation logic
  async navigate(to, replace) {
    const targetRoute = this.matcher.resolve(to, this.currentRoute);
    const fromRoute = this.currentRoute;
    try {
      for (const guard of this.beforeGuards) {
        await new Promise((resolve, reject) => {
          const next = (nextArg) => {
            if (nextArg === false) {
              reject(new Error("Navigation cancelled"));
            } else if (typeof nextArg === "string" || typeof nextArg === "object" && nextArg !== null) {
              reject({ redirect: nextArg });
            } else {
              resolve();
            }
          };
          const res = guard(targetRoute, fromRoute, next);
          if (res && typeof res.then === "function") {
          }
        });
      }
    } catch (error) {
      if (error && error.redirect) {
        return this.push(error.redirect);
      }
      return Promise.reject(error);
    }
    if (replace) {
      this.history.replace(targetRoute.fullPath);
    } else {
      this.history.push(targetRoute.fullPath);
    }
    this.updateRoute(targetRoute);
  }
  handleNavigation(location, _direction) {
    const targetRoute = this.matcher.resolve(location, this.currentRoute);
    this.updateRoute(targetRoute);
  }
  updateRoute(newRoute) {
    const from = this.currentRoute;
    this.previousRoute = from;
    newRoute.previousFullPath = from.fullPath;
    this.currentRoute = Object.freeze(newRoute);
    this.afterGuards.forEach((guard) => guard(newRoute, from));
    this.routeListeners.forEach((cb) => cb(newRoute));
  }
  // Method to allow frameworks to listen to changes
  listen(cb) {
    this.routeListeners.push(cb);
  }
};
function createRouter(options) {
  return new Router(options);
}

// src/history/base.ts
function normalizeBase(base) {
  if (!base) {
    if (typeof window !== "undefined" && window.document) {
      const baseEl = document.querySelector("base");
      base = baseEl && baseEl.getAttribute("href") || "/";
    } else {
      base = "/";
    }
  }
  if (!base.startsWith("/")) {
    base = "/" + base;
  }
  return base.replace(/\/$/, "") || "/";
}
function createCurrentLocation(base, location) {
  const { pathname, search, hash } = location;
  if (base.indexOf("#") > -1 && pathname.indexOf("#") === -1) {
    return pathname + search + hash;
  }
  if (pathname.indexOf(base) === 0) {
    return pathname.slice(base.length) + search + hash;
  }
  return pathname + search + hash;
}

// src/history/html5.ts
function createWebHistory(base) {
  const normalizedBase = normalizeBase(base);
  const history = window.history;
  let listeners = [];
  const currentLocation = () => {
    return createCurrentLocation(normalizedBase, window.location);
  };
  const handlePopState = ({ state }) => {
    const to = currentLocation();
    const from = state ? state.current : currentLocation();
    listeners.forEach((listener) => listener(to, from, { direction: "unknown" }));
  };
  window.addEventListener("popstate", handlePopState);
  function changeLocation(to, replace) {
    const url = normalizedBase + (to === "/" ? "" : to);
    const state = {
      current: to,
      key: performance.now().toFixed(3)
      // Simple unique key
    };
    try {
      if (replace) {
        history.replaceState(state, "", url);
      } else {
        history.pushState(state, "", url);
      }
    } catch (err) {
      window.location[replace ? "replace" : "assign"](url);
    }
  }
  return {
    base: normalizedBase,
    get location() {
      return currentLocation();
    },
    push(to, _data) {
      changeLocation(to, false);
    },
    replace(to, _data) {
      changeLocation(to, true);
    },
    go(delta) {
      history.go(delta);
    },
    listen(callback) {
      listeners.push(callback);
      return () => {
        const index = listeners.indexOf(callback);
        if (index > -1) listeners.splice(index, 1);
      };
    },
    createHref(location) {
      return normalizedBase + location;
    }
  };
}

// src/history/hash.ts
function createWebHashHistory(base) {
  const formattedBase = (base || "") + "#";
  return createWebHistory(formattedBase);
}

// src/history/memory.ts
function createMemoryHistory(base = "") {
  let queue = ["/"];
  let position = 0;
  let listeners = [];
  return {
    base,
    get location() {
      return queue[position];
    },
    push(to, _data) {
      position++;
      if (position < queue.length) {
        queue.splice(position);
      }
      queue.push(to);
    },
    replace(to, _data) {
      queue.splice(position, 1, to);
    },
    go(delta) {
      const from = queue[position];
      const newPosition = position + delta;
      if (newPosition >= 0 && newPosition < queue.length) {
        position = newPosition;
        const to = queue[position];
        listeners.forEach((listener) => listener(to, from, { direction: delta > 0 ? "forward" : "back" }));
      }
    },
    listen(callback) {
      listeners.push(callback);
      return () => {
        const index = listeners.indexOf(callback);
        if (index > -1) listeners.splice(index, 1);
      };
    },
    createHref(location) {
      return base + location;
    }
  };
}

// src/types.ts
var HistoryType = /* @__PURE__ */ ((HistoryType2) => {
  HistoryType2["BROWSER"] = "browser";
  HistoryType2["HASH"] = "hash";
  HistoryType2["MEMORY"] = "memory";
  return HistoryType2;
})(HistoryType || {});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HistoryType,
  Router,
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory
});
//# sourceMappingURL=index.js.map