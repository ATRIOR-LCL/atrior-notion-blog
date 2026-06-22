import { notFound } from 'next/navigation'
import NotionPageRenderer from '../utils/notion-render'
import { getNotionPageWithRetry } from '../utils/patch-notion'

// 未枚举的文章页首次访问时按需生成，后续 60 秒内复用缓存。
export const revalidate = 60
export const dynamicParams = true
export const generateStaticParams = () => []

// Notion pageId 是 32 位十六进制字符
function isValidNotionId(id) {
  return /^[a-f0-9]{32}$/i.test(id)
}

export default async function PostPage({ params }) {
  const { id } = await params
  
  // 验证 pageId 格式，无效直接返回 404
  if (!isValidNotionId(id)) {
    notFound()
  }

  let recordMap;

  try {
    recordMap = await getNotionPageWithRetry(id)
  } catch (error) {
    console.error(`Failed to load page ${id}:`, error)
    // 页面不存在或加载失败，使用 Next.js 内置 404
    notFound()
  }

  return <NotionPageRenderer recordMap={recordMap} />
}
