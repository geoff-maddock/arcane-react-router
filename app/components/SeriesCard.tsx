import { Link, useNavigate } from 'react-router';
import type { Series } from '~/types/api';
import { Card, CardHeader } from '~/components/ui/card';
import { EntityBadges } from '~/components/EntityBadges';
import { TagBadges } from '~/components/TagBadges';
import { ImageLightbox } from '~/components/ImageLightbox';
import { useContext, useState, useEffect } from 'react';
import { SeriesFilterContext } from '~/context/SeriesFilterContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { authService } from '~/services/auth.service';
import { api } from '~/lib/api';

interface SeriesCardProps {
    series: Series;
    allImages: Array<{ src: string; alt: string }>;
    imageIndex: number;
}

export default function SeriesCard({ series, allImages, imageIndex }: SeriesCardProps) {
    const navigate = useNavigate();
    const { setFilters } = useContext(SeriesFilterContext);
    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: authService.getCurrentUser,
        enabled: authService.isAuthenticated(),
    });

    const [following, setFollowing] = useState(false);

    useEffect(() => {
        if (user && user.followed_series) {
            setFollowing(user.followed_series.some(s => s.slug === series.slug));
        }
    }, [user, series.slug]);

    const followMutation = useMutation({
        mutationFn: async () => {
            await api.post(`/series/${series.slug}/follow`);
        },
        onSuccess: () => {
            setFollowing(true);
        },
    });

    const unfollowMutation = useMutation({
        mutationFn: async () => {
            await api.post(`/series/${series.slug}/unfollow`);
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

    const handleTagClick = (tagName: string) => {
        setFilters((prevFilters) => ({ ...prevFilters, tag: tagName }));
    };

    const handleEntityClick = (entityName: string) => {
        setFilters((prevFilters) => ({ ...prevFilters, entity: entityName }));
    };

    const placeHolderImage = '/event-placeholder.png';

    return (
        <Card className="group overflow-hidden transition-all hover:shadow-md event-card">
            <div className="top-row">

                <div className="thumbnail">
                    <ImageLightbox
                        thumbnailUrl={series.primary_photo || placeHolderImage}
                        alt={series.name}
                        allImages={allImages}
                        initialIndex={imageIndex}
                    />
                </div>

                <div className="title-description">
                    <CardHeader className="p-4 pb-2">
                        <div className="space-y-2">
                            <div className="flex justify-between items-start gap-2">
                                <Link
                                    to={`/series/${series.slug}`}
                                    className="font-bold text-xl hover:text-primary transition-colors line-clamp-2"
                                >
                                    {series.name}
                                </Link>
                            </div>

                            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                {series.event_type && (
                                    <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                                        {series.event_type.name}
                                    </span>
                                )}
                                {series.occurrence_type && (
                                    <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                                        {series.occurrence_type.name}
                                    </span>
                                )}
                            </div>
                        </div>
                    </CardHeader>

                    <div className="px-4 pb-4 space-y-3">
                        <div
                            className="text-sm text-muted-foreground line-clamp-3"
                            dangerouslySetInnerHTML={{ __html: series.description || '' }}
                        />

                        <div className="space-y-2">
                            <EntityBadges
                                entities={series.entities || []}
                                onClick={handleEntityClick}
                            />

                            <TagBadges
                                tags={series.tags || []}
                                onClick={handleTagClick}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
