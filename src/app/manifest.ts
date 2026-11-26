import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The First Pour · Ethiopian Coffee by Hanan Tarq",
    short_name: "First Pour",
    description: "Launch invitation — December 5, 2026, Friendship Park, Phase Two, Addis Ababa.",
    start_url: "/",
    display: "standalone",
    background_color: "#e9f0f3",
    theme_color: "#24385c",
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
