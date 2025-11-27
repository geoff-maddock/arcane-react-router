import { useLocalStorage } from './useLocalStorage';

interface UseFilterToggleOptions {
    /**
     * The localStorage key to persist the filter visibility state.
     * Defaults to 'filtersVisible'
     */
    storageKey?: string;
    /**
     * The default visibility state when no stored value exists.
     * Defaults to false
     */
    defaultVisible?: boolean;
}

/**
 * A reusable hook for managing filter visibility state with localStorage persistence.
 * 
 * @param options Configuration options for the hook
 * @returns An object containing the visibility state and toggle function
 */
export function useFilterToggle(options: UseFilterToggleOptions = {}) {
    const { storageKey = 'filtersVisible', defaultVisible = false } = options;

    const [filtersVisible, setFiltersVisible] = useLocalStorage<boolean>(storageKey, defaultVisible);

    const toggleFilters = () => {
        setFiltersVisible((prev) => !prev);
    };

    return {
        filtersVisible,
        setFiltersVisible,
        toggleFilters
    };
}
