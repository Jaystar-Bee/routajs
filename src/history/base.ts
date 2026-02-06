import { RouterHistory, HistoryLocation } from '../types';

export function normalizeBase(base?: string): string {
    if (!base) {
        if (typeof window !== 'undefined' && window.document) {
            const baseEl = document.querySelector('base');
            base = (baseEl && baseEl.getAttribute('href')) || '/';
        } else {
            base = '/';
        }
    }
    if (!base.startsWith('/')) {
        base = '/' + base;
    }
    return base.replace(/\/$/, '') || '/';
}

export function createCurrentLocation(base: string, location: Location): HistoryLocation {
    const { pathname, search, hash } = location;
    // allow for id-only navigation
    if (base.indexOf('#') > -1 && pathname.indexOf('#') === -1) {
        return pathname + search + hash;
    }
    // strip base
    if (pathname.indexOf(base) === 0) {
        return pathname.slice(base.length) + search + hash;
    }
    return pathname + search + hash;
}
