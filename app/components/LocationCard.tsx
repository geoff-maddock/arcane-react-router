import type { LocationResponse } from '~/types/api';
import { Card, CardHeader } from '~/components/ui/card';
import { MapPin } from 'lucide-react';
import { Link } from 'react-router';

interface LocationCardProps {
    location: LocationResponse;
}

export default function LocationCard({ location }: LocationCardProps) {
    return (
        <Card className="group overflow-hidden transition-all hover:shadow-md">
            <CardHeader className="p-4 pb-2">
                <div className="flex items-start">
                    <div className="mr-3 mt-1">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-semibold leading-tight text-foreground mb-2">
                            {location.name}
                        </h3>
                        {location.entity && (
                            <Link
                                to={`/entities/${location.entity.slug}`}
                                className="text-sm text-primary hover:underline font-medium mb-2 inline-block"
                            >
                                {location.entity.name}
                            </Link>
                        )}
                        <div className="space-y-1 text-sm text-muted-foreground">
                            {location.address_one && (
                                <p>{location.address_one}</p>
                            )}
                            {location.address_two && (
                                <p>{location.address_two}</p>
                            )}
                            {(location.city || location.state || location.postcode) && (
                                <p>
                                    {location.city}
                                    {location.state && <span>, {location.state}</span>}
                                    {location.postcode && <span> {location.postcode}</span>}
                                </p>
                            )}
                            {location.neighborhood && (
                                <p className="text-muted-foreground italic">{location.neighborhood}</p>
                            )}
                        </div>
                    </div>
                </div>
            </CardHeader>
        </Card>
    );
}
