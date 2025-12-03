import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { Button } from '../components/ui/button';
import { userService } from '../services/user.service';
// import type { Route } from './+types/email-verify';

export function meta({ }: any) {
    return [
        { title: "Email Verification" },
        { name: "description", content: "Verify your email address to complete registration." },
    ];
}

export default function EmailVerify() {
    const { userId, hash } = useParams();
    const [searchParams] = useSearchParams();
    const expires = searchParams.get('expires');
    const signature = searchParams.get('signature');

    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already-verified'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            if (!expires || !signature || !userId || !hash) {
                setStatus('error');
                setMessage('Invalid verification link. Missing required parameters.');
                return;
            }

            try {
                const response = await userService.verifyEmail({
                    userId,
                    hash,
                    expires,
                    signature,
                });

                if (response.status === 'already-verified') {
                    setStatus('already-verified');
                    setMessage('Email already verified.');
                } else {
                    setStatus('success');
                    setMessage('Your email has been successfully verified. You can now log in.');
                }
            } catch (err: unknown) {
                const error = err as { response?: { data?: { message?: string; status?: string } } };
                if (error.response?.data?.status === 'already-verified') {
                    setStatus('already-verified');
                    setMessage('Email already verified.');
                } else if (error.response?.data?.message) {
                    setStatus('error');
                    setMessage(error.response.data.message);
                } else {
                    setStatus('error');
                    setMessage('Invalid verification link. The link may have expired or is invalid.');
                }
            }
        };

        verifyEmail();
    }, [userId, hash, expires, signature]);

    if (status === 'loading') {
        return (
            <div className="max-w-md mx-auto p-4 space-y-4">
                <h2 className="text-xl font-bold">Verifying Email</h2>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-blue-800">Please wait while we verify your email address...</p>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="max-w-md mx-auto p-4 space-y-4">
                <h2 className="text-xl font-bold">Email Verified</h2>
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-800">{message}</p>
                </div>
                <div className="text-center">
                    <Link to="/login">
                        <Button className="w-full">Go to Login</Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (status === 'already-verified') {
        return (
            <div className="max-w-md mx-auto p-4 space-y-4">
                <h2 className="text-xl font-bold">Email Already Verified</h2>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-blue-800">{message}</p>
                </div>
                <div className="text-center space-y-2">
                    <Link to="/login">
                        <Button className="w-full">Go to Login</Button>
                    </Link>
                    <div className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link
                            to="/register"
                            className="text-600 hover:text-800 hover:underline"
                        >
                            Sign up
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto p-4 space-y-4">
            <h2 className="text-xl font-bold">Email Verification Failed</h2>
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800">{message}</p>
            </div>
            <div className="text-center space-y-2">
                <Link to="/login">
                    <Button className="w-full">Go to Login</Button>
                </Link>
                <div className="text-sm text-gray-600">
                    Need help?{' '}
                    <Link
                        to="/help"
                        className="text-600 hover:text-800 hover:underline"
                    >
                        Contact Support
                    </Link>
                </div>
            </div>
        </div>
    );
}
