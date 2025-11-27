import { useLoaderData } from 'react-router';
import type { Route } from './+types/user-detail';
import { api } from '~/lib/api';
import type { User } from '~/types/auth';
import UserDetail from '~/components/UserDetail';
import { SITE_NAME, DEFAULT_IMAGE } from '~/lib/seo';

export async function loader({ params }: Route.LoaderArgs) {
    const { id } = params;
    try {
        const { data } = await api.get<User>(`/users/${id}`);
        return { user: data, id };
    } catch (error) {
        throw new Response("Not Found", { status: 404 });
    }
}

export function meta({ data }: Route.MetaArgs) {
    if (!data) {
        return [
            { title: `User Not Found • ${SITE_NAME}` },
            { name: "description", content: "User not found" },
        ];
    }
    const { user } = data;
    const title = `User • ${user.name} • ${SITE_NAME}`;
    const description = `Details about user ${user.name} on ${SITE_NAME}`;
    const image = user.photos && user.photos.length > 0 ? user.photos[0].thumbnail_path : DEFAULT_IMAGE;

    return [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: image },
        { property: "og:type", content: "website" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
    ];
}

export default function UserDetailRoute() {
    const { user, id } = useLoaderData<typeof loader>();
    return <UserDetail id={id} initialUser={user} />;
}
