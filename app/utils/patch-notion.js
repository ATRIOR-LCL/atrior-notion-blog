import { NotionAPI } from 'notion-client'
import { unstable_cache } from 'next/cache'
import { getBlockCollectionId, getPageContentBlockIds } from 'notion-utils'
import {
  HOME_PAGE_ID,
  NOTION_REVALIDATE_SECONDS,
} from './notion-config'

export {
  HOME_PAGE_ID,
  NOTION_REVALIDATE_SECONDS,
} from './notion-config'

const notion = new NotionAPI()

const mergeRecordMap = (target, source) => {
  if (!source) return target;

  const patchedSource = patchRecordMap(source);

  target.block = {
    ...target.block,
    ...patchedSource.block,
  };
  target.collection = {
    ...target.collection,
    ...patchedSource.collection,
  };
  target.collection_view = {
    ...target.collection_view,
    ...patchedSource.collection_view,
  };
  target.notion_user = {
    ...target.notion_user,
    ...patchedSource.notion_user,
  };

  return target;
};

export const patchTable = (table) => {
  if (!table || typeof table !== 'object') return table;
  const patched = {};
  for (const [key, entry] of Object.entries(table)) {
    if (!entry || !entry.value) {
      patched[key] = entry;
      continue;
    }
    if (entry.value.value && entry.value.role !== undefined && !entry.value.id) {
      patched[key] = {
        ...entry,
        value: entry.value.value,
        role: entry.value.role,
      };
    } else {
      patched[key] = entry;
    }
  }
  return patched;
};

export const patchRecordMap = (recordMap) => {
  if (!recordMap) return recordMap;
  const result = { ...recordMap };
  for (const tableName of ['block', 'collection', 'collection_view', 'collection_query']) {
    if (result[tableName]) {
      result[tableName] = patchTable(result[tableName]);
    }
  }
  result.collection = result.collection || {};
  result.collection_view = result.collection_view || {};
  result.collection_query = result.collection_query || {};
  result.notion_user = result.notion_user || {};
  result.signed_urls = result.signed_urls || {};
  return result;
};

export const fetchMissingBlocks = async (recordMap) => {
  if (!recordMap || !recordMap.block) return recordMap;

  const result = patchRecordMap(recordMap);
  const maxIterations = 10;
  const batchSize = 100;

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const pendingBlockIds = getPageContentBlockIds(result).filter(
      (blockId) => !result.block?.[blockId]?.value
    );

    if (!pendingBlockIds.length) {
      return result;
    }

    let fetchedCount = 0;

    for (let i = 0; i < pendingBlockIds.length; i += batchSize) {
      const batch = pendingBlockIds.slice(i, i + batchSize);
      const blocksData = await notion.getBlocks(batch);
      const patchedBlocks = patchRecordMap(blocksData.recordMap)?.block || {};
      const resolvedBlocks = Object.fromEntries(
        Object.entries(patchedBlocks).filter(([, entry]) => entry?.value)
      );

      fetchedCount += Object.keys(resolvedBlocks).length;
      result.block = {
        ...result.block,
        ...resolvedBlocks,
      };
    }

    if (!fetchedCount) {
      console.warn("NotionAPI missing blocks could not be resolved", pendingBlockIds);
      return result;
    }
  }

  console.warn("NotionAPI missing blocks reached iteration limit");
  return result;
};

export const fetchMissingCollections = async (recordMap) => {
  if (!recordMap || !recordMap.block) return recordMap;

  recordMap = patchRecordMap(recordMap);
  
  const contentBlockIds = Object.keys(recordMap.block);
  const allCollectionInstances = contentBlockIds.flatMap((blockId) => {
    const block = recordMap.block[blockId]?.value;
    if (block && (block.type === 'collection_view' || block.type === 'collection_view_page')) {
      const collectionId = getBlockCollectionId(block, recordMap) || block.collection_id;
      if (collectionId) {
        const spaceId = block.space_id;
        return block.view_ids?.map((collectionViewId) => ({
          collectionId,
          collectionViewId,
          spaceId
        })) || [];
      }
    }
    return [];
  });

  const collectionReducerLimit = 999;

  for (const collectionInstance of allCollectionInstances) {
    const { collectionId, collectionViewId, spaceId } = collectionInstance;
    
    // 如果已经获取了 query 结果，跳过
    if (recordMap.collection_query?.[collectionId]?.[collectionViewId]) {
      continue;
    }

    const collectionView = recordMap.collection_view?.[collectionViewId]?.value;
    try {
      const collectionData = await notion.getCollectionData(
        collectionId,
        collectionViewId,
        collectionView,
        {
          limit: collectionReducerLimit,
          spaceId,
        }
      );
      
      // 合并获取到的新数据
      recordMap = mergeRecordMap(recordMap, collectionData.recordMap);
      
      recordMap.collection_query[collectionId] = {
        ...recordMap.collection_query[collectionId],
        [collectionViewId]: collectionData.result?.reducerResults
      };
    } catch (err) {
      console.warn("NotionAPI collectionQuery error", err.message);
    }
  }
  
  return recordMap;
};

export const hydrateRecordMap = async (recordMap) => {
  let result = patchRecordMap(recordMap);
  result = await fetchMissingBlocks(result);
  result = await fetchMissingCollections(result);
  result = await fetchMissingBlocks(result);
  return result;
};

const fetchNotionPage = async (pageId) => {
  let recordMap = await notion.getPage(pageId, {
    fetchMissingBlocks: false,
    fetchCollections: false,
  });

  if (!recordMap?.block || Object.keys(recordMap.block).length === 0) {
    throw new Error('Invalid recordMap received');
  }

  return hydrateRecordMap(recordMap);
};

const getCachedNotionPage = unstable_cache(
  async (pageId) => fetchNotionPage(pageId),
  ['notion-page'],
  { revalidate: NOTION_REVALIDATE_SECONDS }
);

export const getNotionPage = async (pageId) => getCachedNotionPage(pageId);

export const getNotionPageWithRetry = async (
  pageId,
  retries = 3,
  delay = 500
) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await getNotionPage(pageId);
    } catch (error) {
      console.error(`Attempt ${i + 1} failed for page ${pageId}:`, error.message);
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      } else {
        throw error;
      }
    }
  }
};
