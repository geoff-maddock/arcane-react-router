import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("events", "routes/home.tsx", { id: "events-home" }),
    route("events/:slug", "routes/event-detail.tsx"),
    route("entities", "routes/entities.tsx"),
    route("entities/your", "routes/entities-your.tsx"),
    route("entities/:slug", "routes/entity-detail.tsx"),
    route("series", "routes/series.tsx"),
    route("series/:slug", "routes/series-detail.tsx"),
    route("tags", "routes/tags.tsx"),
    route("tags/:slug", "routes/tag-detail.tsx"),
    route("users", "routes/users.tsx"),
    route("users/:id", "routes/user-detail.tsx"),
    route("search", "routes/search.tsx"),
    route("radar", "routes/radar.tsx"),
    route("event-grid", "routes/event-grid.tsx"),
    route("calendar", "routes/calendar.tsx"),
    route("calendar/your", "routes/calendar-your.tsx"),
    route("about", "routes/about.tsx"),
    route("help", "routes/help.tsx"),
    route("privacy", "routes/privacy.tsx"),
    route("blogs", "routes/blogs.tsx"),
    route("login", "routes/login.tsx"),
    route("register", "routes/register.tsx"),
    route("register/success", "routes/register-success.tsx"),
    route("account", "routes/account.tsx")
] satisfies RouteConfig;
