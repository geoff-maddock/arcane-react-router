import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Search, MapPin, Users } from 'lucide-react';
import type { EntityFilters } from '~/types/filters';

interface EntityFiltersProps {
    filters: EntityFilters;
    onFilterChange: (filters: EntityFilters) => void;
}

export default function EntityFilters({ filters, onFilterChange }: EntityFiltersProps) {
    return (
        <div className="space-y-4">
            <div className="grid gap-6 md:grid-cols-4 2xl:grid-cols-5">
                <div className="space-y-2">
                    <Label htmlFor="name">Entity Name</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            id="name"
                            placeholder="Search entities..."
                            className="pl-9"
                            value={filters.name}
                            onChange={(e) => onFilterChange({ ...filters, name: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="entity_type">Type</Label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            id="entity_type"
                            placeholder="Filter by entity type..."
                            className="pl-9"
                            value={filters.entity_type}
                            onChange={(e) => onFilterChange({ ...filters, entity_type: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            id="role"
                            placeholder="Filter by role..."
                            className="pl-9"
                            value={filters.role}
                            onChange={(e) => onFilterChange({ ...filters, role: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="tag">Tag</Label>
                    <div className="relative">
                        <Users className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            id="tag"
                            placeholder="Filter by tag..."
                            className="pl-9"
                            value={filters.tag}
                            onChange={(e) => onFilterChange({ ...filters, tag: e.target.value })}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
