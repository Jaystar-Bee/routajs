import { RouterHistory, HistoryLocation } from '../types';
import { normalizeBase, createCurrentLocation } from './base';

export function createWebHistory(base?: string): RouterHistory {
    const normalizedBase = normalizeBase(base);
    const history = window.history;
    let listeners: ((to: HistoryLocation, from: HistoryLocation, info: { direction: 'back' | 'forward' | 'unknown' }) => void)[] = [];

    const currentLocation = () => {
        return createCurrentLocation(normalizedBase, window.location);
    };

    const handlePopState = ({ state }: PopStateEvent) => {
        const to = currentLocation();
        const from = state ? state.current : currentLocation();

        // In a real router, we'd use the key to determine direction.
        // For now, we just notify.
        listeners.forEach(listener => listener(to, from, { direction: 'unknown' }));
    };

    window.addEventListener('popstate', handlePopState);

    // Helper to persist state if needed
    function changeLocation(to: HistoryLocation, replace: boolean) {
        // Properly construct URL by avoiding double slashes
        // If normalizedBase is '/' and to starts with '/', we don't want '//'
        let url: string;
        if (normalizedBase === '/' || normalizedBase === '') {
            // Base is root, just use the 'to' path as-is
            url = to;
        } else {
            // Base is a subpath like '/app', concatenate properly
            url = normalizedBase + (to === '/' ? '' : to);
        }

        const state = {
            current: to,
            key: performance.now().toFixed(3) // Simple unique key
        };

        try {
            if (replace) {
                history.replaceState(state, '', url);
            } else {
                history.pushState(state, '', url);
            }
        } catch (err) {
            window.location[replace ? 'replace' : 'assign'](url);
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
        },
    };
}

