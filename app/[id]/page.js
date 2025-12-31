// app/[id]/page.js
import { NotionAPI } from 'notion-client'
import MyNotionClassRenderer from '../NotionRenderer'

const notion = new NotionAPI()

export default async function PostPage({ params }) {
  const { id } = await params
  
  try {
    // 抓取包含所有子块的数据（fetchCollections: true 很重要，否则数据库不出图片）
    const recordMap = await notion.getPage(id)
    
    return <MyNotionClassRenderer recordMap={recordMap} />
  } catch (error) {
    return <div style={{padding: '50px'}}>无法加载 ID 为 {id} 的页面。</div>
  }
}