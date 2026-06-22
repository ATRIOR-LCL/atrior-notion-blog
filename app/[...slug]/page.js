import { notFound } from 'next/navigation'
import NotionPageRenderer from '../utils/notion-render'
import { getPageIdFromSlug } from '../utils/notion-paths'
import { getNotionPageWithRetry } from '../utils/patch-notion'

// 未枚举的文章页首次访问时按需生成，后续 60 秒内复用缓存。
export const revalidate = 60
export const dynamicParams = true
export const generateStaticParams = () => []

export default async function PostPage({ params }) {
  const { slug } = await params
  const id = getPageIdFromSlug(slug)

  if (!id) {
    notFound()
  }

  let recordMap

  try {
    recordMap = await getNotionPageWithRetry(id)
  } catch (error) {
    console.error(`Failed to load page ${id}:`, error)
    // 页面不存在或加载失败，使用 Next.js 内置 404
    notFound()
  }

  return <NotionPageRenderer recordMap={recordMap} />
}
