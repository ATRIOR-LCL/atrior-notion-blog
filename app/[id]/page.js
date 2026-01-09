import { NotionAPI } from 'notion-client'
import MyNotionClassRenderer from '../utils/notion-render'

const notion = new NotionAPI()

export default async function PostPage({ params }) {
  const { id } = await params
  
  try {
    const recordMap = await notion.getPage(id)
    
    return <MyNotionClassRenderer recordMap={recordMap} />
  } catch (error) {
    return <div style={{width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
      <h1>404 - Page Not Found</h1>
      <p>Please reload the page or check the URL.</p>
    </div>
  }
}