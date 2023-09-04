
export interface StorageBody {
  storage: {
    value: string
    representation: 'storage'
  }
}

export interface AdfBody {
  atlas_doc_format: {
    value: string
    representation: 'atlas_doc_format'
  }
}

export interface SpaceThemeData {
  foo: string
}

export interface PageData {
  parentType: 'page' | 'blog' | 'whiteboard',
  authorId: string,
  id: string,
  version: {
    number: number,
    message: string,
    minorEdit: false,
    authorId: string,
    createdAt: string
  },
  title: string,
  status: 'current' | '????',
  body: StorageBody | AdfBody,
  parentId: string,
  spaceId: string,
  createdAt: string,
  position: number,
  _links: {
    editui: string,
    webui: string,
    tinyui: string
  }
}

export interface ConfluenceContentSearchResult {
  content: {
    id: string
    title: string
    type: string
    // more fields available
  }
}

export interface CqlSearchResult {
  results: ConfluenceContentSearchResult[]
}

export interface ContentItemReference {
  spaceKey: string
  contentId: string
  contentTitle: string
  contentType: string
}

export interface ThemedSpaceIndexGroup {
  theme: string
  contentItems: ContentItemReference[]
}

export interface SpaceThemeIndex {
  creationTime: number
  groups: ThemedSpaceIndexGroup[]
}

export interface SpaceThemeIndexCreationResult extends GenericOperationResult {
  index?: SpaceThemeIndex
}

export interface SpaceThemeData {
  foo: string
}

export interface GenericOperationResult {
  status: number
  message: string
}

export interface SummarisationResult extends GenericOperationResult  {
  contentId: string
  contentVersion: number
  summarisationTimestamp: number
}

export interface ResolverResult extends SummarisationResult {
  cached: boolean
}
