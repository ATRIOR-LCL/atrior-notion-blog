import { NotionAPI } from 'notion-client'
import MyNotionClassRenderer from '../utils/notion-render'

const notion = new NotionAPI()

export default async function PostPage({ params }) {
  const { id } = await params
  
  try {
    const recordMap = await notion.getPage(id)
    
    return <MyNotionClassRenderer recordMap={recordMap} />
  } catch (error) {
    return <div style={{padding: '50px'}}>无法加载 ID 为 {id} 的页面。</div>
  }
}