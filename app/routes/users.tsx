import Users from '~/components/Users';
import { SITE_NAME, DEFAULT_IMAGE } from '~/lib/seo';
import type { Route } from './+types/users';

export function meta({ }: Route.MetaArgs) {
    return [
        { title: `Users • ${SITE_NAME}` },
        { property: 'og:title', content: `Users • ${SITE_NAME}` },
        { property: 'og:description', content: `A list of users on ${SITE_NAME}` },
        { name: 'description', content: `A list of users on ${SITE_NAME}` },
        { property: 'og:image', content: DEFAULT_IMAGE },
        { property: 'og:type', content: 'website' },
    ];
}

export default function UsersRoute() {
    return <Users />;
}
