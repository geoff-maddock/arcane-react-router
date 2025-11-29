import React, { useState } from 'react';
import { Link, useSearchParams, useParams, type MetaFunction } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { userService } from '../services/user.service';
import { SITE_NAME, DEFAULT_IMAGE } from '../lib/seo';

export const meta: MetaFunction = () => {
    return [
        { title: `Reset Password • ${SITE_NAME}` },
        { property: 'og:title', content: `Reset Password • ${SITE_NAME}` },
        { property: 'og:description', content: 'Reset your password for the Pittsburgh Events Guide.' },
        { property: 'og:image', content: DEFAULT_IMAGE },
    ];
};

export default function PasswordReset() {
    const { token } = useParams();
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email');
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!email) {
            setError('Email address is required.');
            return;
        }

        if (!token) {
            setError('Reset token is required.');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);
        try {
            await userService.resetPassword({
                email,
                password,
                secret: import.meta.env.VITE_API_KEY,
                token,
            });
            setMessage('Your password has been successfully reset. You can now log in with your new password.');
            setIsSubmitted(true);
        } catch (err: any) {
            const msg = err.response?.data?.message || 'An error occurred while resetting your password. Please try again or request a new reset link.';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-[calc(100vh-4rem)] xl:min-h-screen w-full bg-white dark:bg-black transition-colors flex items-start xl:items-center">
                <div className="w-full max-w-md mx-auto p-6 xl:p-8 space-y-6">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Password Reset Successful</h2>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                        <p className="text-green-800 dark:text-green-200">{message}</p>
                    </div>
                    <div className="text-center">
                        <Link
                            to="/login"
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                        >
                            Go to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] xl:min-h-screen w-full bg-white dark:bg-black transition-colors flex items-start xl:items-center">
            <div className="w-full max-w-md mx-auto p-6 xl:p-8 space-y-6">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Reset Password</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter new password"
                            required
                            className="bg-white dark:bg-black"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            required
                            className="bg-white dark:bg-black"
                        />
                    </div>

                    {error && <div className="text-red-500 text-sm">{error}</div>}

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                    </Button>
                </form>

                <div className="text-center">
                    <Link
                        to="/login"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
