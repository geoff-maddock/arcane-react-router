import React, { useState } from 'react';
import { useNavigate, Link, type MetaFunction } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { SITE_NAME, DEFAULT_IMAGE } from '../lib/seo';

export const meta: MetaFunction = () => {
    const url = typeof window !== 'undefined' ? window.location.href : 'https://arcane.city/login';
    return [
        { title: `Login • ${SITE_NAME}` },
        { property: 'og:url', content: url },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: `Login • ${SITE_NAME}` },
        { property: 'og:image', content: DEFAULT_IMAGE },
        { property: 'og:description', content: `Login to your account on the Pittsburgh Events Guide.` },
        { name: 'description', content: `Login to your account on the Pittsburgh Events Guide.` },
    ];
};

export default function Login() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await authService.login({ username, password });
            await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            navigate('/account');
        } catch (err) {
            setError('Login failed');
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] xl:min-h-screen w-full bg-white dark:bg-black transition-colors flex items-start xl:items-center">
            <div className="w-full max-w-md mx-auto p-6 xl:p-8 space-y-6">
                <h2 className="text-3xl font-bold tracking-tight">Login</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="username">Email</Label>
                        <Input
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    {error && <div className="text-red-500 text-sm">{error}</div>}
                    <Button type="submit" className="w-full">Login</Button>
                </form>
                <div className="pt-2 space-y-1 text-sm">
                    <Link to="/register" className="underline hover:text-blue-600 dark:hover:text-blue-400 block">Need an account? Register</Link>
                    <Link to="/password-recovery" className="underline hover:text-blue-600 dark:hover:text-blue-400 block">Forgot your password? Recover it</Link>
                </div>
            </div>
        </div>
    );
}
