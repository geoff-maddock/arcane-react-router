import { Button } from "~/components/ui/button";
import { X } from "lucide-react";
import type { SeriesFilters } from '~/types/filters';

interface ActiveSeriesFiltersProps {
    filters: SeriesFilters;
    onRemoveFilter: (key: keyof SeriesFilters) => void;
}

export function ActiveSeriesFilters({ filters, onRemoveFilter }: ActiveSeriesFiltersProps) {
    const getActiveFilters = () => {
        const activeFilters = [];

        if (filters.name) {
            activeFilters.push({ key: 'name', label: `Name: ${filters.name}` });
        }

        if (filters.venue) {
            activeFilters.push({ key: 'venue', label: `Venue: ${filters.venue}` });
        }

        if (filters.promoter) {
            activeFilters.push({ key: 'promoter', label: `Promoter: ${filters.promoter}` });
        }

        if (filters.entity) {
            activeFilters.push({ key: 'entity', label: `Entity: ${filters.entity}` });
        }

        if (filters.event_type) {
            activeFilters.push({ key: 'event_type', label: `Type: ${filters.event_type}` });
        }

        if (filters.tag) {
            activeFilters.push({ key: 'tag', label: `Tag: ${filters.tag}` });
        }

        if (filters.occurrence_type) {
            activeFilters.push({ key: 'occurrence_type', label: `Occurrence Type: ${filters.occurrence_type}` });
        }

        if (filters.occurrence_week) {
            activeFilters.push({ key: 'occurrence_week', label: `Occurrence Week: ${filters.occurrence_week}` });
        }

        if (filters.occurrence_day) {
            activeFilters.push({ key: 'occurrence_day', label: `Occurrence Day: ${filters.occurrence_day}` });
        }

        if (filters.founded_at && (filters.founded_at.start || filters.founded_at.end)) {
            let label = 'Founded: ';
            if (filters.founded_at.start && filters.founded_at.end) {
                label += `${new Date(filters.founded_at.start).toLocaleDateString()} - ${new Date(filters.founded_at.end).toLocaleDateString()}`;
            } else if (filters.founded_at.start) {
                label += `After ${new Date(filters.founded_at.start).toLocaleDateString()}`;
            } else if (filters.founded_at.end) {
                label += `Before ${new Date(filters.founded_at.end).toLocaleDateString()}`;
            }
            activeFilters.push({ key: 'founded_at', label });
        }

        return activeFilters;
    };

    const active = getActiveFilters();

    if (active.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 mb-4">
            {active.map((filter) => (
                <Button
                    key={filter.key}
                    variant="secondary"
                    size="sm"
                    onClick={() => onRemoveFilter(filter.key as keyof SeriesFilters)}
                    className="h-7 text-xs"
                >
                    {filter.label}
                    <X className="ml-2 h-3 w-3" />
                </Button>
            ))}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => active.forEach(f => onRemoveFilter(f.key as keyof SeriesFilters))}
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
                Clear all
            </Button>
        </div>
    );
}
