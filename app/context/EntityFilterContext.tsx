import { createContext, type Dispatch, type SetStateAction } from 'react';
import type { EntityFilters } from '~/types/filters';

interface EntityFilterContextProps {
    filters: EntityFilters;
    setFilters: Dispatch<SetStateAction<EntityFilters>>;
}

export const EntityFilterContext = createContext<EntityFilterContextProps>({
    filters: {
        name: '',
        entity_type: '',
        role: '',
        entity_status: '',
        tag: '',
        started_at: {
            start: '',
            end: undefined
        }
    },
    setFilters: () => { }
});
