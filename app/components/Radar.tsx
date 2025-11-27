import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { authService } from '~/services/auth.service';
import { useUserAttendingEvents, useUserRecommendedEvents, useRecentEvents } from '~/hooks/useRadar';
import { Button } from '~/components/ui/button';
import { Calendar, Building, Tag, AlertCircle } from 'lucide-react';
import EventCard from '~/components/EventCard';

export default function Radar() {
    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: authService.getCurrentUser,
        enabled: authService.isAuthenticated(),
    });

    const { data: attendingEventsResponse, isLoading: loadingAttending } = useUserAttendingEvents();
    const { data: recommendedEvents, isLoading: loadingRecommended } = useUserRecommendedEvents();
    const { data: recentEventsResponse, isLoading: loadingRecent } = useRecentEvents(10);

    const recentEvents = recentEventsResponse?.data || [];
    const attendingEvents = attendingEventsResponse?.data || [];
    const hasAttendingEvents = attendingEvents && attendingEvents.length > 0;
    const hasFollowedContent = user && (
        (user.followed_entities && user.followed_entities.length > 0) ||
        (user.followed_tags && user.followed_tags.length > 0)
    );
    const hasRecommendedEvents = recommendedEvents && recommendedEvents.length > 0;

    const scrollToSection = useCallback((sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, []);

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
                    <p className="text-muted-foreground mb-4">
                        Please log in to view your radar.
                    </p>
                    <Button asChild>
                        <Link to="/login">Log In</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const attendingEventImages = attendingEvents.map(e => ({
        src: e.primary_photo || '',
        alt: e.name,
        thumbnail: e.primary_photo_thumbnail
    }));

    const recommendedEventImages = recommendedEvents?.map(e => ({
        src: e.primary_photo || '',
        alt: e.name,
        thumbnail: e.primary_photo_thumbnail
    })) || [];

    const recentEventImages = recentEvents.map(e => ({
        src: e.primary_photo || '',
        alt: e.name,
        thumbnail: e.primary_photo_thumbnail
    }));

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 max-w-[2400px]">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Your Radar</h1>
                <p className="text-muted-foreground">
                    Stay up to date with events and activities that matter to you
                </p>

                {/* Quick Links Navigation */}
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {hasAttendingEvents && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => scrollToSection('attending-events')}
                            className="flex items-center gap-1"
                        >
                            <Calendar className="h-4 w-4 text-blue-500" />
                            <span>Your Events</span>
                        </Button>
                    )}
                    {hasFollowedContent && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => scrollToSection('recommended-events')}
                            className="flex items-center gap-1"
                        >
                            <Tag className="h-4 w-4 text-green-500" />
                            <span>Recommended</span>
                        </Button>
                    )}
                    {!hasAttendingEvents && !hasFollowedContent && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => scrollToSection('get-started')}
                            className="flex items-center gap-1"
                        >
                            <Building className="h-4 w-4 text-purple-500" />
                            <span>Get Started</span>
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => scrollToSection('recent-events')}
                        className="flex items-center gap-1"
                    >
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Recent Events</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="flex items-center gap-1"
                    >
                        <Link to="/events">
                            <Calendar className="h-4 w-4 text-yellow-500" />
                            <span>All Events</span>
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Events You're Attending */}
            {hasAttendingEvents && (
                <section id="attending-events" className="bg-card rounded-lg shadow p-3 md:p-6 border border-border">
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                        <Calendar className="h-6 w-6 text-blue-500" />
                        Events You're Attending
                    </h2>
                    {loadingAttending ? (
                        <div className="text-center py-8 text-muted-foreground">Loading your events...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
                            {attendingEvents?.map((event, index) => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    allImages={attendingEventImages}
                                    imageIndex={index}
                                />
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* Recommended Events Based on Follows */}
            {hasFollowedContent && (
                <section id="recommended-events" className="bg-card rounded-lg shadow p-3 md:p-6 border border-border">
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                        <Tag className="h-6 w-6 text-green-500" />
                        Recommended for You
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                        Based on entities and tags you follow
                    </p>
                    {loadingRecommended ? (
                        <div className="text-center py-8 text-muted-foreground">Finding recommendations...</div>
                    ) : hasRecommendedEvents ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
                            {recommendedEvents?.map((event, index) => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    allImages={recommendedEventImages}
                                    imageIndex={index}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground mb-4">No recommendations found at this time.</p>
                            <p className="text-sm text-muted-foreground">
                                Check back later as new events are added!
                            </p>
                        </div>
                    )}
                </section>
            )}

            {/* Call to Action - shown when user has no activity */}
            {!hasAttendingEvents && !hasFollowedContent && (
                <section id="get-started" className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-lg shadow p-8 text-center border border-border">
                    <h2 className="text-2xl font-semibold mb-4">Get Started with Your Radar</h2>
                    <p className="text-muted-foreground mb-6">
                        Personalize your experience by attending events and following your favorite entities and tags
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button asChild className="flex items-center gap-2">
                            <Link to="/events">
                                <Calendar className="h-4 w-4" />
                                Browse Events
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="flex items-center gap-2">
                            <Link to="/entities">
                                <Building className="h-4 w-4" />
                                Follow Entities
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="flex items-center gap-2">
                            <Link to="/tags">
                                <Tag className="h-4 w-4" />
                                Follow Tags
                            </Link>
                        </Button>
                    </div>
                </section>
            )}

            {/* Recently Added Events */}
            <section id="recent-events" className="bg-card rounded-lg shadow p-3 md:p-6 border border-border">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-muted-foreground" />
                    Recently Added Events
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                    Discover the latest events added to Arcane City
                </p>
                {loadingRecent ? (
                    <div className="text-center py-8 text-muted-foreground">Loading recent events...</div>
                ) : recentEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
                        {recentEvents.map((event, index) => (
                            <EventCard
                                key={event.id}
                                event={event}
                                allImages={recentEventImages}
                                imageIndex={index}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">No recent events found.</p>
                    </div>
                )}
                <div className="mt-6 text-center">
                    <Button asChild variant="outline">
                        <Link to="/events">View All Events</Link>
                    </Button>
                </div>
            </section>
        </div>
    );
}
