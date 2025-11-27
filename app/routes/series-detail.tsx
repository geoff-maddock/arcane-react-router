import { useLoaderData } from 'react-router';
import type { Route } from './+types/series-detail';
import { api } from '~/lib/api';
import type { Series } from '~/types/api';
import SeriesDetail from '~/components/SeriesDetail';
import { SITE_NAME, DEFAULT_IMAGE } from '~/lib/seo';
import { SeriesFilterContext } from '~/context/SeriesFilterContext';
import { useState } from 'react';
import type { SeriesFilters } from '~/types/filters';

export async function loader({ params }: Route.LoaderArgs) {
    const { slug } = params;
    try {
        const { data } = await api.get<Series>(`/series/${slug}`);
        return { series: data, slug };
    } catch (error) {
        throw new Response("Not Found", { status: 404 });
    }
}

export function meta({ data }: Route.MetaArgs) {
    if (!data) {
        return [
            { title: `Series Not Found • ${SITE_NAME}` },
            { name: "description", content: "Series not found" },
        ];
    }
    const { series } = data;
    const title = `${series.name} • ${SITE_NAME}`;
    const description = series.short || series.description?.substring(0, 160) || `Details for ${series.name}`;
    const image = series.primary_photo || DEFAULT_IMAGE;

    return [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: image },
        { property: "og:type", content: "website" },
    ];
}

export default function SeriesDetailRoute() {
    const { series, slug } = useLoaderData<typeof loader>();
    const [filters, setFilters] = useState<SeriesFilters>({
        name: '',
        venue: '',
        promoter: '',
        entity: '',
        event_type: '',
        tag: '',
        occurrence_type: '',
        occurrence_week: '',
        occurrence_day: '',
        founded_at: {
            start: undefined,
            end: undefined
        }
    });

    return (
        <SeriesFilterContext.Provider value={{ filters, setFilters }}>
            <SeriesDetail slug={slug} initialSeries={series} />
        </SeriesFilterContext.Provider>
    );
}
