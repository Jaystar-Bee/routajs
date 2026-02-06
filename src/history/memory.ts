import { RouterHistory, HistoryLocation } from '../types';

export function createMemoryHistory(base: string = ''): RouterHistory {
    let queue: HistoryLocation[] = ['/'];
    let position = 0;
    let listeners: ((to: HistoryLocation, from: HistoryLocation, info: { direction: 'back' | 'forward' | 'unknown' }) => void)[] = [];

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
                // Notify listeners as memory history doesn't trigger popstate
                listeners.forEach(listener => listener(to, from, { direction: delta > 0 ? 'forward' : 'back' }));
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
        },
    };
}
