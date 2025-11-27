import { useState } from 'react';
import { useEvents } from '~/hooks/useEvents';
import EventCard from '~/components/EventCard';
import { Pagination } from '~/components/Pagination';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '~/components/ui/card';
import { Alert, AlertDescription } from '~/components/ui/alert';

interface SeriesEventsProps {
    seriesName: string;
}

const sortOptions = [
    { value: 'start_at', label: 'Date' },
    { value: 'name', label: 'Name' },
    { value: 'venue_id', label: 'Venue' },
    { value: 'promoter_id', label: 'Promoter' },
    { value: 'event_type_id', label: 'Type' },
    { value: 'created_at', label: 'Created' },
];

export default function SeriesEvents({ seriesName }: SeriesEventsProps) {
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sort, setSort] = useState('start_at');
    const [direction, setDirection] = useState<'asc' | 'desc'>('desc');

    const { data, isLoading, error } = useEvents({
        filters: { series: seriesName },
        page,
        itemsPerPage,
        sort,
        direction,
    });

    const allEventImages =
        data?.data
            .filter((event) => event.primary_photo && event.primary_photo_thumbnail)
            .map((event) => ({
                src: event.primary_photo!,
                alt: event.name,
                thumbnail: event.primary_photo_thumbnail,
            })) ?? [];

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const handleItemsPerPageChange = (count: number) => {
        setItemsPerPage(count);
        setPage(1);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertDescription>Failed to load events.</AlertDescription>
            </Alert>
        );
    }

    if (!data || data.data.length === 0) {
        return (
            <Card className="bg-muted/50 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-lg font-medium text-muted-foreground">No events found for this series</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Events in this Series</h2>
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
            )}
        </div>
    );
}
