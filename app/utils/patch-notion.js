import { NotionAPI } from 'notion-client'
const notion = new NotionAPI()

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
  return result;
};

export const fetchMissingCollections = async (recordMap) => {
  if (!recordMap || !recordMap.block) return recordMap;
  
  const contentBlockIds = Object.keys(recordMap.block);
  const allCollectionInstances = contentBlockIds.flatMap((blockId) => {
    const block = recordMap.block[blockId]?.value;
    if (block && (block.type === 'collection_view' || block.type === 'collection_view_page')) {
      const collectionId = block.collection_id;
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
      recordMap.block = {
        ...recordMap.block,
        ...collectionData.recordMap?.block
      };
      recordMap.collection = {
        ...recordMap.collection,
        ...collectionData.recordMap?.collection
      };
      recordMap.collection_view = {
        ...recordMap.collection_view,
        ...collectionData.recordMap?.collection_view
      };
      recordMap.notion_user = {
        ...recordMap.notion_user,
        ...collectionData.recordMap?.notion_user
      };
      
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
