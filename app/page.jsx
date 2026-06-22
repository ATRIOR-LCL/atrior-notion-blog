import NotionPageRenderer from './utils/notion-render'
import {
  HOME_PAGE_ID,
  getNotionPageWithRetry,
} from './utils/patch-notion'

// 每 60 秒重新验证缓存
export const revalidate = 60

export default async function Page() {
  let recordMap;
  try {
    recordMap = await getNotionPageWithRetry(HOME_PAGE_ID)
  } catch (error) {
    console.error("Failed to fetch Notion data", error)
    return <div>无法加载页面，请稍后刷新重试。</div>
  }

  return (
      <NotionPageRenderer recordMap={recordMap} />
  )
}
