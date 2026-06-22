import {
  getBlockParentPage,
  getBlockTitle,
  getTextContent,
  idToUuid,
  normalizeTitle,
  parsePageId,
} from 'notion-utils'
import { HOME_PAGE_ID } from './notion-config'

export function getCompactPageId(id) {
  if (!id) return null

  const parsed = parsePageId(id, { uuid: false })
  if (parsed) return parsed

  const compact = String(id).replaceAll('-', '')
  return /^[a-f0-9]{32}$/i.test(compact) ? compact : null
}

function getRecordValue(recordMap, tableName, id) {
  if (!recordMap?.[tableName] || !id) return null

  const compact = getCompactPageId(id)
  const uuid = compact ? idToUuid(compact) : null
  const candidates = [id, uuid, compact].filter(Boolean)

  for (const candidate of candidates) {
    const entry = recordMap[tableName]?.[candidate]
    const value = entry?.value?.value || entry?.value
    if (value) return value
  }

  return null
}

export function getBlock(recordMap, id) {
  return getRecordValue(recordMap, 'block', id)
}

function getCollection(recordMap, id) {
  return getRecordValue(recordMap, 'collection', id)
}

function getCollectionTitle(collection) {
  return getTextContent(collection?.name) || ''
}

function titleToSegment(title, fallback = 'page') {
  return normalizeTitle(title) || fallback
}

export function getNotionPathBreadcrumbs(recordMap, pageId) {
  let currentBlock = getBlock(recordMap, pageId)
  const breadcrumbs = []
  const visited = new Set()

  while (currentBlock && !visited.has(currentBlock.id)) {
    visited.add(currentBlock.id)

    const pageTitle = getBlockTitle(currentBlock, recordMap)
    if (pageTitle || currentBlock.format?.page_icon) {
      breadcrumbs.push({
        type: 'page',
        pageId: currentBlock.id,
        title: pageTitle,
        block: currentBlock,
        active: getCompactPageId(currentBlock.id) === getCompactPageId(pageId),
      })
    }

    if (currentBlock.parent_table === 'collection') {
      const collection = getCollection(recordMap, currentBlock.parent_id)
      const collectionBlock = collection?.parent_table === 'block'
        ? getBlock(recordMap, collection.parent_id)
        : null
      const collectionTitle = getCollectionTitle(collection)

      if (collectionTitle && collectionBlock) {
        breadcrumbs.push({
          type: 'page',
          pageId: collectionBlock.id,
          title: collectionTitle,
          block: collectionBlock,
          active: false,
        })
      } else if (collectionTitle) {
        breadcrumbs.push({
          type: 'collection',
          collectionId: collection.id,
          title: collectionTitle,
          block: null,
          parentPageId: null,
          active: false,
        })
      }

      currentBlock = collectionBlock
        ? getBlockParentPage(collectionBlock, recordMap)
        : null
      continue
    }

    currentBlock = getBlockParentPage(currentBlock, recordMap)
  }

  return breadcrumbs.reverse()
}

export function getPagePath(recordMap, pageId) {
  const compactPageId = getCompactPageId(pageId)
  if (!compactPageId || compactPageId === HOME_PAGE_ID) {
    return '/'
  }

  const breadcrumbs = getNotionPathBreadcrumbs(recordMap, pageId)
  const currentPage = breadcrumbs.findLast(
    (breadcrumb) =>
      breadcrumb.type === 'page' &&
      getCompactPageId(breadcrumb.pageId) === compactPageId
  )

  if (!currentPage) {
    return `/${compactPageId}`
  }

  const pathSegments = breadcrumbs
    .filter((breadcrumb) => {
      if (breadcrumb.type === 'page') {
        const id = getCompactPageId(breadcrumb.pageId)
        return id && id !== HOME_PAGE_ID && id !== compactPageId
      }

      return breadcrumb.type === 'collection'
    })
    .map((breadcrumb) => titleToSegment(breadcrumb.title))

  pathSegments.push(`${titleToSegment(currentPage.title)}-${compactPageId}`)

  return `/${pathSegments.join('/')}`
}

export function getBreadcrumbHref(recordMap, breadcrumb) {
  if (!breadcrumb || breadcrumb.active) return null

  if (breadcrumb.type === 'collection') {
    return breadcrumb.block?.id
      ? getPagePath(recordMap, breadcrumb.block.id)
      : null
  }

  return getPagePath(recordMap, breadcrumb.pageId)
}

export function getPageIdFromSlug(slug) {
  const segments = Array.isArray(slug) ? slug : [slug]
  const lastSegment = segments.filter(Boolean).at(-1)
  return getCompactPageId(lastSegment)
}
