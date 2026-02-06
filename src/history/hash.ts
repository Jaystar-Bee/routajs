import { RouterHistory } from '../types';
import { createWebHistory } from './html5';

export function createWebHashHistory(base?: string): RouterHistory {
    // Hash history is essentially browser history but with a forced base and #
    // This is a naive implementation; production might need more handling of the hash sign itself

    // usually base for hash history is just window.location.pathname + '#'
    // but if user provides a base, we prepend it.

    // Real implementation of hash history often manipulates window.location.hash directly
    // and listens to hashchange. However, modern browsers support pushState with hash too.
    // For simplicity and robustness, standard 'vue-router' uses pushState/replaceState 
    // even for hash mode if available, but falls back.
    // Here let's stick to true hashchange for maximum compatibility if we want "hash" mode.

    const formattedBase = (base || '') + '#';

    return createWebHistory(formattedBase);
}
