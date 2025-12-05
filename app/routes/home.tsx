import { useState, useEffect } from 'react';
import { useEvents } from '../hooks/useEvents';
import EventCard from '../components/EventCard';
import EventFilter from '../components/EventFilters';
import { Pagination } from '../components/Pagination';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useFilterToggle } from '../hooks/useFilterToggle';
import { EventFilterContext } from '../context/EventFilterContext';
import { type EventFilters } from '../types/filters';
import { ActiveEventFilters as ActiveFilters } from '../components/ActiveEventFilters';
import { FilterContainer } from '../components/FilterContainer';
import { Button } from '@/components/ui/button';
import { Link, useSearchParams } from 'react-router';
import { authService } from '../services/auth.service';
import { useQuery } from '@tanstack/react-query';
import type { Route } from "./+types/home";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Events • Arcane City" },
    { name: "description", content: "Discover and explore upcoming events in Pittsburgh." },
  ];
}

const sortOptions = [
  { value: 'start_at', label: 'Date' },
  { value: 'name', label: 'Name' },
  { value: 'venue_id', label: 'Venue' },
  { value: 'promoter_id', label: 'Promoter' },
  { value: 'event_type_id', label: 'Type' },
  { value: 'created_at', label: 'Created' }
];

export default function Events() {
  const { filtersVisible, toggleFilters } = useFilterToggle();
  const [searchParams] = useSearchParams();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authService.getCurrentUser,
    enabled: authService.isAuthenticated(),
  });


  // Helper to get start of today
  const getTodayStart = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString();
  };

  const [filters, setFilters] = useState<EventFilters>({
    name: '',
    venue: '',
    promoter: '',
    event_type: '',
    entity: '',
    tag: '',
    start_at: {
      start: getTodayStart(),
      end: undefined
    },
    presale_price_min: '',
    presale_price_max: '',
    door_price_min: '',
    door_price_max: '',
    min_age: '',
    is_benefit: undefined
  });

  useEffect(() => {
    const tag = searchParams.get('tag');
    const entity = searchParams.get('entity');
    if (tag) {
      setFilters(prev => ({ ...prev, tag }));
    }
    if (entity) {
      setFilters(prev => ({ ...prev, entity }));
    }
  }, [searchParams]);

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useLocalStorage('eventsPerPage', 25);
  const [sort, setSort] = useState('start_at');
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc');

  const { data, isLoading, error } = useEvents({
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

  const handleRemoveFilter = (key: keyof EventFilters) => {
    setFilters(prev => {
      if (key === 'start_at') {
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
      event_type: '',
      entity: '',
      tag: '',
      start_at: {
        start: undefined,
        end: undefined
      }
    });
  };

  const handleResetFilters = () => {
    setFilters({
      name: '',
      venue: '',
      promoter: '',
      event_type: '',
      entity: '',
      tag: '',
      start_at: {
        start: getTodayStart(),
        end: undefined
      },
      presale_price_min: '',
      presale_price_max: '',
      door_price_min: '',
      door_price_max: '',
      min_age: '',
      is_benefit: undefined
    });
    setSort('start_at');
    setDirection('asc');
  };

  // Create array of all event images
  const allEventImages = data?.data
    .filter(event => event.primary_photo && event.primary_photo_thumbnail)
    .map(event => ({
      src: event.primary_photo!,
      alt: event.name,
      thumbnail: event.primary_photo_thumbnail
    })) ?? [];

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleItemsPerPageChange = (count: number) => {
    setItemsPerPage(count);
    setPage(1); // Reset to first page when changing items per page
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

  // Check if any filters are active
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'created_at') {
      return value?.start || value?.end;
    }
    return value !== '';
  });


  return (
    <EventFilterContext.Provider value={{ filters, setFilters }}>
      <div className="bg-background text-foreground min-h-screen m:p-4 p-2">
        <div className="mx-auto md:px-6 md:py-8 px-3 py-4 max-w-[2400px]">
          <div className="space-y-8">
            <div className="flex flex-col space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">
                Event Listings
              </h1>
              <p className="text-lg text-gray-500">
                Discover and explore upcoming events.
              </p>
              {user && (
                <Button asChild className="self-start">
                  <Link to="/event/create">Create Event</Link>
                </Button>
              )}
            </div>

            <FilterContainer
              filtersVisible={filtersVisible}
              onToggleFilters={toggleFilters}
              hasActiveFilters={hasActiveFilters}
              onClearAllFilters={handleClearAllFilters}
              onResetFilters={handleResetFilters}
              activeFiltersComponent={
                <ActiveFilters
                  filters={filters}
                  onRemoveFilter={handleRemoveFilter}
                />
              }
            >
              <EventFilter filters={filters} onFilterChange={setFilters} />
            </FilterContainer>

            {error ? (
              <Alert variant="destructive">
                <AlertDescription>
                  There was an error loading events. Please try again later.
                </AlertDescription>
              </Alert>
            ) : isLoading ? (
              <div className="flex h-96 items-center justify-center" role="status">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : data?.data && data.data.length > 0 ? (
              <>
                {renderPagination()}

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-4">
                  {data.data.map((event) => (
                    <EventCard
                      key={event.slug}
                      event={event}
                      allImages={allEventImages}
                      imageIndex={allEventImages.findIndex(
                        img => img.src === event.primary_photo
                      )}
                    />
                  ))}
                </div>

                {renderPagination()}
              </>
            ) : (
              <Card className="border-gray-100">
                <CardContent className="flex h-96 items-center justify-center text-gray-500">
                  No events found. Try adjusting your filters.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </EventFilterContext.Provider >
  );
}
