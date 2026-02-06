/**
 * Represents a route location with all its details.
 */
interface Route {
    fullPath: string;
    path: string;
    params: Record<string, string>;
    query: Record<string, string | string[]>;
    hash: string;
    name?: string | symbol;
    meta: Record<string | number | symbol, unknown>;
    matched: RouteRecord[];
    previousFullPath: string | null;
}
/**
 * Input for programmatic navigation.
 * Can be a string path or an object.
 */
type RouteLocationRaw = string | {
    path?: string;
    name?: string | symbol;
    params?: Record<string, string>;
    query?: Record<string, string | string[]>;
    hash?: string;
    replace?: boolean;
};
/**
 * A user-defined route record.
 */
interface RouteRecordRaw {
    path: string;
    name?: string | symbol;
    component?: any;
    children?: RouteRecordRaw[];
    meta?: Record<string | number | symbol, unknown>;
    beforeEnter?: NavigationGuard;
}
/**
 * Normalized internal route record.
 */
interface RouteRecord extends RouteRecordRaw {
    regex: RegExp;
    components: Record<string, any>;
    aliasOf?: RouteRecord;
}
interface NavigationGuardNext {
    (to?: RouteLocationRaw | false | void): void;
}
interface NavigationGuard {
    (to: Route, from: Route, next: NavigationGuardNext): void | Promise<void | boolean | RouteLocationRaw>;
}
type HistoryLocation = string;
declare enum HistoryType {
    BROWSER = "browser",
    HASH = "hash",
    MEMORY = "memory"
}
interface RouterHistory {
    readonly base: string;
    readonly location: HistoryLocation;
    push(to: HistoryLocation, data?: any): void;
    replace(to: HistoryLocation, data?: any): void;
    go(delta: number): void;
    listen(callback: (to: HistoryLocation, from: HistoryLocation, info: {
        direction: 'back' | 'forward' | 'unknown';
    }) => void): () => void;
    createHref(location: HistoryLocation): string;
}

interface RouterOptions {
    history: RouterHistory;
    routes: RouteRecordRaw[];
}
declare class Router {
    private history;
    private matcher;
    private currentRoute;
    private previousRoute;
    private beforeGuards;
    private afterGuards;
    private routeListeners;
    constructor(options: RouterOptions);
    get current(): Route;
    get previous(): Route | null;
    resolve(to: RouteLocationRaw): Route;
    push(to: RouteLocationRaw): Promise<any>;
    replace(to: RouteLocationRaw): Promise<any>;
    go(delta: number): void;
    back(): void;
    forward(): void;
    beforeEach(guard: NavigationGuard): void;
    afterEach(guard: (to: Route, from: Route) => void): void;
    private navigate;
    private handleNavigation;
    private updateRoute;
    listen(cb: (route: Route) => void): void;
}
declare function createRouter(options: RouterOptions): Router;

declare function createWebHistory(base?: string): RouterHistory;

declare function createWebHashHistory(base?: string): RouterHistory;

declare function createMemoryHistory(base?: string): RouterHistory;

export { type HistoryLocation, HistoryType, type NavigationGuard, type NavigationGuardNext, type Route, type RouteLocationRaw, type RouteRecord, type RouteRecordRaw, Router, type RouterHistory, type RouterOptions, createMemoryHistory, createRouter, createWebHashHistory, createWebHistory };
