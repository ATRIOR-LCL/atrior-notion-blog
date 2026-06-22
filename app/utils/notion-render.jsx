"use client";

import React from "react";
import Link from "next/link";
import {
  NotionRenderer,
  PageIcon,
  Search,
  useNotionContext,
} from "react-notion-x";

import { Code } from "react-notion-x/build/third-party/code";
import { Collection } from "react-notion-x/build/third-party/collection";
import { Modal } from "react-notion-x/build/third-party/modal";
import {
  getBreadcrumbHref,
  getNotionPathBreadcrumbs,
  getPagePath,
} from "./notion-paths";

const cx = (...classes) => classes.filter(Boolean).join(" ");

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

function NotionBreadcrumbs({ block }) {
  const { recordMap } = useNotionContext();
  const breadcrumbs = React.useMemo(
    () => getNotionPathBreadcrumbs(recordMap, block?.id),
    [recordMap, block?.id]
  );

  return (
    <div className="breadcrumbs">
      {breadcrumbs.map((breadcrumb, index) => {
        const href = getBreadcrumbHref(recordMap, breadcrumb);
        const content = (
          <>
            {breadcrumb.type === "page" && (
              <PageIcon
                className="icon"
                block={breadcrumb.block}
                hideDefaultIcon
              />
            )}
            {breadcrumb.title && (
              <span className="title">{breadcrumb.title}</span>
            )}
          </>
        );

        return (
          <React.Fragment key={`${breadcrumb.type}-${breadcrumb.pageId || breadcrumb.collectionId}`}>
            {href ? (
              <PrefetchLink className="breadcrumb" href={href}>
                {content}
              </PrefetchLink>
            ) : (
              <div className={cx("breadcrumb", breadcrumb.active && "active")}>
                {content}
              </div>
            )}
            {index < breadcrumbs.length - 1 && (
              <span className="spacer">/</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function NotionHeader({ block }) {
  return (
    <header className="notion-header">
      <div className="notion-nav-header">
        <NotionBreadcrumbs block={block} />
        <Search block={block} />
      </div>
    </header>
  );
}

const notionComponents = {
  Code,
  Collection,
  Modal,
  Header: NotionHeader,
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
  const mapPageUrl = React.useCallback(
    (pageId) => getPagePath(recordMap, pageId),
    [recordMap]
  );

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
