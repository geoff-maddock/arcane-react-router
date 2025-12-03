import { redirect } from 'react-router';
import { authService } from '../services/auth.service';
import ActivityList from '../components/ActivityList';
// import type { Route } from './+types/activity';

export function meta({ }: any) {
    return [
        { title: "Activity" },
        { name: "description", content: "Recent activity across events, entities, and series." },
    ];
}

export async function clientLoader() {
    if (!authService.isAuthenticated()) {
        return redirect('/login?redirect=/activity');
    }
    return null;
}

export default function Activity() {
    return <ActivityList />;
}
