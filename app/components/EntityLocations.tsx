import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '~/lib/api';
import type { Location } from '~/types/api';
import { Card, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { useSlug } from '~/hooks/useSlug';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '~/components/ui/dialog';
import { MapPin, Pencil, Trash2, Loader2, Plus } from 'lucide-react';

interface ApiError {
    response?: {
        data?: {
            message?: string;
        };
    };
}

interface EntityLocationsProps {
    entityId: number;
    entitySlug: string;
    canEdit: boolean;
}

export default function EntityLocations({ entityId, entitySlug, canEdit }: EntityLocationsProps) {
    // Shared field classes to match Create Entity form contrast (light/dark)
    const fieldClasses = "bg-white border-slate-300 text-slate-900 placeholder-slate-500 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400 focus-visible:ring-0 focus:border-slate-500 focus:dark:border-slate-400";
    const { data, isLoading, error, refetch } = useQuery<Location[]>({
        queryKey: ['entity', entitySlug, 'locations'],
        queryFn: async () => {
            try {
                const response = await api.get<Location[]>(`/entities/${entitySlug}/locations`);
                return response.data || [];
            } catch (error) {
                console.error('Error fetching entity locations:', error);
                return [];
            }
        },
    });

    const [editing, setEditing] = useState<Location | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [deleting, setDeleting] = useState<Location | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [creating, setCreating] = useState<Partial<Location>>({
        name: '',
        slug: '',
        address_one: '',
        address_two: '',
        neighborhood: '',
        city: '',
        state: '',
        postcode: '',
        country: '',
        map_url: '',
        latitude: 0,
        longitude: 0,
        visibility_id: 1,
        location_type_id: 1
    });

    // Use same slug behavior as Entity Create: auto-generate from name until user edits slug
    const {
        name: createName,
        slug: createSlug,
        setName: setCreateName,
        setSlug: setCreateSlug,
        initialize: initializeCreateSlug,
        manuallyOverridden: slugOverridden,
    } = useSlug('', '');

    // Reset the slug hook whenever the create dialog is opened fresh
    useEffect(() => {
        if (isCreateOpen) {
            initializeCreateSlug('', '');
        }
    }, [isCreateOpen, initializeCreateSlug]);

    const saveMutation = useMutation({
        mutationFn: async (loc: Location) => {
            await api.put(`/entities/${entityId}/locations/${loc.id}`, loc);
        },
        onSuccess: () => {
            refetch();
            setIsEditOpen(false);
        },
        onError: (error: ApiError) => {
            console.error('Error updating location:', error);
            // Show user-friendly error message
            if (error.response?.data?.message) {
                alert(`Error: ${error.response.data.message}`);
            } else {
                alert('Failed to update location. Please try again.');
            }
        },
    });

    const createMutation = useMutation({
        mutationFn: async (loc: Partial<Location>) => {
            await api.post(`/entities/${entityId}/locations`, loc);
        },
        onSuccess: () => {
            refetch();
            setIsCreateOpen(false);
            setCreating({
                name: '',
                slug: '',
                address_one: '',
                address_two: '',
                neighborhood: '',
                city: '',
                state: '',
                postcode: '',
                country: '',
                map_url: '',
                latitude: 0,
                longitude: 0,
                visibility_id: 1,
                location_type_id: 1
            });
        },
        onError: (error: ApiError) => {
            console.error('Error creating location:', error);
            if (error.response?.data?.message) {
                alert(`Error: ${error.response.data.message}`);
            } else {
                alert('Failed to create location. Please try again.');
            }
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/entities/${entityId}/locations/${id}`);
        },
        onSuccess: () => {
            refetch();
            setIsDeleteOpen(false);
        },
        onError: (error: ApiError) => {
            console.error('Error deleting location:', error);
            if (error.response?.data?.message) {
                alert(`Error: ${error.response.data.message}`);
            } else {
                alert('Failed to delete location. Please try again.');
            }
        },
    });

    const handleEdit = (location: Location) => {
        setEditing(location);
        setIsEditOpen(true);
    };

    const handleDelete = (location: Location) => {
        setDeleting(location);
        setIsDeleteOpen(true);
    };

    const handleCreate = () => {
        setIsCreateOpen(true);
    };

    if (isLoading) {
        return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    }

    if (error) {
        return <div className="text-red-500 p-4">Error loading locations</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Locations</h3>
                {canEdit && (
                    <Button onClick={handleCreate} size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Location
                    </Button>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {data?.map((location) => (
                    <Card key={location.id}>
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="font-medium flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        {location.name}
                                    </div>
                                    <div className="text-sm text-muted-foreground pl-6">
                                        {location.address_one && <div>{location.address_one}</div>}
                                        {location.address_two && <div>{location.address_two}</div>}
                                        <div>
                                            {[location.city, location.state, location.postcode]
                                                .filter(Boolean)
                                                .join(', ')}
                                        </div>
                                    </div>
                                </div>
                                {canEdit && (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(location)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-600"
                                            onClick={() => handleDelete(location)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Location</DialogTitle>
                    </DialogHeader>
                    {editing && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input
                                    value={editing.name}
                                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                                    className={fieldClasses}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Address Line 1</Label>
                                <Input
                                    value={editing.address_one || ''}
                                    onChange={(e) => setEditing({ ...editing, address_one: e.target.value })}
                                    className={fieldClasses}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Address Line 2</Label>
                                <Input
                                    value={editing.address_two || ''}
                                    onChange={(e) => setEditing({ ...editing, address_two: e.target.value })}
                                    className={fieldClasses}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>City</Label>
                                    <Input
                                        value={editing.city || ''}
                                        onChange={(e) => setEditing({ ...editing, city: e.target.value })}
                                        className={fieldClasses}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>State</Label>
                                    <Input
                                        value={editing.state || ''}
                                        onChange={(e) => setEditing({ ...editing, state: e.target.value })}
                                        className={fieldClasses}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Postcode</Label>
                                    <Input
                                        value={editing.postcode || ''}
                                        onChange={(e) => setEditing({ ...editing, postcode: e.target.value })}
                                        className={fieldClasses}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Country</Label>
                                    <Input
                                        value={editing.country || ''}
                                        onChange={(e) => setEditing({ ...editing, country: e.target.value })}
                                        className={fieldClasses}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={() => editing && saveMutation.mutate(editing)}>
                            {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Location</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                                value={createName}
                                onChange={(e) => setCreateName(e.target.value)}
                                className={fieldClasses}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Slug</Label>
                            <Input
                                value={createSlug}
                                onChange={(e) => setCreateSlug(e.target.value)}
                                className={fieldClasses}
                            />
                            <p className="text-xs text-muted-foreground">
                                URL-friendly version of the name. Auto-generated unless manually edited.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Address Line 1</Label>
                            <Input
                                value={creating.address_one || ''}
                                onChange={(e) => setCreating({ ...creating, address_one: e.target.value })}
                                className={fieldClasses}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Address Line 2</Label>
                            <Input
                                value={creating.address_two || ''}
                                onChange={(e) => setCreating({ ...creating, address_two: e.target.value })}
                                className={fieldClasses}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>City</Label>
                                <Input
                                    value={creating.city || ''}
                                    onChange={(e) => setCreating({ ...creating, city: e.target.value })}
                                    className={fieldClasses}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>State</Label>
                                <Input
                                    value={creating.state || ''}
                                    onChange={(e) => setCreating({ ...creating, state: e.target.value })}
                                    className={fieldClasses}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Postcode</Label>
                                <Input
                                    value={creating.postcode || ''}
                                    onChange={(e) => setCreating({ ...creating, postcode: e.target.value })}
                                    className={fieldClasses}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Country</Label>
                                <Input
                                    value={creating.country || ''}
                                    onChange={(e) => setCreating({ ...creating, country: e.target.value })}
                                    className={fieldClasses}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={() => createMutation.mutate({ ...creating, name: createName, slug: createSlug })}>
                            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Location
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Location</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{deleting?.name}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleting && deleteMutation.mutate(deleting.id)}
                        >
                            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
