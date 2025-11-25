import { Link, useNavigate } from 'react-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '~/lib/api';
import { getEmbedCache, setEmbedCache, clearEmbedCache } from '~/lib/embedCache';
import type { Entity } from '~/types/api';
import { Card, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Loader2, ArrowLeft, MapPin, Music, Star, Pencil, Target, Trash2, MoreHorizontal, RefreshCw } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { sanitizeEmbed } from '~/lib/sanitize';
import PhotoGallery from '~/components/PhotoGallery';
import EntityEvents from '~/components/EntityEvents';
import { TagBadges } from '~/components/TagBadges';
import PhotoDropzone from '~/components/PhotoDropzone';
import { authService } from '~/services/auth.service';
import { EntityTypeIcon } from '~/components/EntityTypeIcon';
import { SocialLinks } from '~/components/SocialLinks';
import EntityLocations from '~/components/EntityLocations';
import EntityContacts from '~/components/EntityContacts';
import EntityLinks from '~/components/EntityLinks';
import { useMediaPlayerContext } from '~/hooks/useMediaPlayerContext';
import { useBackNavigation } from '~/context/NavigationContext';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '~/components/ui/dialog';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '~/components/ui/popover';

export default function EntityDetail({ entitySlug, initialEntity }: { entitySlug: string; initialEntity?: Entity }) {
    const navigate = useNavigate();
    const { mediaPlayersEnabled } = useMediaPlayerContext();
    const { backHref, isFallback } = useBackNavigation('/entities');
    const [embeds, setEmbeds] = useState<string[]>([]);
    const [embedsLoading, setEmbedsLoading] = useState(false);
    const [embedsError, setEmbedsError] = useState<Error | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
    const [imageOrientation, setImageOrientation] = useState<'landscape' | 'portrait' | null>(null);
    const [openSlideshowAtIndex, setOpenSlideshowAtIndex] = useState<number | null>(null);

    const { data: entity, isLoading, error, refetch } = useQuery<Entity>({
        queryKey: ['entity', entitySlug],
        queryFn: async () => {
            const { data } = await api.get<Entity>(`/entities/${entitySlug}`);
            return data;
        },
        // Seed from route loader to avoid duplicate network request
        initialData: initialEntity,
        // Consider the data fresh briefly to prevent immediate refetch on mount
        staleTime: 60_000,
    });

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: authService.getCurrentUser,
        enabled: authService.isAuthenticated(),
    });

    const [following, setFollowing] = useState(false);

    useEffect(() => {
        if (user && entity) {
            setFollowing(user.followed_entities.some(e => e.slug === entitySlug));
        }
    }, [user, entitySlug, entity]);

    const followMutation = useMutation({
        mutationFn: async () => {
            await api.post(`/entities/${entitySlug}/follow`);
        },
        onSuccess: () => {
            setFollowing(true);
        },
    });

    const unfollowMutation = useMutation({
        mutationFn: async () => {
            await api.post(`/entities/${entitySlug}/unfollow`);
        },
        onSuccess: () => {
            setFollowing(false);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            await api.delete(`/entities/${entitySlug}`);
        },
        onSuccess: () => {
            // Navigate back to entities list after successful deletion
            navigate('/entities');
        },
    });

    const fetchEmbeds = useCallback(async (forceRefresh = false) => {
        if (!entity) return;

        setEmbedsLoading(true);
        setEmbedsError(null);

        try {
            // Check cache first if not forcing refresh
            if (!forceRefresh) {
                const cached = getEmbedCache('entities', entity.slug, 'embeds');
                if (cached) {
                    setEmbeds(cached);
                    setEmbedsLoading(false);
                    return;
                }
            }

            const { data } = await api.get<{ embeds: string[] }>(`/entities/${entity.slug}/embeds`);
            const sanitizedEmbeds = data.embeds.map(sanitizeEmbed);
            setEmbeds(sanitizedEmbeds);
            setEmbedCache('entities', entity.slug, sanitizedEmbeds, 'embeds');
        } catch (err) {
            console.error('Failed to load embeds:', err);
            setEmbedsError(err as Error);
        } finally {
            setEmbedsLoading(false);
        }
    }, [entity]);

    useEffect(() => {
        if (entity && mediaPlayersEnabled) {
            fetchEmbeds();
        }
    }, [entity, mediaPlayersEnabled, fetchEmbeds]);

    // Determine image orientation
    useEffect(() => {
        if (entity?.primary_photo) {
            const img = new Image();
            img.onload = () => {
                setImageOrientation(img.width > img.height ? 'landscape' : 'portrait');
            };
            img.src = entity.primary_photo;
        }
    }, [entity?.primary_photo]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !entity) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-500">Error</h1>
                    <p className="text-muted-foreground">Failed to load entity details.</p>
                    <Button asChild className="mt-4">
                        <Link to="/entities">Back to Entities</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const canEdit = user?.id === entity.created_by || user?.role === 'admin';

    const allImages = [
        ...(entity.primary_photo ? [{ src: entity.primary_photo, alt: entity.name }] : []),
        ...(entity.images?.map(img => ({ src: img.path, alt: entity.name })) || [])
    ];

    return (
        <div className="min-h-screen bg-background pb-12">
            {/* Hero Section with Background Image */}
            <div className="relative h-[40vh] md:h-[50vh] w-full overflow-hidden bg-muted">
                {entity.primary_photo ? (
                    <>
                        <div
                            className="absolute inset-0 bg-cover bg-center blur-sm opacity-50 scale-110"
                            style={{ backgroundImage: `url(${entity.primary_photo})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                    </>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
                )}

                <div className="absolute inset-0 flex flex-col justify-between p-4 md:p-8 max-w-7xl mx-auto w-full">
                    {/* Top Bar */}
                    <div className="flex justify-between items-start">
                        <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="text-foreground/80 hover:text-foreground hover:bg-background/20 backdrop-blur-sm"
                        >
                            <Link to={backHref} className="flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                {isFallback ? 'Back to Entities' : 'Back'}
                            </Link>
                        </Button>

                        {canEdit && (
                            <div className="flex gap-2">
                                <Popover open={actionsMenuOpen} onOpenChange={setActionsMenuOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="secondary" size="icon" className="rounded-full">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-48 p-1" align="end">
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start gap-2"
                                            asChild
                                            onClick={() => setActionsMenuOpen(false)}
                                        >
                                            <Link to={`/entity/${entity.slug}/edit`}>
                                                <Pencil className="h-4 w-4" />
                                                Edit Entity
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                                            onClick={() => {
                                                setActionsMenuOpen(false);
                                                setDeleteDialogOpen(true);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete Entity
                                        </Button>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}
                    </div>

                    {/* Entity Info */}
                    <div className="flex flex-col md:flex-row gap-6 items-end md:items-center">
                        {/* Profile Image */}
                        <div className="relative shrink-0 group cursor-pointer" onClick={() => setOpenSlideshowAtIndex(0)}>
                            <div className="h-32 w-32 md:h-40 md:w-40 rounded-xl overflow-hidden border-4 border-background shadow-xl bg-muted">
                                {entity.primary_photo ? (
                                    <img
                                        src={entity.primary_photo}
                                        alt={entity.name}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-secondary/30">
                                        <EntityTypeIcon entityTypeName={entity.entity_type.name} className="h-16 w-16 text-muted-foreground/50" />
                                    </div>
                                )}
                            </div>
                            {canEdit && (
                                <div className="absolute -bottom-2 -right-2">
                                    <PhotoDropzone
                                        entityId={entity.id}
                                        onUploadSuccess={() => refetch()}
                                        trigger={
                                            <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-lg">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        }
                                    />
                                </div>
                            )}
                        </div>

                        {/* Text Info */}
                        <div className="flex-1 space-y-2 mb-2">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">
                                    {entity.name}
                                </h1>
                                <div className="flex gap-2">
                                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 backdrop-blur-md">
                                        {entity.entity_type.name}
                                    </span>
                                    {entity.roles && entity.roles.map(role => (
                                        <span key={role.id} className="px-3 py-1 rounded-full bg-secondary/50 text-secondary-foreground text-sm font-medium border border-secondary/50 backdrop-blur-md">
                                            {role.name}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                                {entity.locations && entity.locations.length > 0 && (
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="h-4 w-4" />
                                        <span>{entity.locations[0].city}, {entity.locations[0].state}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5">
                                    <Target className="h-4 w-4" />
                                    <span>{entity.entity_status.name}</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 mb-2">
                            {user && (
                                <Button
                                    variant={following ? "secondary" : "default"}
                                    onClick={() => following ? unfollowMutation.mutate() : followMutation.mutate()}
                                    disabled={followMutation.isPending || unfollowMutation.isPending}
                                    className="gap-2 shadow-lg"
                                >
                                    <Star className={`h-4 w-4 ${following ? "fill-current" : ""}`} />
                                    {following ? "Following" : "Follow"}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Description */}
                        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <div
                                    className="prose dark:prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{
                                        __html: entity.description || '<p class="text-muted-foreground italic">No description available.</p>'
                                    }}
                                />
                            </CardContent>
                        </Card>

                        {/* Media Player Section */}
                        {mediaPlayersEnabled && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        <Music className="h-6 w-6" />
                                        Media
                                    </h2>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => fetchEmbeds(true)}
                                        disabled={embedsLoading}
                                        className="gap-2"
                                    >
                                        <RefreshCw className={`h-4 w-4 ${embedsLoading ? 'animate-spin' : ''}`} />
                                        Refresh
                                    </Button>
                                </div>

                                {embedsLoading && embeds.length === 0 ? (
                                    <div className="flex justify-center p-8">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : embedsError ? (
                                    <div className="text-center p-8 text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg">
                                        <p>Failed to load media.</p>
                                        <Button variant="link" onClick={() => fetchEmbeds(true)}>Try Again</Button>
                                    </div>
                                ) : embeds.length > 0 ? (
                                    <div className="grid gap-4">
                                        {embeds.map((embed, i) => (
                                            <div
                                                key={i}
                                                className="aspect-video w-full overflow-hidden rounded-lg bg-muted shadow-sm"
                                                dangerouslySetInnerHTML={{ __html: embed }}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center p-8 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                                        No media found.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Events */}
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold">Events</h2>
                            <EntityEvents entityName={entity.name} />
                        </div>

                        {/* Photo Gallery */}
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold">Photos</h2>
                            <PhotoGallery
                                fetchUrl={`/entities/${entity.slug}/images`}
                                onPrimaryUpdate={() => refetch()}
                                openAtIndex={openSlideshowAtIndex}
                                onSlideshowClose={() => setOpenSlideshowAtIndex(null)}
                            />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Social Links */}
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="font-semibold mb-4">Connect</h3>
                                <SocialLinks
                                    facebookUsername={entity.facebook_username || undefined}
                                    twitterUsername={entity.twitter_username || undefined}
                                    instagramUsername={entity.instagram_username || undefined}
                                />
                            </CardContent>
                        </Card>

                        {/* Tags */}
                        {entity.tags && entity.tags.length > 0 && (
                            <Card>
                                <CardContent className="p-6">
                                    <h3 className="font-semibold mb-4">Tags</h3>
                                    <TagBadges tags={entity.tags} indexPath="/entities" />
                                </CardContent>
                            </Card>
                        )}

                        {/* Locations */}
                        <Card>
                            <CardContent className="p-6">
                                <EntityLocations
                                    entityId={entity.id}
                                    entitySlug={entity.slug}
                                    canEdit={canEdit}
                                />
                            </CardContent>
                        </Card>

                        {/* Contacts */}
                        <Card>
                            <CardContent className="p-6">
                                <EntityContacts
                                    entityId={entity.id}
                                    entitySlug={entity.slug}
                                    canEdit={canEdit}
                                />
                            </CardContent>
                        </Card>

                        {/* Links */}
                        <Card>
                            <CardContent className="p-6">
                                <EntityLinks
                                    entityId={entity.id}
                                    entitySlug={entity.slug}
                                    canEdit={canEdit}
                                />
                            </CardContent>
                        </Card>

                        {/* Metadata */}
                        <Card className="bg-muted/30">
                            <CardContent className="p-6 text-sm text-muted-foreground space-y-2">
                                <div className="flex justify-between">
                                    <span>Created</span>
                                    <span>{new Date(entity.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Followers</span>
                                    <span>{entity.followers_count || 0}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Entity</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{entity.name}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteMutation.mutate()}
                            disabled={deleteMutation.isPending}
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
