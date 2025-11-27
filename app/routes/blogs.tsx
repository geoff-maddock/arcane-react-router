import type { MetaFunction } from "react-router";
import Blogs from "../components/Blogs";

export const meta: MetaFunction = () => {
    return [
        { title: "Blogs • Arcane City" },
        { property: "og:title", content: "Blogs • Arcane City" },
        { property: "og:description", content: "Read the latest updates and articles from Arcane City." },
        { name: "description", content: "Read the latest updates and articles from Arcane City." },
    ];
};

export default function BlogsRoute() {
    return <Blogs />;
}
