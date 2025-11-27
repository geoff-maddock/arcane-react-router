import { createContext, type Dispatch, type SetStateAction } from 'react';
import type { SeriesFilters } from '~/types/filters';

interface SeriesFilterContextProps {
    filters: SeriesFilters;
    setFilters: Dispatch<SetStateAction<SeriesFilters>>;
}

export const SeriesFilterContext = createContext<SeriesFilterContextProps>({
    filters: {
        name: '',
        event_type: '',
        tag: '',
        entity: '',
        venue: '',
        promoter: '',
        occurrence_type: '',
        occurrence_week: '',
        occurrence_day: '',
        founded_at: {
            start: undefined,
            end: undefined
        }
    },
    setFilters: () => { }
});
