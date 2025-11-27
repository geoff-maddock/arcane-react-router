import { Link } from 'react-router';
import type { User } from '~/types/auth';
import { Card, CardContent } from '~/components/ui/card';

interface UserCardProps {
    user: User;
}

export default function UserCard({ user }: UserCardProps) {
    // Use a generic placeholder if no photo is available
    const placeholder = '/user-placeholder.jpg';
    // Note: In a real app, ensure this asset exists or use a better fallback
    const photo = user.photos && user.photos.length > 0 ? user.photos[0].thumbnail_path : null;

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex flex-col items-center space-y-2">
                <div className="h-24 w-full bg-gray-200 rounded overflow-hidden">
                    <img
                        src={photo || placeholder}
                        alt={user.name}
                        className="h-24 w-full object-cover"
                        onError={(e) => {
                            e.currentTarget.src = placeholder;
                        }}
                    />
                </div>
                <h2 className="text-lg font-semibold text-center">
                    <Link to={`/users/${user.id}`} className="hover:text-primary transition-colors">
                        {user.name}
                    </Link>
                </h2>
                {user.profile?.setting_public_profile ? (
                    <p className="text-sm text-gray-600">{user.email}</p>
                ) : null}
            </CardContent>
        </Card>
    );
}
