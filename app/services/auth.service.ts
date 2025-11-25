import { api } from '../lib/api';
import type { LoginCredentials, User } from '../types/auth';

export const authService = {
    async login(credentials: LoginCredentials) {
        const { username, password } = credentials;
        const { data } = await api.post<{ token: string }>(
            '/tokens/create',
            { token_name: 'arcane-city' },
            { auth: { username, password } }
        );
        if (typeof window !== 'undefined') {
            localStorage.setItem('token', data.token);
        }
        return data;
    },

    async logout() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
        }
        // Optionally call logout endpoint
        // await api.post('/auth/logout');
    },

    async getCurrentUser() {
        const { data } = await api.get<User>('/auth/me');
        return data;
    },

    getToken() {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('token');
        }
        return null;
    },

    isAuthenticated() {
        return !!this.getToken();
    }
};
