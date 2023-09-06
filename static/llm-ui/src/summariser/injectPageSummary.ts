import { requestConfluence } from '@forge/bridge';
import { GenericOperationResult, PageData, StorageBody } from '../types';

export const injectPageSummary = async (contentId: string, summaryText: string): Promise<GenericOperationResult> => {
  const pageRequestResponse = await requestConfluence(`/wiki/api/v2/pages/${contentId}?body-format=storage`);
  if (pageRequestResponse.status === 200) {
    const page = await pageRequestResponse.json() as PageData;
    const body = page.body as StorageBody
    const notePanelContent = `<p><strong>Summary</strong>: ${summaryText}</p>`;
    const notePanelInnerDiv = `<div class=\"panelContent\" style=\"background-color: rgb(234,230,255);\">\n<p><strong>Summary</strong>: ${summaryText}</p>\n</div>`;
    const notePanelOuterDiv = `<div class=\"panel conf-macro output-block\" style=\"background-color: rgb(234,230,255);border-color: rgb(153,141,217);border-width: 1.0px;\">${notePanelInnerDiv}</div>`;
    const notePanel = `<ac:adf-extension><ac:adf-node type=\"panel\"><ac:adf-attribute key=\"panel-type\">note</ac:adf-attribute><ac:adf-content>${notePanelContent}</ac:adf-content></ac:adf-node><ac:adf-fallback>${notePanelOuterDiv}</ac:adf-fallback></ac:adf-extension>`;
    const enhancedBodyContent = `${notePanel}${body.storage.value}`;
    const enhancedBody: StorageBody = {
      storage: {
        value: enhancedBodyContent,
        representation: 'storage'
      }
    }
    // https://developer.atlassian.com/cloud/confluence/rest/v2/api-group-page/#api-pages-id-put
    const updatePageBodyData = {
      id: contentId,
      status: 'current',
      title: page.title,
      body: enhancedBody,
      version: {
        number: page.version.number + 1,
        message: `AI generated summary injection.`
      }
    }
    const pageUpdateResponse = await requestConfluence(`/wiki/api/v2/pages/${contentId}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatePageBodyData)
    });
    if (pageUpdateResponse.status === 200) {
      const result: GenericOperationResult = {
        status: pageUpdateResponse.status,
        message: `The summary has been injected at the start of the page.`
      }
      return result;
    } else {
      console.error(`ERROR: unexpected response: `, pageUpdateResponse);
      const result: GenericOperationResult = {
        status: pageUpdateResponse.status,
        message: pageUpdateResponse.statusText
      }
      return result;
    }
  } else {
    if (pageRequestResponse.status !== 200) {
      console.error(`ERROR: unexpected response: `, pageRequestResponse);
    }
    const result: GenericOperationResult = {
      status: pageRequestResponse.status,
      message: pageRequestResponse.statusText
    }
    return result;
  }

}

