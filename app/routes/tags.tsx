import { useState, useEffect } from 'react';
import { useTags } from '~/hooks/useTags';
import TagFilters from '~/components/TagFilters';
import { Pagination } from '~/components/Pagination';
import { Loader2, Plus } from 'lucide-react';
import { Card, CardContent } from '~/components/ui/card';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { useLocalStorage } from '~/hooks/useLocalStorage';
import { useFilterToggle } from '~/hooks/useFilterToggle';
import { TagFilterContext } from '~/context/TagFilterContext';
import type { TagFilters as TagFiltersType } from '~/hooks/useTags';
import TagCard from '~/components/TagCard';
import { FilterContainer } from '~/components/FilterContainer';
import { Button } from '~/components/ui/button';
import { useSearchParams, Link } from 'react-router';
import { authService } from '~/services/auth.service';
import { useQuery } from '@tanstack/react-query';
import PopularTags from '~/components/PopularTags';
import SortControls from '~/components/SortControls';
import type { Route } from "./+types/tags";
import { SITE_NAME, DEFAULT_IMAGE } from '~/lib/seo';

export function meta({ }: Route.MetaArgs) {
    return [
        { title: `Tags • ${SITE_NAME}` },
        { property: 'og:title', content: `Tags • ${SITE_NAME}` },
        { property: 'og:description', content: `Browse events by tag.` },
        { name: 'description', content: `Browse events by tag.` },
        { property: 'og:image', content: DEFAULT_IMAGE },
    ];
}

const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'created_at', label: 'Created' },
];

export default function Tags() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { filtersVisible, toggleFilters } = useFilterToggle();

    const [filters, setFilters] = useState<TagFiltersType>({
        name: searchParams.get('name') || '',
    });

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams();
        if (filters.name) params.set('name', filters.name);
        setSearchParams(params, { replace: true });
    }, [filters, setSearchParams]);

    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useLocalStorage('tagsPerPage', 25);
    const [sort, setSort] = useState('name');
    const [direction, setDirection] = useState<'asc' | 'desc'>('asc');

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: authService.getCurrentUser,
        enabled: authService.isAuthenticated(),
    });

    const { data, isLoading, error } = useTags({
        filters,
        page,
        itemsPerPage,
        sort,
        direction,
    });

    // Reset pagination when filters change
    useEffect(() => {
        setPage(1);
    }, [filters]);

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleItemsPerPageChange = (count: number) => {
        setItemsPerPage(count);
        setPage(1);
    };

    const renderPagination = () => {
        if (!data) return null;
        return (
            <Pagination
                currentPage={page}
                totalPages={data.last_page}
                onPageChange={handlePageChange}
                itemCount={data.data.length}
                totalItems={data.total}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={handleItemsPerPageChange}
                sort={sort}
                setSort={setSort}
                direction={direction}
                setDirection={setDirection}
                sortOptions={sortOptions}
            />
        );
    };

    const hasActiveFilters = filters.name?.trim() !== '';

    const handleClearAllFilters = () => {
        setFilters({ name: '' });
    };

    const handleResetFilters = () => {
        setFilters({ name: '' });
        setSort('name');
        setDirection('asc');
    };

    return (
        <TagFilterContext.Provider value={{ filters, setFilters }}>
            <div className="bg-background text-foreground min-h-screen md:p-4 p-2">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Popular Tags Section */}
                    <PopularTags />

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">All Tags</h1>
                            <p className="text-muted-foreground mt-1">
                                Browse all tags to find events that match your interests.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            {user && (
                                <Button asChild className="gap-2">
                                    <Link to="/tags/create">
                                        <Plus className="h-4 w-4" />
                                        Create Tag
                                    </Link>
                                </Button>
                            )}
                            <Button
                                variant={filtersVisible ? "secondary" : "outline"}
                                onClick={toggleFilters}
                                className="gap-2"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                                </svg>
                                Filters
                            </Button>
                            <SortControls
                                sort={sort}
                                setSort={setSort}
                                direction={direction}
                                setDirection={setDirection}
                                sortOptions={sortOptions}
                            />
                        </div>
                    </div>

                    <FilterContainer
                        filtersVisible={filtersVisible}
                        onToggleFilters={toggleFilters}
                        onClearAllFilters={handleClearAllFilters}
                        hasActiveFilters={hasActiveFilters}
                    >
                        <TagFilters
                            filters={filters}
                            onFilterChange={setFilters}
                        />
                    </FilterContainer>

                    {error ? (
                        <Alert variant="destructive">
                            <AlertDescription>
                                Failed to load tags. Please try again later.
                            </AlertDescription>
                        </Alert>
                    ) : isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {data?.data.map((tag) => (
                                    <TagCard key={tag.id} tag={tag} />
                                ))}
                            </div>

                            {data?.data.length === 0 && (
                                <Card className="bg-muted/50">
                                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                        <p className="text-lg font-medium text-muted-foreground">No tags found</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Try adjusting your filters or search terms
                                        </p>
                                        <Button
                                            variant="link"
                                            onClick={handleResetFilters}
                                            className="mt-4"
                                        >
                                            Clear all filters
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}

                            <div className="mt-8">
                                {renderPagination()}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </TagFilterContext.Provider>
    );
}
