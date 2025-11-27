import Search from '~/components/Search';
import { SITE_NAME, DEFAULT_IMAGE } from '~/lib/seo';
import type { Route } from './+types/search';

export function meta({ }: Route.MetaArgs) {
    return [
        { title: `Search • ${SITE_NAME}` },
        { property: 'og:title', content: `Search • ${SITE_NAME}` },
        { property: 'og:description', content: `Search for events, entities, series, tags, and locations on ${SITE_NAME}` },
        { name: 'description', content: `Search for events, entities, series, tags, and locations on ${SITE_NAME}` },
        { property: 'og:image', content: DEFAULT_IMAGE },
        { property: 'og:type', content: 'website' },
    ];
}

export default function SearchRoute() {
    return <Search />;
}
