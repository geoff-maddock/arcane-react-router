import { useNavigate } from 'react-router';
import type { Entity } from '~/types/api';
import { Card, CardContent } from '~/components/ui/card';
import { api } from '~/lib/api';
import { MapPin, Star, Target, Loader2 } from 'lucide-react';
import { TagBadges } from '~/components/TagBadges';
import { ImageLightbox } from '~/components/ImageLightbox';
import { EntityTypeIcon } from '~/components/EntityTypeIcon';
import { SocialLinks } from '~/components/SocialLinks';
import { useQuery, useMutation } from '@tanstack/react-query';
import { authService } from '~/services/auth.service';
import { useState, useEffect } from 'react';
import { useMinimalEmbeds } from '~/hooks/useMinimalEmbeds';
import { useMediaPlayerContext } from '~/hooks/useMediaPlayerContext';
import { sanitizeEmbed } from '~/lib/sanitize';


interface EntityCardProps {
    entity: Entity;
    allImages: Array<{ src: string; alt: string }>;
    imageIndex: number;
}

const EntityCard = ({ entity, allImages, imageIndex }: EntityCardProps) => {
    const navigate = useNavigate();
    const { mediaPlayersEnabled } = useMediaPlayerContext();
    const { embeds, loading: embedsLoading, error: embedsError } = useMinimalEmbeds({
        resourceType: 'entities',
        slug: entity.slug,
        enabled: mediaPlayersEnabled // Only fetch embeds when media players are enabled
    });
    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: authService.getCurrentUser,
        enabled: authService.isAuthenticated(),
    });

    const [following, setFollowing] = useState(false);

    useEffect(() => {
        if (user) {
            setFollowing(user.followed_entities.some(e => e.slug === entity.slug));
        }
    }, [user, entity.slug]);

    const followMutation = useMutation({
        mutationFn: async () => {
            await api.post(`/entities/${entity.slug}/follow`);
        },
        onSuccess: () => {
            setFollowing(true);
        },
    });

    const unfollowMutation = useMutation({
        mutationFn: async () => {
            await api.post(`/entities/${entity.slug}/unfollow`);
        },
        onSuccess: () => {
            setFollowing(false);
        },
    });

    const handleFollowToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (following) {
            unfollowMutation.mutate();
        } else {
            followMutation.mutate();
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        navigate(`/entities/${entity.slug}`);
    };

    const placeHolderImage = `${window.location.origin}/entity-placeholder.png`;

    return (
        <Card className="group overflow-hidden transition-all hover:shadow-md">
            {/* Move image outside padded content so it touches card edges like EventCard */}
            <div className="thumbnail">
                <ImageLightbox
                    thumbnailUrl={entity.primary_photo || placeHolderImage}
                    alt={entity.name}
                    allImages={allImages}
                    initialIndex={imageIndex}
                    containerClassName="cursor-pointer overflow-hidden rounded-t-lg"
                />
            </div>
            <CardContent className="p-6 space-y-4">
                <div className="space-y-3">

                    <div className="flex justify-between items-start">
                        <h2 className="text-xl font-bold">
                            <a
                                href={`/entities/${entity.slug}`}
                                onClick={handleClick}
                                className="hover:text-primary transition-colors line-clamp-1"
                                title={entity.name}
                            >
                                {entity.name}
                            </a>
                        </h2>
                        <div className="flex items-center gap-2 shrink-0">
                            {entity.entity_type && (
                                <div className="text-muted-foreground" title={entity.entity_type.name}>
                                    <EntityTypeIcon entityTypeName={entity.entity_type.name} />
                                </div>
                            )}
                            {user && (
                                <button
                                    onClick={handleFollowToggle}
                                    className="text-muted-foreground hover:text-yellow-500 transition-colors focus:outline-none"
                                    title={following ? "Unfollow" : "Follow"}
                                >
                                    <Star
                                        className={`h-5 w-5 ${following ? 'fill-yellow-500 text-yellow-500' : ''}`}
                                    />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                        {entity.roles && entity.roles.length > 0 && (
                            <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 shrink-0" />
                                <span className="line-clamp-1">
                                    {entity.roles.map(r => r.name).join(', ')}
                                </span>
                            </div>
                        )}

                        {entity.primary_location && (
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 shrink-0" />
                                <span className="line-clamp-1">
                                    {[
                                        entity.primary_location.city,
                                        entity.primary_location.state
                                    ].filter(Boolean).join(', ')}
                                </span>
                            </div>
                        )}
                    </div>

                    <TagBadges tags={entity.tags} max={3} />

                    <SocialLinks
                        facebookUsername={entity.facebook_username}
                        twitterUsername={entity.twitter_username}
                        instagramUsername={entity.instagram_username}
                        className="pt-2"
                    />

                    {/* Audio Embeds Section */}
                    {mediaPlayersEnabled && (
                        <div className="pt-2">
                            {embedsLoading && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    <span>Loading audio...</span>
                                </div>
                            )}

                            {embeds.length > 0 && !embedsLoading && (
                                <div className="space-y-2">
                                    {embeds.slice(0, 1).map((embed, index) => {
                                        const safe = sanitizeEmbed(embed);
                                        return (
                                            <div key={index} className="rounded-md overflow-hidden">
                                                <div
                                                    dangerouslySetInnerHTML={{ __html: safe }}
                                                    className="w-full"
                                                />
                                            </div>
                                        );
                                    })}
                                    {embeds.length > 1 && (
                                        <p className="text-xs text-muted-foreground text-center">
                                            +{embeds.length - 1} more audio track{embeds.length - 1 !== 1 ? 's' : ''} available
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default EntityCard;
