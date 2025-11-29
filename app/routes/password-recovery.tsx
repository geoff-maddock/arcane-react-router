import React, { useState } from 'react';
import { Link, type MetaFunction } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { userService } from '../services/user.service';
import { SITE_NAME, DEFAULT_IMAGE } from '../lib/seo';

export const meta: MetaFunction = () => {
    return [
        { title: `Password Recovery • ${SITE_NAME}` },
        { property: 'og:title', content: `Password Recovery • ${SITE_NAME}` },
        { property: 'og:description', content: 'Recover your password for the Pittsburgh Events Guide.' },
        { property: 'og:image', content: DEFAULT_IMAGE },
    ];
};

export default function PasswordRecovery() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!email) {
            setError('Please enter your email address');
            return;
        }

        try {
            await userService.sendPasswordResetEmail(email);
            setMessage('If an account with this email exists, you will receive a password recovery link shortly.');
            setIsSubmitted(true);
        } catch {
            setError('An error occurred. Please try again.');
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-[calc(100vh-4rem)] xl:min-h-screen w-full bg-white dark:bg-black transition-colors flex items-start xl:items-center">
                <div className="w-full max-w-md mx-auto p-6 xl:p-8 space-y-6">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Check Your Email</h2>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                        <p className="text-green-800 dark:text-green-200">{message}</p>
                    </div>
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

    return (
        <div className="min-h-[calc(100vh-4rem)] xl:min-h-screen w-full bg-white dark:bg-black transition-colors flex items-start xl:items-center">
            <div className="w-full max-w-md mx-auto p-6 xl:p-8 space-y-6">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Password Recovery</h2>
                <p className="text-gray-600 dark:text-gray-300">
                    Enter your email address and we'll send you a link to reset your password.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email address"
                            required
                            className="bg-white dark:bg-black"
                        />
                    </div>

                    {error && <div className="text-red-500 text-sm">{error}</div>}

                    <Button type="submit" className="w-full">
                        Send Recovery Link
                    </Button>
                </form>

                <div className="text-center space-y-2">
                    <Link
                        to="/login"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline block"
                    >
                        Back to Login
                    </Link>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Don't have an account?{' '}
                        <Link
                            to="/register"
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                        >
                            Sign up
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
