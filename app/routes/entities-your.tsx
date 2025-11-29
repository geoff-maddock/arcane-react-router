import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, type MetaFunction } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useEntities } from '../hooks/useEntities';
import EntityCard from '../components/EntityCard';
import EntityFilter from '../components/EntityFilters';
import { Pagination } from '../components/Pagination';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useFilterToggle } from '../hooks/useFilterToggle';
import { EntityFilterContext } from '../context/EntityFilterContext';
import type { EntityFilters } from '../types/filters';
import { ActiveEntityFilters as ActiveFilters } from '../components/ActiveEntityFilters';
import { FilterContainer } from '../components/FilterContainer';
import { authService } from '../services/auth.service';
import { SITE_NAME, DEFAULT_IMAGE } from '../lib/seo';

export const meta: MetaFunction = () => {
    const url = typeof window !== 'undefined' ? window.location.href : 'https://arcane.city/entities/your';
    return [
        { title: `Your Entities • ${SITE_NAME}` },
        { property: 'og:url', content: url },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: `Your Entities • ${SITE_NAME}` },
        { property: 'og:image', content: DEFAULT_IMAGE },
        { property: 'og:description', content: `Entities you follow and are interested in.` },
        { name: 'description', content: `Entities you follow and are interested in.` },
    ];
};

const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'entity_type_id', label: 'Type' },
    { value: 'entity_status_id', label: 'Status' },
    { value: 'created_at', label: 'Created' }
];

export default function YourEntities() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { filtersVisible, toggleFilters } = useFilterToggle();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: authService.getCurrentUser,
        enabled: authService.isAuthenticated(),
    });

    useEffect(() => {
        if (!authService.isAuthenticated()) {
            navigate('/login?redirect=/entities/your');
        }
    }, [navigate]);

    const [filters, setFilters] = useState<EntityFilters>({
        name: '',
        entity_type: '',
        role: '',
        entity_status: '',
        tag: '',
        created_at: {
            start: undefined,
            end: undefined
        },
        started_at: {
            start: undefined,
            end: undefined
        }
    });

    // Initialize filters from query parameters
    useEffect(() => {
        const tag = searchParams.get('tag');
        if (tag) {
            setFilters(prev => ({ ...prev, tag }));
        }
    }, [searchParams]);

    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useLocalStorage('yourEntitiesPerPage', 25);
    const [sort, setSort] = useState('created_at');
    const [direction, setDirection] = useState<'asc' | 'desc'>('desc');

    const { data, isLoading, error } = useEntities({
        filters,
        page,
        itemsPerPage,
        sort,
        direction,
        followedOnly: true
    });

    // Reset pagination when filters change
    useEffect(() => {
        setPage(1);
    }, [filters]);

    const handleRemoveFilter = (key: keyof EntityFilters) => {
        setFilters(prev => {
            if (key === 'created_at') {
                return {
                    ...prev,
                    [key]: { start: undefined, end: undefined }
                };
            }
            return {
                ...prev,
                [key]: ''
            };
        });
    };

    const handleFilterChange = (newFilters: EntityFilters) => {
        setFilters(newFilters);
    };

    const handleClearFilters = () => {
        setFilters({
            name: '',
            entity_type: '',
            role: '',
            entity_status: '',
            tag: '',
            created_at: { start: undefined, end: undefined },
            started_at: { start: undefined, end: undefined }
        });
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Calculate all images for lightbox
    const allImages = data?.data.flatMap(entity =>
        entity.photos ? entity.photos.map(p => ({ src: p.path, alt: entity.name })) : []
    ) || [];

    // Helper to find image index
    const getImageIndex = (entityId: number) => {
        let index = 0;
        if (!data?.data) return 0;
        for (const entity of data.data) {
            if (entity.id === entityId) break;
            if (entity.photos) index += entity.photos.length;
        }
        return index;
    };

    if (error) {
        return (
            <div className="min-h-[calc(100vh-4rem)] xl:min-h-screen w-full bg-white dark:bg-black transition-colors">
                <div className="max-w-[2400px] mx-auto p-6 xl:p-8 space-y-6">
                    <Alert variant="destructive">
                        <AlertDescription>
                            There was an error loading your entities. Please try again later.
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        );
    }

    return (
        <EntityFilterContext.Provider value={{ filters, setFilters }}>
            <div className="min-h-[calc(100vh-4rem)] xl:min-h-screen w-full bg-white dark:bg-black transition-colors">
                <div className="max-w-[2400px] mx-auto p-6 xl:p-8 space-y-6">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">Your Entities</h1>
                                <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
                                    Entities you follow and are interested in.
                                </p>
                            </div>
                        </div>

                        <FilterContainer
                            filtersVisible={filtersVisible}
                            onToggleFilters={toggleFilters}
                            hasActiveFilters={Object.values(filters).some(v => !!v && (typeof v === 'string' ? v !== '' : (v.start || v.end)))}
                            onClearAllFilters={handleClearFilters}
                            activeFiltersComponent={<ActiveFilters filters={filters} onRemoveFilter={handleRemoveFilter} />}
                        >
                            <EntityFilter filters={filters} onFilterChange={handleFilterChange} />
                        </FilterContainer>

                        {!mounted || isLoading ? (
                            <div className="flex h-96 items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                            </div>
                        ) : (
                            <>
                                {data?.data && data.data.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                                        {data.data.map((entity) => (
                                            <EntityCard
                                                key={entity.id}
                                                entity={entity}
                                                allImages={allImages}
                                                imageIndex={getImageIndex(entity.id)}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <p className="text-lg text-gray-500 dark:text-gray-400">
                                            You aren't following any entities yet.
                                        </p>
                                    </div>
                                )}

                                {data && (
                                    <div className="mt-8">
                                        <Pagination
                                            currentPage={page}
                                            totalPages={data.last_page}
                                            onPageChange={handlePageChange}
                                            itemsPerPage={itemsPerPage}
                                            onItemsPerPageChange={setItemsPerPage}
                                            totalItems={data.total}
                                            itemCount={data.data.length}
                                            sort={sort}
                                            setSort={setSort}
                                            direction={direction}
                                            setDirection={setDirection}
                                            sortOptions={sortOptions}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </EntityFilterContext.Provider>
    );
}
