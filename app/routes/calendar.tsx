import type { MetaFunction } from "react-router";
import Calendar from "../components/Calendar";

export const meta: MetaFunction = () => {
    return [
        { title: "Calendar • Arcane City" },
        { property: "og:title", content: "Calendar • Arcane City" },
        { property: "og:description", content: "A calendar of events happening in Pittsburgh." },
        { name: "description", content: "A calendar of events happening in Pittsburgh." },
    ];
};

export default function CalendarRoute() {
    return <Calendar />;
}
