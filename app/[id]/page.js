import { NotionAPI } from 'notion-client'
import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'
import MyNotionClassRenderer from '../utils/notion-render'

const notion = new NotionAPI()

// 使用 ISR，每 60 秒重新验证
export const revalidate = 60
export const dynamicParams = true

// Notion pageId 是 32 位十六进制字符
function isValidNotionId(id) {
  return /^[a-f0-9]{32}$/i.test(id)
}

// 缓存 Notion 页面数据，60 秒过期
const getCachedPage = unstable_cache(
  async (id) => {
    const recordMap = await notion.getPage(id)
    if (recordMap && recordMap.block && Object.keys(recordMap.block).length > 0) {
      return recordMap
    }
    throw new Error('Invalid recordMap received')
  },
  ['notion-page'],
  { revalidate: 60 }
)

// 带重试机制的获取页面函数
async function getPageWithRetry(id, retries = 3, delay = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      return await getCachedPage(id)
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