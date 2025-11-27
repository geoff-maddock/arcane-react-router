import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Calendar as Search, MapPin, Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { useSearchOptions } from '~/hooks/useSearchOptions';
import type { SeriesFilters as SeriesFiltersType } from '~/types/filters';

interface SeriesFiltersProps {
    filters: SeriesFiltersType;
    onFilterChange: (filters: SeriesFiltersType) => void;
}

export default function SeriesFilters({ filters, onFilterChange }: SeriesFiltersProps) {
    // Cached, alphabetized event types for the series type filter
    const { data: eventTypeOptions, isLoading: loadingTypes } = useSearchOptions('event-types', '', {}, { limit: '100', sort: 'name', direction: 'asc' });
    // Cached, alphabetized occurrence lookups
    const { data: occurrenceTypeOptions, isLoading: loadingOccTypes } = useSearchOptions('occurrence-types', '', {}, { limit: '100', sort: 'id', direction: 'asc' });
    const { data: occurrenceWeekOptions, isLoading: loadingOccWeeks } = useSearchOptions('occurrence-weeks', '', {}, { limit: '100', sort: 'id', direction: 'asc' });
    const { data: occurrenceDayOptions, isLoading: loadingOccDays } = useSearchOptions('occurrence-days', '', {}, { limit: '100', sort: 'id', direction: 'asc' });

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-6 ">
                <div className="space-y-2">
                    <Label htmlFor="name">Series Name</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            id="name"
                            placeholder="Search series..."
                            className="pl-9"
                            value={filters.name}
                            onChange={(e) => onFilterChange({ ...filters, name: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="venue">Venue</Label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            id="venue"
                            placeholder="Filter by venue..."
                            className="pl-9"
                            value={filters.venue}
                            onChange={(e) => onFilterChange({ ...filters, venue: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="promoter">Promoter</Label>
                    <div className="relative">
                        <Users className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            id="promoter"
                            placeholder="Filter by promoter..."
                            className="pl-9"
                            value={filters.promoter}
                            onChange={(e) => onFilterChange({ ...filters, promoter: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="event_type">Type</Label>
                    <Select
                        value={filters.event_type || ''}
                        onValueChange={(value) =>
                            onFilterChange({ ...filters, event_type: value === '__ALL__' ? '' : value })
                        }
                        disabled={loadingTypes}
                    >
                        <SelectTrigger id="event_type" aria-label="Filter by event type">
                            <SelectValue placeholder={loadingTypes ? 'Loading types...' : 'All types'} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__ALL__">All types</SelectItem>
                            {eventTypeOptions?.map((opt) => (
                                <SelectItem key={opt.id} value={opt.name}>
                                    {opt.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="occurrence_type">Frequency</Label>
                    <Select
                        value={filters.occurrence_type || ''}
                        onValueChange={(value) =>
                            onFilterChange({ ...filters, occurrence_type: value === '__ALL__' ? '' : value })
                        }
                        disabled={loadingOccTypes}
                    >
                        <SelectTrigger id="occurrence_type" aria-label="Filter by frequency">
                            <SelectValue placeholder={loadingOccTypes ? 'Loading...' : 'All frequencies'} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__ALL__">All frequencies</SelectItem>
                            {occurrenceTypeOptions?.map((opt) => (
                                <SelectItem key={opt.id} value={opt.name}>
                                    {opt.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="occurrence_day">Day</Label>
                    <Select
                        value={filters.occurrence_day || ''}
                        onValueChange={(value) =>
                            onFilterChange({ ...filters, occurrence_day: value === '__ALL__' ? '' : value })
                        }
                        disabled={loadingOccDays}
                    >
                        <SelectTrigger id="occurrence_day" aria-label="Filter by day">
                            <SelectValue placeholder={loadingOccDays ? 'Loading...' : 'All days'} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__ALL__">All days</SelectItem>
                            {occurrenceDayOptions?.map((opt) => (
                                <SelectItem key={opt.id} value={opt.name}>
                                    {opt.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
