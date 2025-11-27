import { useQuery } from '@tanstack/react-query';
import { api } from '~/lib/api';
import type { Series, PaginatedResponse } from '~/types/api';
import type { SeriesFilters } from '~/types/filters';

interface UseSeriesParams {
    page?: number;
    itemsPerPage?: number;
    filters?: SeriesFilters;
    sort?: string;
    direction?: 'desc' | 'asc';
}

export const useSeries = ({ page = 1, itemsPerPage = 25, filters, sort = 'name', direction = 'asc' }: UseSeriesParams = {}) => {
    return useQuery<PaginatedResponse<Series>>({
        queryKey: ['series', page, itemsPerPage, filters, sort, direction],
        queryFn: async () => {
            const params = new URLSearchParams();

            params.append('page', page.toString());
            params.append('limit', itemsPerPage.toString());
            if (filters?.name) params.append('filters[name]', filters.name);
            if (filters?.event_type) params.append('filters[event_type]', filters.event_type);
            if (filters?.tag) params.append('filters[tag]', filters.tag);
            if (filters?.entity) params.append('filters[related]', filters.entity);
            if (filters?.venue) params.append('filters[venue]', filters.venue);
            if (filters?.promoter) params.append('filters[promoter]', filters.promoter);
            if (filters?.founded_at?.start) params.append('filters[founded_at][start]', filters.founded_at.start);
            if (filters?.founded_at?.end) params.append('filters[founded_at][end]', filters.founded_at.end);
            if (filters?.occurrence_type) params.append('filters[occurrence_type]', filters.occurrence_type);
            if (filters?.occurrence_week) params.append('filters[occurrence_week]', filters.occurrence_week);
            if (filters?.occurrence_day) params.append('filters[occurrence_day]', filters.occurrence_day);

            if (sort) params.append('sort', sort);
            if (direction) params.append('direction', direction);

            const { data } = await api.get<PaginatedResponse<Series>>(`/series?${params.toString()}`);
            return data;
        },
    });
};
