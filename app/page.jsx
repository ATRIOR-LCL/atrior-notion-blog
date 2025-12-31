import { NotionAPI } from 'notion-client'
import MyNotionClassRenderer from './utils/notion-render'

const notion = new NotionAPI()

export default async function Page() {
  const PAGE_ID = '2d404c3ffdd3807bbd38f6a5a781a749'
  
  let recordMap;
  try {
    recordMap = await notion.getPage(PAGE_ID)
  } catch (error) {
    console.error("Failed to fetch Notion data", error)
    return <div>无法加载页面。</div>
  }

  return (
      <MyNotionClassRenderer recordMap={recordMap} />
  )
}