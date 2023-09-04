import api, { route } from '@forge/api';
import { AdfBody, CqlSearchResult, PageData, StorageBody } from './types';

class ConfluenceUtil {

  retrievePage = async (contentId: string): Promise<undefined | PageData> => {
    console.log(`Querying /wiki/api/v2/pages/${contentId}...`);
    const response = await api.asUser().requestConfluence(route`/wiki/api/v2/pages/${contentId}?body-format=storage`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    if (response.ok) {
      const json = await response.json() as PageData;
      return json;
    } else {
      return undefined;
    }
  }

  getIdOfTopPageInSpace = async (spaceKey: string): Promise<undefined | string> => {
    const response = await api.asUser().requestConfluence(route`/wiki/rest/api/space/${spaceKey}?expand=homepage`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    console.log(response);
    if (response.ok) {
      const json = await response.json();
      return json.homepage.id;
      return json;
    } else {
      return undefined;
    }
  }

  findTopLevelSpacePages = async (spaceKey: string): Promise<CqlSearchResult> => {
    const topLevelResult = await this._findTopLevelSpacePages(spaceKey, true);
    if (topLevelResult && topLevelResult.results.length >= 10) {
      return topLevelResult;
    } else {
      return await this._findTopLevelSpacePages(spaceKey, false);
    }
  }

  _findTopLevelSpacePages = async (spaceKey: string, onlyIncludeRootLevelPages: boolean): Promise<CqlSearchResult> => {
    let parentClauseSuffix = '';
    if (onlyIncludeRootLevelPages) {
      const topPageId = await this.getIdOfTopPageInSpace(spaceKey);
      if (!topPageId) {
        console.warn(`Unable to find top page of space ${spaceKey}`);
        const result: CqlSearchResult = {
          results: []
        }
        return result
      }
      parentClauseSuffix = ` and parent = ${topPageId}`;
    }
    const cql = `space = ${spaceKey} and type = "page" ${parentClauseSuffix}`;
    console.log(`CQL = ${cql}`);
    const response = await api.asUser().requestConfluence(route`/wiki/rest/api/search?cql=${cql}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    console.log(response);
    if (response.ok) {
      const json = await response.json();
      console.log(JSON.stringify(json));
      return json;
    } else {
      return undefined;
    }
  }

  getBody = (page: PageData): undefined | StorageBody | AdfBody => {
    if (page.body['storage']) {
      return page.body['storage'] as StorageBody;
    } else if (page.body['atlas_doc_format']) {
      return page.body['atlas_doc_format'] as AdfBody;
    }
    return undefined;
  }

  getBodyFormatName = (page: PageData): undefined | string => {
    if (page.body['storage']) {
      return 'Storage format'
    } else if (page.body['atlas_doc_format']) {
      return 'Atlassian Document Format (ADF)'
    }
    return undefined;
  }

  getBodyValue = (page: PageData): undefined | string => {
    if (page.body['storage']) {
      return (page.body as StorageBody).storage.value;
    } else if (page.body['atlas_doc_format']) {
      return (page.body as AdfBody).atlas_doc_format.value;
    }
    return undefined;
  }

}

export default new ConfluenceUtil();
