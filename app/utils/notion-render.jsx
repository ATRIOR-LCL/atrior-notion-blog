"use client";

import React from "react";
import Link from "next/link";
import { NotionRenderer } from "react-notion-x";

import { Code } from "react-notion-x/build/third-party/code";
import { Collection } from "react-notion-x/build/third-party/collection";
import { Modal } from "react-notion-x/build/third-party/modal";

const mapPageUrl = (pageId) => `/${(pageId || "").replace(/-/g, "")}`;

const mapCachedNotionImageUrl = (url, block) => {
  const blockId = block?.id;
  if (!blockId) return url;

  const table = block?.type === "collection" ? "collection" : "block";
  const params = new URLSearchParams({
    src: url,
    id: blockId,
    table,
  });

  return `/api/notion-image?${params.toString()}`;
};

const mapImageUrl = (url, block) => {
  if (!url) return null;
  if (url.startsWith("data:")) return url;

  if (url.startsWith("/images/")) {
    return mapCachedNotionImageUrl(url, block);
  }

  if (
    url.startsWith("attachment:") ||
    url.includes("secure.notion-static.com") ||
    url.includes("amazonaws.com") ||
    url.includes("notionusercontent.com")
  ) {
    return mapCachedNotionImageUrl(url, block);
  }

  return url;
};

const PrefetchLink = React.forwardRef(function PrefetchLink(
  { prefetch = true, ...props },
  ref
) {
  return <Link ref={ref} prefetch={prefetch} {...props} />;
});

const notionComponents = {
  Code,
  Collection,
  Modal,
  nextLink: PrefetchLink,
};

const subscribeToColorScheme = (onStoreChange) => {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
};

const getClientColorSchemeSnapshot = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const getServerColorSchemeSnapshot = () => false;

function usePrefersDarkMode() {
  return React.useSyncExternalStore(
    subscribeToColorScheme,
    getClientColorSchemeSnapshot,
    getServerColorSchemeSnapshot
  );
}

export default function NotionPageRenderer({ recordMap }) {
  const isDarkMode = usePrefersDarkMode();

  if (!recordMap) return null;

  return (
    <NotionRenderer
      recordMap={recordMap}
      fullPage={true}
      darkMode={isDarkMode}
      components={notionComponents}
      mapImageUrl={mapImageUrl}
      mapPageUrl={mapPageUrl}
    />
  );
}
