import { useLoaderData } from 'react-router';
import type { Route } from './+types/tag-detail';
import { api } from '~/lib/api';
import type { Tag } from '~/types/api';
import TagDetail from '~/components/TagDetail';
import { SITE_NAME, DEFAULT_IMAGE } from '~/lib/seo';

export async function loader({ params }: Route.LoaderArgs) {
    const { slug } = params;
    try {
        const { data } = await api.get<Tag>(`/tags/${slug}`);
        return { tag: data, slug };
    } catch (error) {
        throw new Response("Not Found", { status: 404 });
    }
}

export function meta({ data }: Route.MetaArgs) {
    if (!data) {
        return [
            { title: `Tag Not Found • ${SITE_NAME}` },
            { name: "description", content: "Tag not found" },
        ];
    }
    const { tag } = data;
    const title = `${tag.name} • ${SITE_NAME}`;
    const description = `Events and entities tagged with ${tag.name}`;
    // Tags might not have a primary photo, fallback to default
    const image = DEFAULT_IMAGE;

    return [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: image },
        { property: "og:type", content: "website" },
    ];
}

export default function TagDetailRoute() {
    const { slug } = useLoaderData<typeof loader>();
    return <TagDetail slug={slug} />;
}
