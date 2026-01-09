import { NotionAPI } from 'notion-client'
import { unstable_cache } from 'next/cache'
import MyNotionClassRenderer from './utils/notion-render'

const notion = new NotionAPI()

// 每 60 秒重新验证缓存
export const revalidate = 60

const PAGE_ID = '2d404c3ffdd3807bbd38f6a5a781a749'

// 缓存首页数据
const getCachedHomePage = unstable_cache(
  async () => {
    const recordMap = await notion.getPage(PAGE_ID)
    if (recordMap && recordMap.block && Object.keys(recordMap.block).length > 0) {
      return recordMap
    }
    throw new Error('Invalid recordMap received')
  },
  ['notion-home'],
  { revalidate: 60 }
)

// 带重试机制的获取页面函数
async function getPageWithRetry(retries = 3, delay = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      return await getCachedHomePage()
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error.message)
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
      } else {
        throw error
      }
    }
  }
}

export default async function Page() {
  let recordMap;
  try {
    recordMap = await getPageWithRetry()
  } catch (error) {
    console.error("Failed to fetch Notion data", error)
    return <div>无法加载页面，请稍后刷新重试。</div>
  }

  return (
      <MyNotionClassRenderer recordMap={recordMap} />
  )
}