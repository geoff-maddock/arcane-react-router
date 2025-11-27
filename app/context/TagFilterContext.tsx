import { createContext, type Dispatch, type SetStateAction } from 'react';
import type { TagFilters } from '~/hooks/useTags';

interface TagFilterContextType {
    filters: TagFilters;
    setFilters: Dispatch<SetStateAction<TagFilters>>;
}

export const TagFilterContext = createContext<TagFilterContextType>({
    filters: {},
    setFilters: () => { },
});
