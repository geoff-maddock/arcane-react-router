import { useState } from 'react';
import { useEvents } from '~/hooks/useEvents';
import EventCard from '~/components/EventCard';
import { Pagination } from '~/components/Pagination';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '~/components/ui/card';
import { Alert, AlertDescription } from '~/components/ui/alert';

interface EntityEventsProps {
    entityName: string;
}

const sortOptions = [
    { value: 'start_at', label: 'Date' },
    { value: 'name', label: 'Name' },
    { value: 'venue_id', label: 'Venue' },
    { value: 'promoter_id', label: 'Promoter' },
    { value: 'event_type_id', label: 'Type' },
    { value: 'created_at', label: 'Created' },
];

export default function EntityEvents({ entityName }: EntityEventsProps) {
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sort, setSort] = useState('start_at');
    const [direction, setDirection] = useState<'asc' | 'desc'>('desc');

    const { data, isLoading, error } = useEvents({
        filters: { entity: entityName },
        page,
        itemsPerPage,
        sort,
        direction,
    });

    const allEventImages =
        data?.data
            .filter((event) => event.primary_photo)
            .map((event) => ({
                src: event.primary_photo!,
                alt: event.name,
            })) ?? [];

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleItemsPerPageChange = (count: number) => {
        setItemsPerPage(count);
        setPage(1);
    };

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertDescription>
                    There was an error loading events. Please try again later.
                </AlertDescription>
            </Alert>
        );
    }

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center" role="status">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!data || data.data.length === 0) {
        return (
            <Card className="border-gray-100">
                <CardContent className="flex h-96 items-center justify-center text-gray-500">
                    No events found.
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.data.map((event, index) => (
                    <EventCard
                        key={event.id}
                        event={event}
                        allImages={allEventImages}
                        imageIndex={index}
                    />
                ))}
            </div>

            {data.last_page > 1 && (
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
            )}
        </div>
    );
}
