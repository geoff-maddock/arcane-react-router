import { type MetaFunction, redirect } from "react-router";
import YourCalendar from "../components/YourCalendar";
import { authService } from "../services/auth.service";

export const clientLoader = async () => {
    if (!authService.isAuthenticated()) {
        throw redirect("/login?redirect=/calendar/your");
    }
    return null;
};

export const meta: MetaFunction = () => {
    return [
        { title: "Your Calendar • Arcane City" },
        { property: "og:title", content: "Your Calendar • Arcane City" },
        { property: "og:description", content: "A personalized calendar of events you're attending." },
        { name: "description", content: "A personalized calendar of events you're attending." },
    ];
};

export default function YourCalendarRoute() {
    return <YourCalendar />;
}
