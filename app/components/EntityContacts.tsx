import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '~/lib/api';
import type { Contact } from '~/types/api';
import { Card, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '~/components/ui/dialog';
import { User, Pencil, Trash2, Loader2, Mail, Phone, Plus } from 'lucide-react';

interface ApiError {
    response?: {
        data?: {
            message?: string;
        };
    };
}

interface EntityContactsProps {
    entityId: number;
    entitySlug: string;
    canEdit: boolean;
}

export default function EntityContacts({ entityId, entitySlug, canEdit }: EntityContactsProps) {
    // Shared field classes to match Create Entity form contrast (light/dark)
    const fieldClasses = "bg-white border-slate-300 text-slate-900 placeholder-slate-500 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400 focus-visible:ring-0 focus:border-slate-500 focus:dark:border-slate-400";
    const { data, isLoading, error, refetch } = useQuery<Contact[]>({
        queryKey: ['entity', entitySlug, 'contacts'],
        queryFn: async () => {
            try {
                const response = await api.get<Contact[]>(`/entities/${entitySlug}/contacts`);
                return response.data || [];
            } catch (error) {
                console.error('Error fetching entity contacts:', error);
                return [];
            }
        },
    });

    const [editing, setEditing] = useState<Contact | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [deleting, setDeleting] = useState<Contact | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [creating, setCreating] = useState<Partial<Contact>>({
        name: '',
        email: '',
        phone: '',
        other: '',
        type: 'general',
        visibility_id: 1
    });

    const saveMutation = useMutation({
        mutationFn: async (contact: Contact) => {
            await api.put(`/entities/${entityId}/contacts/${contact.id}`, contact);
        },
        onSuccess: () => {
            refetch();
            setIsEditOpen(false);
        },
        onError: (error: ApiError) => {
            console.error('Error updating contact:', error);
            // Show user-friendly error message
            if (error.response?.data?.message) {
                alert(`Error: ${error.response.data.message}`);
            } else {
                alert('Failed to update contact. Please try again.');
            }
        },
    });

    const createMutation = useMutation({
        mutationFn: async (contact: Partial<Contact>) => {
            await api.post(`/entities/${entityId}/contacts`, contact);
        },
        onSuccess: () => {
            refetch();
            setIsCreateOpen(false);
            // Reset the creating state
            setCreating({
                name: '',
                email: '',
                phone: '',
                other: '',
                type: 'general',
                visibility_id: 1
            });
        },
        onError: (error: ApiError) => {
            console.error('Error creating contact:', error);
            if (error.response?.data?.message) {
                alert(`Error: ${error.response.data.message}`);
            } else {
                alert('Failed to create contact. Please try again.');
            }
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/entities/${entityId}/contacts/${id}`);
        },
        onSuccess: () => {
            refetch();
            setIsDeleteOpen(false);
        },
        onError: (error: ApiError) => {
            console.error('Error deleting contact:', error);
            if (error.response?.data?.message) {
                alert(`Error: ${error.response.data.message}`);
            } else {
                alert('Failed to delete contact. Please try again.');
            }
        },
    });

    const handleEdit = (contact: Contact) => {
        setEditing(contact);
        setIsEditOpen(true);
    };

    const handleDelete = (contact: Contact) => {
        setDeleting(contact);
        setIsDeleteOpen(true);
    };

    const handleCreate = () => {
        setIsCreateOpen(true);
    };

    if (isLoading) {
        return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    }

    if (error) {
        return <div className="text-red-500 p-4">Error loading contacts</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Contacts</h3>
                {canEdit && (
                    <Button onClick={handleCreate} size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Contact
                    </Button>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {data?.map((contact) => (
                    <Card key={contact.id}>
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="font-medium flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        {contact.name}
                                        <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-secondary-foreground">
                                            {contact.type}
                                        </span>
                                    </div>
                                    <div className="text-sm text-muted-foreground pl-6 space-y-1">
                                        {contact.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-3 w-3" />
                                                <a href={`mailto:${contact.email}`} className="hover:underline">
                                                    {contact.email}
                                                </a>
                                            </div>
                                        )}
                                        {contact.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-3 w-3" />
                                                <a href={`tel:${contact.phone}`} className="hover:underline">
                                                    {contact.phone}
                                                </a>
                                            </div>
                                        )}
                                        {contact.other && <div>{contact.other}</div>}
                                    </div>
                                </div>
                                {canEdit && (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(contact)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-600"
                                            onClick={() => handleDelete(contact)}
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
                        <DialogTitle>Edit Contact</DialogTitle>
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
                                <Label>Type</Label>
                                <Select
                                    value={editing.type}
                                    onValueChange={(value) => setEditing({ ...editing, type: value })}
                                >
                                    <SelectTrigger className={fieldClasses}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="general">General</SelectItem>
                                        <SelectItem value="booking">Booking</SelectItem>
                                        <SelectItem value="press">Press</SelectItem>
                                        <SelectItem value="management">Management</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    value={editing.email || ''}
                                    onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                                    className={fieldClasses}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input
                                    value={editing.phone || ''}
                                    onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                                    className={fieldClasses}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Other Info</Label>
                                <Input
                                    value={editing.other || ''}
                                    onChange={(e) => setEditing({ ...editing, other: e.target.value })}
                                    className={fieldClasses}
                                />
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
                        <DialogTitle>Add Contact</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                                value={creating.name || ''}
                                onChange={(e) => setCreating({ ...creating, name: e.target.value })}
                                className={fieldClasses}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select
                                value={creating.type}
                                onValueChange={(value) => setCreating({ ...creating, type: value })}
                            >
                                <SelectTrigger className={fieldClasses}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="general">General</SelectItem>
                                    <SelectItem value="booking">Booking</SelectItem>
                                    <SelectItem value="press">Press</SelectItem>
                                    <SelectItem value="management">Management</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                value={creating.email || ''}
                                onChange={(e) => setCreating({ ...creating, email: e.target.value })}
                                className={fieldClasses}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input
                                value={creating.phone || ''}
                                onChange={(e) => setCreating({ ...creating, phone: e.target.value })}
                                className={fieldClasses}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Other Info</Label>
                            <Input
                                value={creating.other || ''}
                                onChange={(e) => setCreating({ ...creating, other: e.target.value })}
                                className={fieldClasses}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={() => createMutation.mutate(creating)}>
                            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Contact
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Contact</DialogTitle>
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
