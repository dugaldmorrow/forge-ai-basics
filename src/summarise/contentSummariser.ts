import { PageData, ResolverResult, SummarisationResult } from '../types';
import { getSummarisationTtlMillis } from '../config';
import storageUtil from './summariserStorageUtil';
import confluenceUtil from '../confluenceUtil';
import { pushCleanupEvent } from '../storageCleanupQueueOps';
import openAiUtil from '../openAiUtil';

class ContentSummariser {

  processSummarisePageRequest = async (request): Promise<ResolverResult> => {
    let result: ResolverResult = {
      status: 500,
      message: '',
      contentId: '',
      contentVersion: 0,
      summarisationTimestamp: 0,
      cached: false
    }
    console.log(`request = ${JSON.stringify(request, null, 2)}`);
    if (request.context && request.context.extension && request.context.extension.content) {
      const content = request.context.extension.content;
      if (content.type === 'page') {
        console.log(`Processing page ${content.id}...`);
        result = await this.summarisePage(content.id)
      } else {
        result = {
          status: 400,
          message: `Content type ${content.type} is not supported.`,
          contentId: '',
          contentVersion: 0,
          summarisationTimestamp: 0,
          cached: false
        }
      }
    }
    return result;
  };

  summarisePage = async (contentId): Promise<ResolverResult> => {
    let summarisationResult: SummarisationResult;
    const storageKey = storageUtil.buildContentStorageKey(contentId);
    console.log(`storageKey = ${storageKey}.`);

    // Make the page and storage retrieval requests in parallel to reduce latency...
    const pageDataPromise = confluenceUtil.retrievePage(contentId);
    const cachedResultPromise = storageUtil.getCachedResult(contentId);
    const promiseResults = await Promise.all([pageDataPromise, cachedResultPromise]);
    const pageData = promiseResults[0];
    const cachedResult = promiseResults[1] as undefined | SummarisationResult;

    const currentTimestamp = new Date().getTime();
    console.log(`pageData = ${JSON.stringify(pageData, null, 2)}`);
    const contentVersion = pageData.version.number;
    const cacheHit =
      cachedResult
      && cachedResult.contentVersion === contentVersion
      && cachedResult.summarisationTimestamp
      && (currentTimestamp - cachedResult.summarisationTimestamp) < getSummarisationTtlMillis();
    console.log(`contentVersion = ${contentVersion}.`);
    if (cacheHit) {
      summarisationResult = cachedResult;
    } else {
      summarisationResult = await this.summarisePageWithContext(pageData);

      // Cache the result...
      await storageUtil.storeCacheResult(contentId, summarisationResult);

      // Schedule the cleanup of the cached result...
      const delaySeconds = getSummarisationTtlMillis() / 1000;
      await pushCleanupEvent(contentId, delaySeconds);
    }

    const resolverResult: ResolverResult = {
      ...summarisationResult,
      cached: cacheHit
    }
    return resolverResult;
  }

  summarisePageWithContext = async (page: PageData): Promise<SummarisationResult> => {
    let summarisationResult: SummarisationResult;
    const prompt = this._buildPageSummarisationPrompt(page);
    console.log(`Built prompt: ${prompt} (length ${prompt.length})`);
    const chatCompletionResult = await openAiUtil.postChatCompletion(prompt);
    if (chatCompletionResult.status === 200) {
      summarisationResult = {
        status: chatCompletionResult.status,
        message: chatCompletionResult.message,
        contentId: page.id,
        contentVersion: page.version.number,
        summarisationTimestamp: new Date().getTime()
      }
    } else {
      summarisationResult = {
        status: chatCompletionResult.status,
        message: chatCompletionResult.message,
        contentId: page.id,
        contentVersion: page.version.number,
        summarisationTimestamp: new Date().getTime()
      }
    }
    return summarisationResult;
  }

  _buildPageSummarisationPrompt = (page: PageData): string => {
    const pageFormatName = confluenceUtil.getBodyFormatName(page);
    const pageContent = confluenceUtil.getBodyValue(page);
    const prompt = `I will provide the body of an Atlassian Confluence page with the title "${page.title}" in Confluence's ${pageFormatName}. Please provide a description (less than 100 words) of the page's content and purpose. Here is the page:
    ${pageContent}`;
    return prompt;
  }

}

export default new ContentSummariser();
