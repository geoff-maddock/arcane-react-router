import { useLoaderData } from 'react-router';
import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import EntityDetail from '~/components/EntityDetail';
import { api } from '~/lib/api';
import type { Entity } from '~/types/api';
import { truncate, SITE_NAME, DEFAULT_IMAGE } from '~/lib/seo';

// Loader fetches entity
export async function loader({ params }: LoaderFunctionArgs) {
    const { slug } = params;
    if (!slug) throw new Response("Not Found", { status: 404 });

    try {
        const { data } = await api.get<Entity>(`/entities/${slug}`);
        return data;
    } catch (error) {
        throw new Response("Not Found", { status: 404 });
    }
}

// Meta tags
export const meta: MetaFunction<typeof loader> = ({ data }) => {
    if (!data) return [{ title: SITE_NAME }];

    const entity = data;
    const baseTitle = entity.name;
    const role = entity.roles && entity.roles.length > 0 ? entity.roles.map(r => r.name).join(', ') : '';
    const description = truncate(entity.short || entity.description) || SITE_NAME;
    const ogImage = entity.primary_photo || DEFAULT_IMAGE;

    return [
        { title: `${baseTitle}${role ? ' - ' + role : ''} • ${SITE_NAME}` },
        { name: 'description', content: description },
        { property: 'og:title', content: baseTitle },
        { property: 'og:description', content: description },
        { property: 'og:image', content: ogImage },
        { name: 'twitter:title', content: baseTitle },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: ogImage },
    ];
};

// Error Boundary
export function ErrorBoundary() {
    return (
        <div className="min-h-[calc(100vh-4rem)] xl:min-h-screen w-full bg-white dark:bg-black transition-colors">
            <div className="max-w-3xl mx-auto p-6 xl:p-8 space-y-6">
                <h1 className="text-4xl font-bold tracking-tight">404 - Entity Not Found</h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                    Sorry, the entity you're looking for doesn't exist.
                </p>
                <div className="space-y-4">
                    <p>
                        The entity you requested could not be found. This might be because:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
                        <li>The entity slug was typed incorrectly</li>
                        <li>The entity has been moved or deleted</li>
                        <li>The link you followed is outdated</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default function EntityDetailRoute() {
    const entity = useLoaderData<typeof loader>();
    return <EntityDetail entitySlug={entity.slug} initialEntity={entity} />;
}
