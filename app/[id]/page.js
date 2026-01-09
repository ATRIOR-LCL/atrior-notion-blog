import { NotionAPI } from 'notion-client'
import { notFound } from 'next/navigation'
import MyNotionClassRenderer from '../utils/notion-render'

const notion = new NotionAPI()

// 强制动态渲染，确保每次请求都在服务器执行，避免首次访问 404
export const dynamic = 'force-dynamic'
// 禁用静态生成
export const generateStaticParams = () => []

// Notion pageId 是 32 位十六进制字符
function isValidNotionId(id) {
  return /^[a-f0-9]{32}$/i.test(id)
}

// 直接获取页面，带重试机制
async function getPageWithRetry(id, retries = 3, delay = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      const recordMap = await notion.getPage(id)
      if (recordMap && recordMap.block && Object.keys(recordMap.block).length > 0) {
        return recordMap
      }
      throw new Error('Invalid recordMap received')
    } catch (error) {
      console.error(`Attempt ${i + 1} failed for page ${id}:`, error.message)
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
      } else {
        throw error
      }
    }
  }
}

export default async function PostPage({ params }) {
  const { id } = await params
  
  // 验证 pageId 格式，无效直接返回 404
  if (!isValidNotionId(id)) {
    notFound()
  }
  
  try {
    const recordMap = await getPageWithRetry(id)
    
    return <MyNotionClassRenderer recordMap={recordMap} />
  } catch (error) {
    console.error(`Failed to load page ${id}:`, error)
    // 页面不存在或加载失败，使用 Next.js 内置 404
    notFound()
  }
}