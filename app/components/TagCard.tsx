import { useNavigate } from 'react-router';
import type { Tag } from '~/types/api';
import { Card, CardContent } from '~/components/ui/card';
import { useTagImage } from '~/hooks/useTagImage';
import { useQuery, useMutation } from '@tanstack/react-query';
import { authService } from '~/services/auth.service';
import { api } from '~/lib/api';
import { Star } from 'lucide-react';
import { useState, useEffect } from 'react';

interface TagCardProps {
    tag: Tag;
}

export default function TagCard({ tag }: TagCardProps) {
    const navigate = useNavigate();
    const { url, alt } = useTagImage(tag.slug);
    const placeholder = '/event-placeholder.png';

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
            </div>
            <CardContent className="p-4 flex-grow">
                <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                    {tag.name}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                    {tag.description || 'No description available'}
                </p>
            </CardContent>
        </Card>
    );
}
