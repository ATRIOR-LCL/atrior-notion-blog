// app/page.js
import { NotionAPI } from 'notion-client'
import MyNotionClassRenderer from './NotionRenderer'

const notion = new NotionAPI()

export default async function Page() {
  const PAGE_ID = '2d404c3ffdd3807bbd38f6a5a781a749' // 替换为你自己的 Notion 32位 ID
  
  let recordMap;
  try {
    // 在服务端获取数据
    recordMap = await notion.getPage(PAGE_ID)
  } catch (error) {
    console.error("Failed to fetch Notion data", error)
    return <div>无法加载页面，请检查页面 ID 是否已公开分享。</div>
  }

  // 将数据传给类组件进行渲染
  return (
    <main>
      <MyNotionClassRenderer recordMap={recordMap} />
    </main>
  )
}