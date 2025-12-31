"use client"

import React from 'react'
import { NotionRenderer } from 'react-notion-x'
import Link from 'next/link'

import { Code } from 'react-notion-x/build/third-party/code'
import { Collection } from 'react-notion-x/build/third-party/collection'
import { Modal } from 'react-notion-x/build/third-party/modal'

class MyNotionClassRenderer extends React.Component {
  
  mapImageUrl = (url, block) => {
    if (!url) return null
    if (url.startsWith('data:')) return url

    // 1. 如果是 Notion 内部相对路径图标
    if (url.startsWith('/images/')) {
      return `https://www.notion.so${url}`
    }

    // 2. 核心：处理所有 Notion 托管的图片（含数据库封面、图标、正文图片）
    if (
      url.startsWith('attachment:') || 
      url.includes('secure.notion-static.com') || 
      url.includes('amazonaws.com') ||
      url.includes('notionusercontent.com')
    ) {
      try {
        // 自动识别 table 类型
        // 数据库本身的图标/封面通常用 'collection'，普通块用 'block'
        const table = block.type === 'collection' ? 'collection' : 'block'
        const blockId = block.id

        // 统一强制走 notion.so 的代理转发，这是最稳妥的
        // 不要直接返回 notionusercontent 链接，因为它们在 localhost 下常因签名/跨域失效
        return `https://www.notion.so/image/${encodeURIComponent(url)}?table=${table}&id=${blockId}&cache=v2`
      } catch (e) {
        return url
      }
    }

    return url
  }

  render() {
    const { recordMap } = this.props
    if (!recordMap) return null

    return (
      <div className="notion-app-container">
        <NotionRenderer
          recordMap={recordMap}
          fullPage={true}
          darkMode={false}
          components={{
            Code,
            Collection,
            Modal,
            nextLink: Link
          }}
          mapImageUrl={this.mapImageUrl}
          mapPageUrl={(pageId) => `/${pageId.replace(/-/g, '')}`}
        />
        <style jsx global>{`
          /* 强制修正：确保图片容器有高度，防止被样式隐藏 */
          .notion-image-inset, .notion-page-icon-inline {
            display: inline-block !important;
          }
          /* 数据库视图卡片图片修正 */
          .notion-collection-card-cover img {
            width: 100%;
            height: 100%;
          }
        `}</style>
      </div>
    )
  }
}

export default MyNotionClassRenderer