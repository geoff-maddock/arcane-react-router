import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router';
import { useEvents } from '~/hooks/useEvents';
import { useEntities } from '~/hooks/useEntities';
import { useSeries } from '~/hooks/useSeries';
import { useTags } from '~/hooks/useTags';
import { useLocations } from '~/hooks/useLocations';
import { Input } from '~/components/ui/input';
import { Switch } from '~/components/ui/switch';
import { Label } from '~/components/ui/label';
import { Button } from '~/components/ui/button';
import { Loader2 } from 'lucide-react';
import EventCard from '~/components/EventCard';
import EntityCard from '~/components/EntityCard';
import SeriesCard from '~/components/SeriesCard';
import TagCard from '~/components/TagCard';
import LocationCard from '~/components/LocationCard';
import type { Event, Entity, Series, Tag, LocationResponse } from '~/types/api';

interface ParsedQuery {
    name: string;
    createdBefore?: string;
    createdAfter?: string;
}

function parseSearchQuery(q: string): ParsedQuery {
    const tokens = q.split(/\s+/).filter(Boolean);
    const nameParts: string[] = [];
    let createdBefore: string | undefined;
    let createdAfter: string | undefined;

    tokens.forEach((t) => {
        const [key, val] = t.split(':');
        if (/^CreatedBefore$/i.test(key) && val) {
            createdBefore = val;
        } else if (/^CreatedAfter$/i.test(key) && val) {
            createdAfter = val;
        } else {
            nameParts.push(t);
        }
    });

    return { name: nameParts.join(' '), createdBefore, createdAfter };
}

export default function Search() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const q = searchParams.get('q') || '';
    const deep = searchParams.get('deep') === 'true';

    const [input, setInput] = useState(q);
    const [isDeep, setIsDeep] = useState(deep);
    const debounceTimerRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        setInput(q);
        setIsDeep(deep);
    }, [q, deep]);

    // Debounce user typing to auto-trigger search navigation
    useEffect(() => {
        if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = window.setTimeout(() => {
            const trimmed = input.trim();
            if (trimmed !== q || isDeep !== deep) {
                const newParams = new URLSearchParams();
                if (trimmed) newParams.set('q', trimmed);
                if (isDeep) newParams.set('deep', 'true');
                navigate(`/search?${newParams.toString()}`);
            }
        }, 400);
        return () => { if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current); };
    }, [input, isDeep, navigate, q, deep]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = input.trim();
        const newParams = new URLSearchParams();
        if (trimmed) newParams.set('q', trimmed);
        if (isDeep) newParams.set('deep', 'true');
        navigate(`/search?${newParams.toString()}`);
    };

    const { name, createdBefore, createdAfter } = parseSearchQuery(q);

    const dateFilter = createdBefore || createdAfter ? { start: createdAfter, end: createdBefore } : undefined;

    // Default: search name only. Deep: search description only (broader text field) without name duplication.
    const baseFilters = isDeep
        ? { description: name, created_at: dateFilter }
        : { name, created_at: dateFilter };

    // Pagination state
    const [eventPage, setEventPage] = useState(1);
    const [entityPage, setEntityPage] = useState(1);
    const [seriesPage, setSeriesPage] = useState(1);
    const [tagPage, setTagPage] = useState(1);
    const [locationPage, setLocationPage] = useState(1);

    // Accumulated results
    const [eventMap, setEventMap] = useState<Map<number, Event>>(new Map());
    const [entityResults, setEntityResults] = useState<Entity[]>([]);
    const [seriesResults, setSeriesResults] = useState<Series[]>([]);
    const [tagResults, setTagResults] = useState<Tag[]>([]);
    const [locationResults, setLocationResults] = useState<LocationResponse[]>([]);

    // Reset pagination & accumulators when query/deep changes
    useEffect(() => {
        setEventPage(1); setEntityPage(1); setSeriesPage(1); setTagPage(1); setLocationPage(1);
        setEventMap(new Map());
        setEntityResults([]); setSeriesResults([]); setTagResults([]); setLocationResults([]);
    }, [q, isDeep]);

    const { data: eventNameData, isLoading: eventNameLoading } = useEvents({ page: eventPage, itemsPerPage: 10, filters: baseFilters, sort: 'start_at', direction: 'desc' });
    const { data: eventTagData, isLoading: eventTagLoading } = useEvents({ page: eventPage, itemsPerPage: 10, filters: { tag: name, created_at: dateFilter }, sort: 'start_at', direction: 'desc' });
    const { data: eventEntityData, isLoading: eventEntityLoading } = useEvents({ page: eventPage, itemsPerPage: 10, filters: { entity: name, created_at: dateFilter }, sort: 'start_at', direction: 'desc' });
    const { data: entityData, isLoading: entityLoading } = useEntities({ page: entityPage, itemsPerPage: 10, filters: baseFilters, sort: 'created_at', direction: 'desc' });
    const { data: seriesData, isLoading: seriesLoading } = useSeries({ page: seriesPage, itemsPerPage: 10, filters: baseFilters, sort: 'created_at', direction: 'desc' });
    const { data: tagData, isLoading: tagLoading } = useTags({ page: tagPage, itemsPerPage: 10, filters: baseFilters, sort: 'created_at', direction: 'desc' });

    // Location search - search across name, address, neighborhood, and city
    const locationFilters = {
        search: name,
    };
    const { data: locationData, isLoading: locationLoading } = useLocations({ page: locationPage, itemsPerPage: 10, filters: locationFilters, sort: 'name', direction: 'asc' });

    // Accumulate event results (merged across three queries)
    useEffect(() => {
        setEventMap(prev => {
            const updated = new Map(prev);
            eventNameData?.data?.forEach(ev => updated.set(ev.id, ev));
            eventTagData?.data?.forEach(ev => updated.set(ev.id, ev));
            eventEntityData?.data?.forEach(ev => updated.set(ev.id, ev));
            return updated;
        });
    }, [eventNameData, eventTagData, eventEntityData]);

    // Accumulate other resource results, avoiding duplicates
    useEffect(() => {
        if (entityData?.data) {
            setEntityResults(prev => {
                const ids = new Set(prev.map(e => e.id));
                const merged = [...prev];
                entityData.data.forEach(e => { if (!ids.has(e.id)) merged.push(e); });
                return merged;
            });
        }
    }, [entityData]);

    useEffect(() => {
        if (seriesData?.data) {
            setSeriesResults(prev => {
                const ids = new Set(prev.map(s => s.id));
                const merged = [...prev];
                seriesData.data.forEach(s => { if (!ids.has(s.id)) merged.push(s); });
                return merged;
            });
        }
    }, [seriesData]);

    useEffect(() => {
        if (tagData?.data) {
            setTagResults(prev => {
                const ids = new Set(prev.map(t => t.id));
                const merged = [...prev];
                tagData.data.forEach(t => { if (!ids.has(t.id)) merged.push(t); });
                return merged;
            });
        }
    }, [tagData]);

    useEffect(() => {
        if (locationData?.data) {
            setLocationResults(prev => {
                const ids = new Set(prev.map(l => l.id));
                const merged = [...prev];
                locationData.data.forEach(l => { if (!ids.has(l.id)) merged.push(l); });
                return merged;
            });
        }
    }, [locationData]);

    const events = useMemo(() => Array.from(eventMap.values()), [eventMap]);

    const allEventImages = events
        .filter(ev => ev.primary_photo && ev.primary_photo_thumbnail)
        .map(ev => ({ src: ev.primary_photo!, alt: ev.name, thumbnail: ev.primary_photo_thumbnail })) ?? [];

    const allEntityImages = entityResults
        .filter(en => en.primary_photo && en.primary_photo_thumbnail)
        .map(en => ({ src: en.primary_photo!, alt: en.name, thumbnail: en.primary_photo_thumbnail })) ?? [];

    const allSeriesImages = seriesResults
        .filter(se => se.primary_photo && se.primary_photo_thumbnail)
        .map(se => ({ src: se.primary_photo!, alt: se.name, thumbnail: se.primary_photo_thumbnail })) ?? [];

    const eventCount = events.length;
    const entityCount = entityResults.length;
    const seriesCount = seriesResults.length;
    const tagCount = tagResults.length;
    const locationCount = locationResults.length;

    const hasMoreEvents = (eventNameData?.last_page ?? 1) > eventPage || (eventTagData?.last_page ?? 1) > eventPage || (eventEntityData?.last_page ?? 1) > eventPage;
    const hasMoreEntities = (entityData?.last_page ?? 1) > entityPage;
    const hasMoreSeries = (seriesData?.last_page ?? 1) > seriesPage;
    const hasMoreTags = (tagData?.last_page ?? 1) > tagPage;
    const hasMoreLocations = (locationData?.last_page ?? 1) > locationPage;

    const isLoading = eventNameLoading || eventTagLoading || eventEntityLoading || entityLoading || seriesLoading || tagLoading || locationLoading;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="mx-auto px-6 py-8 max-w-[2400px]">
                <div className="space-y-8">
                    <div className="flex flex-col space-y-2">
                        <h1 className="text-4xl font-bold tracking-tight">Search</h1>
                        <p className="text-lg text-muted-foreground">Search across events, entities, series, tags, and locations</p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
                        <div className="flex-1 w-full">
                            <Label htmlFor="search-input" className="sr-only">Search</Label>
                            <Input
                                id="search-input"
                                placeholder="Search..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="deep-search"
                                checked={isDeep}
                                onCheckedChange={setIsDeep}
                            />
                            <Label htmlFor="deep-search">Deep Search</Label>
                        </div>
                    </form>

                    <div className="space-y-12">
                        {/* Events Section */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-semibold">Events ({eventCount})</h2>
                            </div>
                            {events.length > 0 ? (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {events.map((event, idx) => (
                                        <EventCard
                                            key={event.id}
                                            event={event}
                                            allImages={allEventImages}
                                            imageIndex={idx}
                                        />
                                    ))}
                                </div>
                            ) : (
                                !isLoading && <p className="text-muted-foreground">No events found.</p>
                            )}
                            {hasMoreEvents && (
                                <div className="mt-6 text-center">
                                    <Button onClick={() => setEventPage(p => p + 1)} variant="outline">
                                        Load More Events
                                    </Button>
                                </div>
                            )}
                        </section>

                        {/* Entities Section */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-semibold">Entities ({entityCount})</h2>
                            </div>
                            {entityResults.length > 0 ? (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {entityResults.map((entity, idx) => (
                                        <EntityCard
                                            key={entity.id}
                                            entity={entity}
                                            allImages={allEntityImages}
                                            imageIndex={idx}
                                        />
                                    ))}
                                </div>
                            ) : (
                                !isLoading && <p className="text-muted-foreground">No entities found.</p>
                            )}
                            {hasMoreEntities && (
                                <div className="mt-6 text-center">
                                    <Button onClick={() => setEntityPage(p => p + 1)} variant="outline">
                                        Load More Entities
                                    </Button>
                                </div>
                            )}
                        </section>

                        {/* Series Section */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-semibold">Series ({seriesCount})</h2>
                            </div>
                            {seriesResults.length > 0 ? (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {seriesResults.map((series, idx) => (
                                        <SeriesCard
                                            key={series.id}
                                            series={series}
                                            allImages={allSeriesImages}
                                            imageIndex={idx}
                                        />
                                    ))}
                                </div>
                            ) : (
                                !isLoading && <p className="text-muted-foreground">No series found.</p>
                            )}
                            {hasMoreSeries && (
                                <div className="mt-6 text-center">
                                    <Button onClick={() => setSeriesPage(p => p + 1)} variant="outline">
                                        Load More Series
                                    </Button>
                                </div>
                            )}
                        </section>

                        {/* Tags Section */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-semibold">Tags ({tagCount})</h2>
                            </div>
                            {tagResults.length > 0 ? (
                                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                                    {tagResults.map((tag) => (
                                        <TagCard key={tag.id} tag={tag} />
                                    ))}
                                </div>
                            ) : (
                                !isLoading && <p className="text-muted-foreground">No tags found.</p>
                            )}
                            {hasMoreTags && (
                                <div className="mt-6 text-center">
                                    <Button onClick={() => setTagPage(p => p + 1)} variant="outline">
                                        Load More Tags
                                    </Button>
                                </div>
                            )}
                        </section>

                        {/* Locations Section */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-semibold">Locations ({locationCount})</h2>
                            </div>
                            {locationResults.length > 0 ? (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {locationResults.map((location) => (
                                        <LocationCard key={location.id} location={location} />
                                    ))}
                                </div>
                            ) : (
                                !isLoading && <p className="text-muted-foreground">No locations found.</p>
                            )}
                            {hasMoreLocations && (
                                <div className="mt-6 text-center">
                                    <Button onClick={() => setLocationPage(p => p + 1)} variant="outline">
                                        Load More Locations
                                    </Button>
                                </div>
                            )}
                        </section>
                    </div>

                    {isLoading && (
                        <div className="fixed bottom-8 right-8 bg-background/80 backdrop-blur-sm p-3 rounded-full shadow-lg border border-border">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
