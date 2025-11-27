import type { MetaFunction } from "react-router";
import EventGridLayout from "../components/EventGridLayout";

export const meta: MetaFunction = () => {
    return [
        { title: "Event Grid • Arcane City" },
        { property: "og:title", content: "Event Grid • Arcane City" },
        { property: "og:description", content: "A compact grid view of events in Pittsburgh." },
        { name: "description", content: "A compact grid view of events in Pittsburgh." },
    ];
};

export default function EventGridRoute() {
    return <EventGridLayout />;
}
