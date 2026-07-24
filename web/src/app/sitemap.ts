import type { MetadataRoute } from "next";
import projects from "@/content/projects.json";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/about", "/projects", "/contact", "/faq"].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
  }));
  const projectRoutes = projects.map((p) => ({
    url: `${BASE}/projects/${p.slug}`,
    lastModified: new Date(),
  }));
  return [...staticRoutes, ...projectRoutes];
}
