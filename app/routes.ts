import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("events", "routes/home.tsx", { id: "events-home" }),
    route("events/:slug", "routes/event-detail.tsx"),
    route("entities", "routes/entities.tsx"),
    route("entities/:slug", "routes/entity-detail.tsx")
] satisfies RouteConfig;
