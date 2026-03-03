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

  // 修补 recordMap 中结构不一致的条目。
  // Notion API 有时返回 { value: { value: {...}, role } } 而非 { value: {...}, role }，
  // 需要解包多余的嵌套层，否则 react-notion-x 取不到 id/type 等关键字段。
  patchTable = (table) => {
    if (!table || typeof table !== 'object') return table;
    const patched = {};
    for (const [key, entry] of Object.entries(table)) {
      if (!entry || !entry.value) {
        patched[key] = entry;
        continue;
      }
      // 检测多余嵌套：entry.value 含 value + role，真正数据在 entry.value.value
      if (entry.value.value && entry.value.role !== undefined && !entry.value.id) {
        patched[key] = {
          ...entry,
          value: entry.value.value,
          role: entry.value.role,
        };
      } else {
        patched[key] = entry;
      }
    }
    return patched;
  };

  patchRecordMap = (recordMap) => {
    if (!recordMap) return recordMap;
    const result = { ...recordMap };
    for (const tableName of ['block', 'collection', 'collection_view', 'collection_query']) {
      if (result[tableName]) {
        result[tableName] = this.patchTable(result[tableName]);
      }
    }
    return result;
  };

  render() {
    const { recordMap } = this.props;
    if (!recordMap) return null;

    const patchedRecordMap = this.patchRecordMap(recordMap);

    return (
      <div className={this.state.isDarkMode ? "dark-mode" : ""}>
        <NotionRenderer
          recordMap={patchedRecordMap}
          fullPage={true}
          components={{
            Code,
            Collection,
            Modal,
            nextLink: Link,
          }}
          mapImageUrl={this.mapImageUrl}
          mapPageUrl={(pageId) => `/${(pageId || '').replace(/-/g, "")}`}
        />
      </div>
    );
  }
}

export default MyNotionClassRenderer;
