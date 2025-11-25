import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '~/lib/api';
import { authService } from '~/services/auth.service';
import type { Link as EntityLink } from '~/types/api';
import { Card, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Textarea } from '~/components/ui/textarea';
import { Switch } from '~/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '~/components/ui/dialog';
import { Link2 as LinkIcon, Pencil, Plus, Loader2, ExternalLink, Trash2 } from 'lucide-react';

interface ApiError {
    response?: {
        data?: {
            message?: string;
        };
    };
}

interface EntityLinksProps {
    entityId: number;
    entitySlug: string;
    canEdit: boolean;
}

export default function EntityLinks({ entityId, entitySlug, canEdit }: EntityLinksProps) {
    // Shared field classes to match Create Entity form contrast (light/dark)
    const fieldClasses = "bg-white border-slate-300 text-slate-900 placeholder-slate-500 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400 focus-visible:ring-0 focus:border-slate-500 focus:dark:border-slate-400";
    const { data, isLoading, error, refetch } = useQuery<EntityLink[]>({
        queryKey: ['entity', entitySlug, 'links'],
        queryFn: async () => {
            try {
                const response = await api.get<EntityLink[]>(`/entities/${entitySlug}/links`);
                return response.data || [];
            } catch (error) {
                console.error('Error fetching entity links:', error);
                return [];
            }
        },
    });

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: authService.getCurrentUser,
        enabled: authService.isAuthenticated(),
    });

    const [editing, setEditing] = useState<EntityLink | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [deleting, setDeleting] = useState<EntityLink | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [creating, setCreating] = useState<Partial<EntityLink>>({
        title: '',
        text: '',
        url: '',
        is_primary: false,
    });

    const updateMutation = useMutation({
        mutationFn: async (link: EntityLink) => {
            await api.put(`/entities/${entityId}/links/${link.id}`, link);
        },
        onSuccess: () => {
            refetch();
            setIsEditOpen(false);
        },
        onError: (error: ApiError) => {
            console.error('Error updating link:', error);
            if (error.response?.data?.message) {
                alert(`Error: ${error.response.data.message}`);
            } else {
                alert('Failed to update link. Please try again.');
            }
        },
    });

    const createMutation = useMutation({
        mutationFn: async (link: Partial<EntityLink>) => {
            await api.post(`/entities/${entityId}/links`, link);
        },
        onSuccess: () => {
            refetch();
            setIsCreateOpen(false);
            setCreating({ title: '', text: '', url: '', is_primary: false });
        },
        onError: (error: ApiError) => {
            console.error('Error creating link:', error);
            if (error.response?.data?.message) {
                alert(`Error: ${error.response.data.message}`);
            } else {
                alert('Failed to create link. Please try again.');
            }
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/entities/${entityId}/links/${id}`);
        },
        onSuccess: () => {
            refetch();
            setIsDeleteOpen(false);
        },
        onError: (error: ApiError) => {
            console.error('Error deleting link:', error);
            if (error.response?.data?.message) {
                alert(`Error: ${error.response.data.message}`);
            } else {
                alert('Failed to delete link. Please try again.');
            }
        },
    });

    const handleEdit = (link: EntityLink) => {
        setEditing(link);
        setIsEditOpen(true);
    };

    const handleDelete = (link: EntityLink) => {
        setDeleting(link);
        setIsDeleteOpen(true);
    };

    const handleCreate = () => {
        setIsCreateOpen(true);
    };

    if (isLoading) {
        return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    }

    if (error) {
        return <div className="text-red-500 p-4">Error loading links</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Links</h3>
                {canEdit && (
                    <Button onClick={handleCreate} size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Link
                    </Button>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {data?.map((link) => (
                    <Card key={link.id}>
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1 flex-1">
                                    <div className="font-medium flex items-center gap-2">
                                        <LinkIcon className="h-4 w-4 text-muted-foreground" />
                                        {link.title}
                                        {link.is_primary && (
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                Primary
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-muted-foreground pl-6">
                                        <a
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 hover:underline break-all"
                                        >
                                            {link.url}
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                        {link.text && <div className="mt-1">{link.text}</div>}
                                    </div>
                                </div>
                                {canEdit && (
                                    <div className="flex gap-2 ml-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(link)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-600"
                                            onClick={() => handleDelete(link)}
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
                        <DialogTitle>Edit Link</DialogTitle>
                    </DialogHeader>
                    {editing && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input
                                    value={editing.title}
                                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                                    className={fieldClasses}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>URL</Label>
                                <Input
                                    value={editing.url}
                                    onChange={(e) => setEditing({ ...editing, url: e.target.value })}
                                    className={fieldClasses}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description (Optional)</Label>
                                <Textarea
                                    value={editing.text || ''}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditing({ ...editing, text: e.target.value })}
                                    className={fieldClasses}
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={editing.is_primary}
                                    onCheckedChange={(checked) => setEditing({ ...editing, is_primary: checked })}
                                />
                                <Label>Primary Link</Label>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={() => editing && updateMutation.mutate(editing)}>
                            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Link</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                                value={creating.title || ''}
                                onChange={(e) => setCreating({ ...creating, title: e.target.value })}
                                className={fieldClasses}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>URL</Label>
                            <Input
                                value={creating.url || ''}
                                onChange={(e) => setCreating({ ...creating, url: e.target.value })}
                                className={fieldClasses}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description (Optional)</Label>
                            <Textarea
                                value={creating.text || ''}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCreating({ ...creating, text: e.target.value })}
                                className={fieldClasses}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={creating.is_primary}
                                onCheckedChange={(checked) => setCreating({ ...creating, is_primary: checked })}
                            />
                            <Label>Primary Link</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={() => createMutation.mutate(creating)}>
                            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Link
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Link</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{deleting?.title}"? This action cannot be undone.
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
