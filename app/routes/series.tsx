import { useState, useEffect } from 'react';
import { useSeries } from '~/hooks/useSeries';
import SeriesCard from '~/components/SeriesCard';
import SeriesFiltersComponent from '~/components/SeriesFilters';
import { Pagination } from '~/components/Pagination';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '~/components/ui/card';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { useLocalStorage } from '~/hooks/useLocalStorage';
import { useFilterToggle } from '~/hooks/useFilterToggle';
import { SeriesFilterContext } from '~/context/SeriesFilterContext';
import type { SeriesFilters } from '~/types/filters';
import { ActiveSeriesFilters as ActiveFilters } from '~/components/ActiveSeriesFilters';
import { FilterContainer } from '~/components/FilterContainer';
import SortControls from '~/components/SortControls';
import { Button } from '~/components/ui/button';
import { authService } from '~/services/auth.service';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router';
import type { Route } from "./+types/series";
import { SITE_NAME, DEFAULT_IMAGE } from '~/lib/seo';

export function meta({ }: Route.MetaArgs) {
    return [
        { title: `Series • ${SITE_NAME}` },
        { property: 'og:title', content: `Series • ${SITE_NAME}` },
        { property: 'og:description', content: `A list of regularly occurring event series in Pittsburgh.` },
        { name: 'description', content: `A list of regularly occurring event series in Pittsburgh.` },
        { property: 'og:image', content: DEFAULT_IMAGE },
    ];
}

const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'event_type_id', label: 'Type' },
    { value: 'founded_at', label: 'Founded' },
    { value: 'created_at', label: 'Created' }
];

export default function Series() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { filtersVisible, toggleFilters } = useFilterToggle();

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: authService.getCurrentUser,
        enabled: authService.isAuthenticated(),
    });

    const [filters, setFilters] = useState<SeriesFilters>({
        name: searchParams.get('name') || '',
        venue: searchParams.get('venue') || '',
        promoter: searchParams.get('promoter') || '',
        entity: searchParams.get('entity') || '',
        event_type: searchParams.get('event_type') || '',
        tag: searchParams.get('tag') || '',
        occurrence_type: searchParams.get('occurrence_type') || '',
        occurrence_week: searchParams.get('occurrence_week') || '',
        occurrence_day: searchParams.get('occurrence_day') || '',
        founded_at: {
            start: undefined,
            end: undefined
        }
    });

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams();
        if (filters.name) params.set('name', filters.name);
        if (filters.venue) params.set('venue', filters.venue);
        if (filters.promoter) params.set('promoter', filters.promoter);
        if (filters.entity) params.set('entity', filters.entity);
        if (filters.event_type) params.set('event_type', filters.event_type);
        if (filters.tag) params.set('tag', filters.tag);
        if (filters.occurrence_type) params.set('occurrence_type', filters.occurrence_type);
        if (filters.occurrence_week) params.set('occurrence_week', filters.occurrence_week);
        if (filters.occurrence_day) params.set('occurrence_day', filters.occurrence_day);

        setSearchParams(params, { replace: true });
    }, [filters, setSearchParams]);

    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useLocalStorage('seriesPerPage', 25);
    const [sort, setSort] = useState('created_at');
    const [direction, setDirection] = useState<'asc' | 'desc'>('desc');

    const { data, isLoading, error } = useSeries({
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

    const handleRemoveFilter = (key: keyof SeriesFilters) => {
        setFilters(prev => {
            if (key === 'founded_at') {
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

    const handleClearAllFilters = () => {
        setFilters({
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
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleItemsPerPageChange = (count: number) => {
        setItemsPerPage(count);
        setPage(1);
    };

    const allSeriesImages = data?.data
        .filter(series => series.primary_photo)
        .map(series => ({
            src: series.primary_photo!,
            alt: series.name
        })) || [];

    return (
        <SeriesFilterContext.Provider value={{ filters, setFilters }}>
            <div className="min-h-screen bg-background pb-12">
                <div className="bg-muted/30 border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">Series</h1>
                                <p className="text-muted-foreground mt-1">
                                    Discover recurring events in Pittsburgh
                                </p>
                            </div>
                            {user && (
                                <Button asChild>
                                    <Link to="/series/create">Create Series</Link>
                                </Button>
                            )}
                        </div>

                        <FilterContainer
                            filtersVisible={filtersVisible}
                            onToggleFilters={toggleFilters}
                            hasActiveFilters={Object.values(filters).some(v =>
                                typeof v === 'object' ? (v.start || v.end) : v
                            )}
                            onClearAllFilters={handleClearAllFilters}
                        >
                            <SeriesFiltersComponent
                                filters={filters}
                                onFilterChange={setFilters}
                            />
                        </FilterContainer>

                        <ActiveFilters
                            filters={filters}
                            onRemoveFilter={handleRemoveFilter}
                        />
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex justify-end mb-6">
                        <SortControls
                            sortOptions={sortOptions}
                            sort={sort}
                            direction={direction}
                            setSort={setSort}
                            setDirection={setDirection}
                        />
                    </div>

                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertDescription>
                                Failed to load series. Please try again later.
                            </AlertDescription>
                        </Alert>
                    )}

                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {data?.data.map((series, index) => (
                                    <SeriesCard
                                        key={series.id}
                                        series={series}
                                        allImages={allSeriesImages}
                                        imageIndex={index}
                                    />
                                ))}
                            </div>

                            {data?.data.length === 0 && (
                                <Card className="bg-muted/50 border-dashed">
                                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                        <p className="text-lg font-medium text-muted-foreground">No series found</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Try adjusting your filters or search terms
                                        </p>
                                        <Button
                                            variant="link"
                                            onClick={handleClearAllFilters}
                                            className="mt-4"
                                        >
                                            Clear all filters
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}

                            {data && data.last_page > 1 && (
                                <div className="mt-8">
                                    <Pagination
                                        currentPage={page}
                                        totalPages={data.last_page}
                                        onPageChange={handlePageChange}
                                        itemsPerPage={itemsPerPage}
                                        onItemsPerPageChange={handleItemsPerPageChange}
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
        </SeriesFilterContext.Provider>
    );
}
