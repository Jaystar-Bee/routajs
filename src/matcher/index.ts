import { RouteRecord, RouteRecordRaw, Route, RouteLocationRaw } from '../types';
import { decode, encodeParam } from '../utils/encoding';

function normalizeRouteRecord(record: RouteRecordRaw): RouteRecord {
    // Basic regex generation
    // Supports :param and * (wildcard)

    let pattern = record.path;
    const paramRegex = /:([a-zA-Z0-9_]+)/g;

    // Replace params with regex
    pattern = pattern.replace(paramRegex, '(?<$1>[^/]+)');

    // Handle wildcards
    // * matches everything eagerly
    pattern = pattern.replace(/\*/g, '(?<pathMatch>.*)');

    // Ensure we match start and end, and handle trailing slashes optionally
    // If the pattern doesn't end with a wildcard, we can be strict about trailing slash
    const endsWithWildcard = record.path.endsWith('*');
    const regex = new RegExp(`^${pattern}${endsWithWildcard ? '' : '/?'}$`);

    return {
        ...record,
        regex,
        components: record.component ? { default: record.component } : {},
    };
}

export interface RouterMatcher {
    addRoute(record: RouteRecordRaw): void;
    resolve(location: RouteLocationRaw, currentLocation: Route): Route;
    getRoutes(): RouteRecord[];
}

export function createRouterMatcher(routes: RouteRecordRaw[]): RouterMatcher {
    const matchers: RouteRecord[] = [];

    function addRoute(record: RouteRecordRaw, parentPath: string = '') {
        const fullPath = parentPath + (record.path.startsWith('/') ? record.path : '/' + record.path);
        // Clean up double slashes just in case, but keep initial slash
        const cleanedPath = fullPath.replace(/\/+/g, '/');

        const normalized = normalizeRouteRecord({
            ...record,
            path: cleanedPath === '//' ? '/' : cleanedPath
        });

        matchers.push(normalized);

        if (record.children) {
            record.children.forEach(child => {
                addRoute(child, normalized.path === '/' ? '' : normalized.path);
            });
        }
    }

    routes.forEach(r => addRoute(r));

    function resolve(location: RouteLocationRaw, currentLocation: Route): Route {
        let path: string;
        let query: Record<string, string | string[]> = {};
        let hash: string = '';

        if (typeof location === 'string') {
            const tempUrl = new URL(location, 'http://dummy.com');
            path = tempUrl.pathname;
            hash = tempUrl.hash;
            // Properly handle duplicate query parameters
            // Use a Set to track unique keys, then getAll() to get all values
            const uniqueKeys = new Set<string>();
            tempUrl.searchParams.forEach((_, key) => uniqueKeys.add(key));

            uniqueKeys.forEach(key => {
                const values = tempUrl.searchParams.getAll(key);
                // If there's only one value, store as string; otherwise store as array
                query[key] = values.length === 1 ? values[0] : values;
            });
        } else {
            if (location.path) {
                path = location.path;
            } else if (location.name) {
                const matcher = matchers.find(m => m.name === location.name);
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

        let matchedRecord: RouteRecord | undefined;
        let params: Record<string, string> = {};

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
                fullPath: path + (hash || ''),
                path,
                params: {},
                query,
                hash,
                matched: [],
                meta: {},
                previousFullPath: null
            };
        }

        // Decode params
        Object.keys(params).forEach(key => {
            params[key] = decode(params[key]);
        });

        const queryString = Object.keys(query).length ? '?' + new URLSearchParams(query as any).toString() : '';

        return {
            fullPath: path + queryString + (hash || ''),
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

