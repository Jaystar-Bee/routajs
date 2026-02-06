import { describe, it, expect } from 'vitest';
import { createRouter, createMemoryHistory } from '../src/index';

describe('Router Verification', () => {
    it('handles encoded params', async () => {
        const router = createRouter({
            history: createMemoryHistory(),
            routes: [
                { path: '/user/:id', component: {}, name: 'User' }
            ]
        });

        await router.push({ name: 'User', params: { id: 'c++' } });
        expect(router.current.path).toBe('/user/c%2B%2B');
        expect(router.current.params.id).toBe('c++');
    });

    it('matches wildcard routes', async () => {
        const router = createRouter({
            history: createMemoryHistory(),
            routes: [
                { path: '/files/*', component: {}, name: 'Files' }
            ]
        });

        await router.push('/files/path/to/file.txt');
        expect(router.current.matched[0].name).toBe('Files');
        expect(router.current.params.pathMatch).toBe('path/to/file.txt');
    });

    it('enforces route immutability', async () => {
        const router = createRouter({
            history: createMemoryHistory(),
            routes: [{ path: '/', component: {} }]
        });

        await router.push('/');
        const route = router.current;

        // Verify we cannot mutate the route object
        expect(Object.isFrozen(route)).toBe(true);
        expect(() => {
            (route as any).path = '/mutated';
        }).toThrow();
    });
});
