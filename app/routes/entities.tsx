import { useState, useEffect } from 'react';
import { useEntities } from '~/hooks/useEntities';
import EntityCard from '~/components/EntityCard';
import EntityFiltersComponent from '~/components/EntityFilters';
import { Pagination } from '~/components/Pagination';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '~/components/ui/card';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { useLocalStorage } from '~/hooks/useLocalStorage';
import { useFilterToggle } from '~/hooks/useFilterToggle';
import { EntityFilterContext } from '~/context/EntityFilterContext';
import type { EntityFilters } from '~/types/filters';
import { ActiveEntityFilters as ActiveFilters } from '~/components/ActiveEntityFilters';
import { FilterContainer } from '~/components/FilterContainer';
import SortControls from '~/components/SortControls';
import { Button } from '~/components/ui/button';
import { authService } from '~/services/auth.service';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router';
import type { Route } from "./+types/entities";
import { SITE_NAME, DEFAULT_IMAGE } from '~/lib/seo';

export function meta({ }: Route.MetaArgs) {
    return [
        { title: `Entities • ${SITE_NAME}` },
        { property: 'og:title', content: `Entities • ${SITE_NAME}` },
        { property: 'og:description', content: `A list of entities such as bands, venues, promoters, artists, djs in Pittsburgh.` },
        { name: 'description', content: `A list of entities such as bands, venues, promoters, artists, djs in Pittsburgh.` },
        { property: 'og:image', content: DEFAULT_IMAGE },
    ];
}

const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'entity_type_id', label: 'Type' },
    { value: 'entity_status_id', label: 'Status' },
    { value: 'created_at', label: 'Created' }
];

export default function Entities() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { filtersVisible, toggleFilters } = useFilterToggle();

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: authService.getCurrentUser,
        enabled: authService.isAuthenticated(),
    });

    const [filters, setFilters] = useState<EntityFilters>({
        name: searchParams.get('name') || '',
        entity_type: searchParams.get('entity_type') || '',
        role: searchParams.get('role') || '',
        entity_status: searchParams.get('entity_status') || '',
        tag: searchParams.get('tag') || '',
        created_at: {
            start: undefined,
            end: undefined
        },
        started_at: {
            start: undefined,
            end: undefined
        }
    });

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams();
        if (filters.name) params.set('name', filters.name);
        if (filters.entity_type) params.set('entity_type', filters.entity_type);
        if (filters.role) params.set('role', filters.role);
        if (filters.entity_status) params.set('entity_status', filters.entity_status);
        if (filters.tag) params.set('tag', filters.tag);

        setSearchParams(params, { replace: true });
    }, [filters, setSearchParams]);

    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useLocalStorage('entitiesPerPage', 25);
    const [sort, setSort] = useState('created_at');
    const [direction, setDirection] = useState<'asc' | 'desc'>('desc');

    const { data, isLoading, error } = useEntities({
        filters,
        page,
        itemsPerPage,
        sort,
        direction
    });

    // Reset pagination when filters change
    useEffect(() => {
        setPage(1);
    }, [filters]);

    const handleRemoveFilter = (key: keyof EntityFilters) => {
        setFilters(prev => {
            if (key === 'created_at' || key === 'started_at') {
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

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <EntityFilterContext.Provider value={{ filters, setFilters }}>
            <div className="min-h-screen bg-background">
                <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-[2400px]">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Entities</h1>
                                <p className="text-muted-foreground mt-1">
                                    Discover venues, artists, and promoters in Pittsburgh
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {user && (
                                    <Button asChild>
                                        <Link to="/entity/create">Create Entity</Link>
                                    </Button>
                                )}
                            </div>
                        </div>

                        <FilterContainer
                            filtersVisible={filtersVisible}
                            onToggleFilters={toggleFilters}
                            hasActiveFilters={Object.values(filters).some(v =>
                                typeof v === 'object' ? (v.start || v.end) : !!v
                            )}
                            onClearAllFilters={() => setFilters({
                                name: '',
                                entity_type: '',
                                role: '',
                                entity_status: '',
                                tag: '',
                                created_at: { start: undefined, end: undefined },
                                started_at: { start: undefined, end: undefined }
                            })}
                            activeFiltersComponent={<ActiveFilters filters={filters} onRemoveFilter={handleRemoveFilter} />}
                        >
                            <EntityFiltersComponent filters={filters} onFilterChange={setFilters} />
                        </FilterContainer>

                        <div className="flex justify-end">
                            <SortControls
                                sort={sort}
                                setSort={setSort}
                                direction={direction}
                                setDirection={setDirection}
                                sortOptions={sortOptions}
                            />
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>
                                    Failed to load entities. Please try again later.
                                </AlertDescription>
                            </Alert>
                        )}

                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {[...Array(8)].map((_, i) => (
                                    <Card key={i} className="overflow-hidden">
                                        <div className="aspect-video bg-muted animate-pulse" />
                                        <CardContent className="p-6 space-y-4">
                                            <div className="h-6 bg-muted rounded animate-pulse w-3/4" />
                                            <div className="space-y-2">
                                                <div className="h-4 bg-muted rounded animate-pulse w-full" />
                                                <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {data?.data.map((entity) => (
                                        <EntityCard
                                            key={entity.id}
                                            entity={entity}
                                            allImages={data.data
                                                .filter(e => e.primary_photo)
                                                .map(e => ({
                                                    src: e.primary_photo!,
                                                    alt: e.name
                                                }))}
                                            imageIndex={data.data
                                                .filter(e => e.primary_photo)
                                                .findIndex(e => e.id === entity.id)}
                                        />
                                    ))}
                                </div>

                                {data && data.data.length === 0 && (
                                    <div className="text-center py-12">
                                        <p className="text-muted-foreground text-lg">No entities found matching your criteria.</p>
                                        <Button
                                            variant="link"
                                            onClick={() => setFilters({
                                                name: '',
                                                entity_type: '',
                                                role: '',
                                                entity_status: '',
                                                tag: '',
                                                created_at: { start: undefined, end: undefined },
                                                started_at: { start: undefined, end: undefined }
                                            })}
                                            className="mt-2"
                                        >
                                            Clear all filters
                                        </Button>
                                    </div>
                                )}

                                {data && data.last_page > 1 && (
                                    <div className="mt-8">
                                        <Pagination
                                            currentPage={page}
                                            totalPages={data.last_page}
                                            onPageChange={handlePageChange}
                                            itemCount={data.data.length}
                                            totalItems={data.total}
                                            itemsPerPage={itemsPerPage}
                                            onItemsPerPageChange={setItemsPerPage}
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
