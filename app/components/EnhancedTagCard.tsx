import { useNavigate } from 'react-router';
import type { Tag } from '~/types/api';
import { Card, CardContent } from '~/components/ui/card';
import { useTagImage } from '~/hooks/useTagImage';
import { useTagUpcomingEvents } from '~/hooks/useTagUpcomingEvents';
import { useQuery, useMutation } from '@tanstack/react-query';
import { authService } from '~/services/auth.service';
import { api } from '~/lib/api';
import { Star, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatDate } from '~/lib/utils';

interface EnhancedTagCardProps {
    tag: Tag;
}

export default function EnhancedTagCard({ tag }: EnhancedTagCardProps) {
    const navigate = useNavigate();
    const { url, alt } = useTagImage(tag.slug);
    const placeholder = '/event-placeholder.png';

    // Fetch upcoming events for this tag
    const { data: upcomingEvents = [] } = useTagUpcomingEvents({
        tagSlug: tag.slug,
        limit: 4
    });

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: authService.getCurrentUser,
        enabled: authService.isAuthenticated(),
    });

    const [following, setFollowing] = useState(false);

    useEffect(() => {
        if (user && user.followed_tags) {
            setFollowing(user.followed_tags.some(t => t.slug === tag.slug));
        }
    }, [user, tag.slug]);

    const followMutation = useMutation({
        mutationFn: async () => {
            await api.post(`/tags/${tag.slug}/follow`);
        },
        onSuccess: () => {
            setFollowing(true);
        },
    });

    const unfollowMutation = useMutation({
        mutationFn: async () => {
            await api.post(`/tags/${tag.slug}/unfollow`);
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

    return (
        <Card
            className="overflow-hidden cursor-pointer hover:shadow-md transition-all group h-full flex flex-col"
            onClick={() => navigate(`/tags/${tag.slug}`)}
        >
            <div className="aspect-video w-full overflow-hidden bg-muted relative">
                <img
                    src={url || placeholder}
                    alt={alt || tag.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {user && (
                    <button
                        onClick={handleFollowToggle}
                        className="absolute top-2 right-2 p-2 rounded-full bg-background/80 hover:bg-background transition-colors z-10"
                    >
                        <Star
                            className={`h-4 w-4 ${following ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                        />
                    </button>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
                    <h3 className="font-bold text-xl text-white group-hover:text-primary-foreground transition-colors">
                        {tag.name}
                    </h3>
                </div>
            </div>
            <CardContent className="p-4 flex-grow flex flex-col gap-4">
                {upcomingEvents.length > 0 ? (
                    <div className="space-y-2">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Upcoming Events
                        </div>
                        <ul className="space-y-2">
                            {upcomingEvents.map(event => (
                                <li key={event.id} className="text-sm truncate hover:text-primary transition-colors">
                                    <span className="font-medium">{formatDate(event.start_at).split(',')[0]}</span>
                                    <span className="mx-1 text-muted-foreground">•</span>
                                    {event.name}
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground italic">No upcoming events</p>
                )}
            </CardContent>
        </Card>
    );
}
