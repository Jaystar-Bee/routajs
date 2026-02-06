import { describe, it, expect, vi } from 'vitest';
import { createRouter, createMemoryHistory } from '../src/index';

describe('Router', () => {
    const routes = [
        { path: '/', component: { template: 'home' }, name: 'Home' },
        { path: '/users', component: { template: 'users' }, name: 'Users' },
        { path: '/users/:id', component: { template: 'user-detail' }, name: 'UserDetail' },
        { path: '/about', component: { template: 'about' }, name: 'About' }
    ];

    function createTestRouter() {
        return createRouter({
            history: createMemoryHistory(),
            routes
        });
    }

    it('navigates to a new route', async () => {
        const router = createTestRouter();
        await router.push('/users');
        expect(router.current.path).toBe('/users');
        expect(router.current.matched.length).toBe(1);
        expect(router.current.matched[0].name).toBe('Users');
    });

    it('tracks previous route details', async () => {
        const router = createTestRouter();
        // Initial state
        expect(router.current.path).toBe('/');
        expect(router.current.previousFullPath).toBe(null);

        // First navigation
        await router.push('/users');
        expect(router.current.path).toBe('/users');
        expect(router.current.previousFullPath).toBe('/');
        expect(router.previous?.path).toBe('/');

        // Second navigation
        await router.push('/about');
        expect(router.current.path).toBe('/about');
        expect(router.current.previousFullPath).toBe('/users');
        expect(router.previous?.path).toBe('/users');
    });

    it('handles dynamic params', async () => {
        const router = createTestRouter();
        await router.push('/users/123');
        expect(router.current.path).toBe('/users/123');
        expect(router.current.params.id).toBe('123');
        expect(router.current.name).toBe('UserDetail');
    });

    it('supports navigation guards', async () => {
        const router = createTestRouter();
        const guard = vi.fn((to, from, next) => next());
        router.beforeEach(guard);

        await router.push('/about');
        expect(guard).toHaveBeenCalled();

        const call = guard.mock.calls[0];
        expect(call[0].path).toBe('/about');
        expect(call[1].path).toBe('/');
    });

    it('blocks navigation in guards', async () => {
        const router = createTestRouter();
        router.beforeEach((to, from, next) => {
            next(false);
        });

        try {
            await router.push('/about');
        } catch (e: any) {
            expect(e.message).toBe('Navigation cancelled');
        }
        expect(router.current.path).toBe('/');
    });

    it('redirects in guards', async () => {
        const router = createTestRouter();
        router.beforeEach((to, from, next) => {
            if (to.path === '/about') {
                next('/users');
            } else {
                next();
            }
        });

        await router.push('/about');
        expect(router.current.path).toBe('/users');
        expect(router.current.previousFullPath).toBe('/');
    });
});
