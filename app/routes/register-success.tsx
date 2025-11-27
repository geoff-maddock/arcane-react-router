import { Link, useSearchParams, type MetaFunction } from 'react-router';
import { Button } from '../components/ui/button';
import { SITE_NAME, DEFAULT_IMAGE } from '../lib/seo';

export const meta: MetaFunction = () => {
    return [
        { title: `Registration Successful • ${SITE_NAME}` },
        { property: 'og:title', content: `Registration Successful • ${SITE_NAME}` },
        { property: 'og:image', content: DEFAULT_IMAGE },
    ];
};

export default function RegisterSuccess() {
    const [searchParams] = useSearchParams();
    const name = searchParams.get('name');
    const email = searchParams.get('email');

    return (
        <div className="min-h-[calc(100vh-4rem)] xl:min-h-screen w-full bg-white dark:bg-black transition-colors flex items-start xl:items-center">
            <div className="w-full max-w-md mx-auto p-6 xl:p-8 space-y-6">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Registration Successful</h2>
                <div className="space-y-4 text-gray-600 dark:text-gray-300">
                    {name && (
                        <p>
                            <strong>Name:</strong> {name}
                        </p>
                    )}
                    {email && (
                        <p>
                            <strong>Email:</strong> {email}
                        </p>
                    )}
                    <p>Please check your email for a message to activate your account.</p>
                    <p>
                        Once activated, log in to start adding and following events, entities, series and more.
                    </p>
                    <Button asChild variant="link" className="w-full pl-0 justify-start text-blue-600 dark:text-blue-400">
                        <Link to="/login">Log In</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
