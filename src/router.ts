import { RouterHistory, Route, RouteLocationRaw, NavigationGuard, RouteRecordRaw } from './types';
import { RouterMatcher, createRouterMatcher } from './matcher/index';

export interface RouterOptions {
    history: RouterHistory;
    routes: RouteRecordRaw[];
}

export class Router {
    private history: RouterHistory;
    private matcher: RouterMatcher;
    private currentRoute: Route;
    private previousRoute: Route | null = null;
    private beforeGuards: NavigationGuard[] = [];
    private afterGuards: ((to: Route, from: Route) => void)[] = [];

    // Reactive listeners (simple pub/sub for UI frameworks to hook into)
    private routeListeners: ((route: Route) => void)[] = [];

    constructor(options: RouterOptions) {
        this.history = options.history;
        this.matcher = createRouterMatcher(options.routes);

        // Initial route
        this.currentRoute = this.matcher.resolve(this.history.location, {
            fullPath: '/',
            path: '/',
            params: {},
            query: {},
            hash: '',
            matched: [],
            meta: {},
            previousFullPath: null
        });

        // Listen to history changes
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
    resolve(to: RouteLocationRaw): Route {
        return this.matcher.resolve(to, this.currentRoute);
    }

    push(to: RouteLocationRaw) {
        return this.navigate(to, false);
    }

    replace(to: RouteLocationRaw) {
        return this.navigate(to, true);
    }

    go(delta: number) {
        this.history.go(delta);
    }

    back() {
        this.go(-1);
    }

    forward() {
        this.go(1);
    }

    beforeEach(guard: NavigationGuard) {
        this.beforeGuards.push(guard);
    }

    afterEach(guard: (to: Route, from: Route) => void) {
        this.afterGuards.push(guard);
    }

    // Internal navigation logic
    private async navigate(to: RouteLocationRaw, replace: boolean): Promise<any> {
        const targetRoute = this.matcher.resolve(to, this.currentRoute);
        const fromRoute = this.currentRoute;

        // Run Guards
        try {
            for (const guard of this.beforeGuards) {
                await new Promise<void>((resolve, reject) => {
                    const next = (nextArg: any) => {
                        if (nextArg === false) {
                            reject(new Error('Navigation cancelled'));
                        } else if (typeof nextArg === 'string' || (typeof nextArg === 'object' && nextArg !== null)) {
                            // Redirect
                            reject({ redirect: nextArg });
                        } else {
                            resolve();
                        }
                    };
                    // guard(to, from, next)
                    const res = guard(targetRoute, fromRoute, next);
                    if (res && typeof (res as Promise<any>).then === 'function') {
                        // It's a promise that didn't use next? 
                        // For simplicity, we assume guards use 'next' or return async boolean/void?
                        // Vue router is shifting to return values. Let's support 'next' pattern primarily as typings defined.
                    }
                });
            }
        } catch (error: any) {
            if (error && error.redirect) {
                return this.push(error.redirect);
            }
            return Promise.reject(error);
        }

        // Commit navigation
        if (replace) {
            this.history.replace(targetRoute.fullPath);
        } else {
            this.history.push(targetRoute.fullPath);
        }

        this.updateRoute(targetRoute);
    }

    private handleNavigation(location: string, _direction: string) {
        const targetRoute = this.matcher.resolve(location, this.currentRoute);
        this.updateRoute(targetRoute);
    }

    private updateRoute(newRoute: Route) {
        const from = this.currentRoute;
        this.previousRoute = from;

        // Update the new route with previousFullPath
        newRoute.previousFullPath = from.fullPath;

        this.currentRoute = Object.freeze(newRoute);

        // Run After Hooks
        this.afterGuards.forEach(guard => guard(newRoute, from));

        // Notify listeners
        this.routeListeners.forEach(cb => cb(newRoute));
    }

    // Method to allow frameworks to listen to changes
    listen(cb: (route: Route) => void) {
        this.routeListeners.push(cb);
    }
}

export function createRouter(options: RouterOptions): Router {
    return new Router(options);
}
