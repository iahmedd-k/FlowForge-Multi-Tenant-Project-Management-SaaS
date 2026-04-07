import { useEffect } from "react";

const ensureMeta = (selector: string, attrs: Record<string, string>) => {
  let tag = document.head.querySelector(selector) as HTMLMetaElement | null;

  if (!tag) {
    tag = document.createElement("meta");
    Object.entries(attrs).forEach(([key, value]) => tag?.setAttribute(key, value));
    document.head.appendChild(tag);
  }

  return tag;
};

export default function usePageMeta(title: string, description: string) {
  useEffect(() => {
    document.title = title;

    const descriptionTag = ensureMeta('meta[name="description"]', { name: "description" });
    descriptionTag.setAttribute("content", description);

    const ogTitleTag = ensureMeta('meta[property="og:title"]', { property: "og:title" });
    ogTitleTag.setAttribute("content", title);

    const ogDescriptionTag = ensureMeta('meta[property="og:description"]', { property: "og:description" });
    ogDescriptionTag.setAttribute("content", description);
  }, [title, description]);
}
