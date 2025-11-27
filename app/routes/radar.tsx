import { redirect } from 'react-router';
import Radar from '~/components/Radar';
import { authService } from '~/services/auth.service';
import { SITE_NAME, SITE_DESCRIPTION, DEFAULT_IMAGE } from '~/lib/seo';
import type { Route } from './+types/radar';

export function clientLoader() {
    if (!authService.isAuthenticated()) {
        return redirect("/login?redirect=/radar");
    }
    return null;
}

export function meta({ }: Route.MetaArgs) {
    return [
        { title: `Radar • ${SITE_NAME}` },
        { property: 'og:title', content: `Radar • ${SITE_NAME}` },
        { property: 'og:description', content: SITE_DESCRIPTION },
        { name: 'description', content: SITE_DESCRIPTION },
        { property: 'og:image', content: DEFAULT_IMAGE },
        { property: 'og:type', content: 'website' },
    ];
}

export default function RadarRoute() {
    return <Radar />;
}
