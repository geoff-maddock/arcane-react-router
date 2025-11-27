import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, type MetaFunction } from 'react-router';
import ReCAPTCHA from 'react-google-recaptcha';
import { userService } from '../services/user.service';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { SITE_NAME, DEFAULT_IMAGE } from '../lib/seo';

export const meta: MetaFunction = () => {
    return [
        { title: `Register • ${SITE_NAME}` },
        { property: 'og:title', content: `Register • ${SITE_NAME}` },
        { property: 'og:description', content: 'Create an account to follow events, artists, and venues.' },
        { property: 'og:image', content: DEFAULT_IMAGE },
    ];
};

interface FieldErrors {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    recaptcha?: string;
    general?: string;
}

export default function Register() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
    const [errors, setErrors] = useState<FieldErrors>({});
    const recaptchaRef = useRef<ReCAPTCHA>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const validate = (): FieldErrors => {
        const validationErrors: FieldErrors = {};
        if (name.length < 6 || name.length > 60) {
            validationErrors.name = 'Name must be between 6 and 60 characters';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (
            email.length < 6 ||
            email.length > 60 ||
            !emailRegex.test(email)
        ) {
            validationErrors.email = 'Enter a valid email address';
        }
        if (password.length < 8 || password.length > 60) {
            validationErrors.password = 'Password must be between 8 and 60 characters';
        }
        if (password !== confirmPassword) {
            validationErrors.confirmPassword = 'Passwords do not match';
        }
        if (!recaptchaToken) {
            validationErrors.recaptcha = 'Please complete the reCAPTCHA verification';
        }
        return validationErrors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setErrors({});
        try {
            await userService.createUser({
                name,
                email,
                password,
                'g-recaptcha-response': recaptchaToken || undefined,
                'frontend-url': window.location.origin,
            });
            navigate(`/register/success?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`);
        } catch (err: any) {
            const msg = err.response?.data?.message || 'An error occurred during registration';
            setErrors({ general: msg });
        } finally {
            // Reset reCAPTCHA after submission attempt
            if (recaptchaRef.current) {
                recaptchaRef.current.reset();
                setRecaptchaToken(null);
            }
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] xl:min-h-screen w-full bg-white dark:bg-black transition-colors flex items-start xl:items-center">
            <div className="w-full max-w-md mx-auto p-6 xl:p-8 space-y-6">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Register</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input 
                            id="name" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            className="bg-white dark:bg-black"
                        />
                        {errors.name && <div className="text-red-500 text-sm">{errors.name}</div>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                            id="email" 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            className="bg-white dark:bg-black"
                        />
                        {errors.email && <div className="text-red-500 text-sm">{errors.email}</div>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input 
                            id="password" 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            className="bg-white dark:bg-black"
                        />
                        {errors.password && <div className="text-red-500 text-sm">{errors.password}</div>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input 
                            id="confirmPassword" 
                            type="password" 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                            className="bg-white dark:bg-black"
                        />
                        {errors.confirmPassword && <div className="text-red-500 text-sm">{errors.confirmPassword}</div>}
                    </div>

                    <div className="flex justify-center">
                        {mounted && (
                            <ReCAPTCHA
                                ref={recaptchaRef}
                                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''}
                                onChange={(token: string | null) => setRecaptchaToken(token)}
                                theme="dark"
                            />
                        )}
                    </div>
                    {errors.recaptcha && <div className="text-red-500 text-sm text-center">{errors.recaptcha}</div>}

                    {errors.general && (
                        <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
                            {errors.general}
                        </div>
                    )}

                    <Button type="submit" className="w-full">
                        Register
                    </Button>
                </form>
            </div>
        </div>
    );
}
