/**
 * Represents a route location with all its details.
 */
export interface Route {
    fullPath: string;
    path: string;
    params: Record<string, string>;
    query: Record<string, string | string[]>;
    hash: string;
    name?: string | symbol;
    meta: Record<string | number | symbol, unknown>;
    matched: RouteRecord[]; // Records that matched this route
    previousFullPath: string | null; // The full path of the previous route
}

/**
 * Input for programmatic navigation.
 * Can be a string path or an object.
 */
export type RouteLocationRaw = string | {
    path?: string;
    name?: string | symbol;
    params?: Record<string, string>;
    query?: Record<string, string | string[]>;
    hash?: string;
    replace?: boolean;
}

/**
 * A user-defined route record.
 */
export interface RouteRecordRaw {
    path: string;
    name?: string | symbol;
    component?: any; // Component type is generic as this is framework-agnostic
    children?: RouteRecordRaw[];
    meta?: Record<string | number | symbol, unknown>;
    beforeEnter?: NavigationGuard;
}

/**
 * Normalized internal route record.
 */
export interface RouteRecord extends RouteRecordRaw {
    regex: RegExp;
    components: Record<string, any>;
    aliasOf?: RouteRecord;
}

export interface NavigationGuardNext {
    (to?: RouteLocationRaw | false | void): void;
}

export interface NavigationGuard {
    (to: Route, from: Route, next: NavigationGuardNext): void | Promise<void | boolean | RouteLocationRaw>;
}

export type HistoryLocation = string;

export enum HistoryType {
    BROWSER = 'browser',
    HASH = 'hash',
    MEMORY = 'memory'
}

export interface RouterHistory {
    readonly base: string;
    readonly location: HistoryLocation;
    push(to: HistoryLocation, data?: any): void;
    replace(to: HistoryLocation, data?: any): void;
    go(delta: number): void;
    listen(callback: (to: HistoryLocation, from: HistoryLocation, info: { direction: 'back' | 'forward' | 'unknown' }) => void): () => void;
    createHref(location: HistoryLocation): string;
}
