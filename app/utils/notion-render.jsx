"use client";
import React from "react";
import { NotionRenderer } from "react-notion-x";
import Link from "next/link";

import { Code } from "react-notion-x/build/third-party/code";
import { Collection } from "react-notion-x/build/third-party/collection";
import { Modal } from "react-notion-x/build/third-party/modal";

class MyNotionClassRenderer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isDarkMode: false,
      darkModeMediaQuery: null,
    };
  }

  componentDidMount() {
    this.darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    this.setState({ isDarkMode: this.darkModeMediaQuery.matches });
    this.darkModeMediaQuery.addEventListener("change", this.handleThemeChange);
  }

  componentWillUnmount() {
    if (this.darkModeMediaQuery) {
      this.darkModeMediaQuery.removeEventListener(
        "change",
        this.handleThemeChange
      );
    }
  }

  handleThemeChange = (e) => {
    this.setState({ isDarkMode: e.matches });
  };

  mapImageUrl = (url, block) => {
    if (!url) return null;
    if (url.startsWith("data:")) return url;

    if (url.startsWith("/images/")) {
      return `https://www.notion.so${url}`;
    }

    if (
      url.startsWith("attachment:") ||
      url.includes("secure.notion-static.com") ||
      url.includes("amazonaws.com") ||
      url.includes("notionusercontent.com")
    ) {
      try {
        const table = block.type === "collection" ? "collection" : "block";
        const blockId = block.id;

        return `https://www.notion.so/image/${encodeURIComponent(
          url
        )}?table=${table}&id=${blockId}&cache=v2`;
      } catch (e) {
        return url;
      }
    }
    return url;
  };

  render() {
    const { recordMap } = this.props;
    if (!recordMap) return null;

    return (
      <div className={this.state.isDarkMode ? "dark-mode" : ""}>
        <NotionRenderer
          recordMap={recordMap}
          fullPage={true}
          components={{
            Code,
            Collection,
            Modal,
            nextLink: Link,
          }}
          mapImageUrl={this.mapImageUrl}
          mapPageUrl={(pageId) => `/${pageId.replace(/-/g, "")}`}
        />
      </div>
    );
  }
}

export default MyNotionClassRenderer;
