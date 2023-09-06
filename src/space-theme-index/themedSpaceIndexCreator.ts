import {
  ConfluenceContentSearchResult,
  ContentItemReference,
  SpaceThemeIndex,
  SpaceThemeIndexCreationResult,
  ThemedSpaceIndexGroup
} from 'src/types';
import confluenceUtil from '../confluenceUtil';
import openAiUtil, { ChatCompletionResult } from '../openAiUtil';
import themedSpaceIndexStorageUtil from './themedSpaceIndexStorageUtil';

const minPageCountToCreateThemesFor = 10;

class ThemedSpaceIndexCreator {

  getSpaceThemeIndex = async (request): Promise<SpaceThemeIndexCreationResult> => {
    console.log(`request = ${JSON.stringify(request, null, 2)}`);
    const forceRebuild = request.payload.forceRebuild;
    const spaceKey = request.context.extension.space.key;
    const cachedIndex = forceRebuild ? undefined : await themedSpaceIndexStorageUtil.getCachedResult(spaceKey);
    if (cachedIndex) {
      console.log(`Found cached themed space index: ${cachedIndex}`);
      return cachedIndex;
    } else {
      const searchResult = await confluenceUtil.findTopLevelSpacePages(spaceKey);
      console.log(`searchResult = ${JSON.stringify(searchResult, null, 2)}`);
      if (searchResult && searchResult.results && searchResult.results.length > minPageCountToCreateThemesFor) {
        const spaceThemeIndex = await this._buildThemesUsingAi(spaceKey, searchResult.results);
        console.log(`spaceThemeIndex = ${JSON.stringify(spaceThemeIndex, null, 2)}`);
        themedSpaceIndexStorageUtil.storeCacheResult(spaceKey, spaceThemeIndex);
        return spaceThemeIndex;
      } else {
        const result: SpaceThemeIndexCreationResult = {
          status: 404,
          message: `No results found. There may be insufficient content in the space to create a themed indix of. At least ${minPageCountToCreateThemesFor} pages are needed.`
        }
        return result;
      }
    }
  }

  _buildThemesUsingAi = async (spaceKey: string, searchResults: ConfluenceContentSearchResult[]): Promise<SpaceThemeIndexCreationResult> => {
    const prompt = this._buildCreateIndexPrompt(searchResults);
    console.log(`Built prompt: ${prompt} (length ${prompt.length})`);
    const chatCompletionResult = await openAiUtil.postChatCompletion(prompt);
    console.log(`chatCompletionResult.status: ${chatCompletionResult.status}`);
    let result: SpaceThemeIndexCreationResult = {
      status: chatCompletionResult.status,
      message: ''
    };
    if (chatCompletionResult.status === 200) {
      const index = await this._buildIndexFromChatResponse(spaceKey, searchResults, chatCompletionResult);
      result.index = index;
    }
    return result;
  }

  _buildIndexFromChatResponse = async (
      spaceKey: string,
      searchResults: ConfluenceContentSearchResult[],
      chatCompletionResult: ChatCompletionResult): Promise<SpaceThemeIndex> => {
    const index: SpaceThemeIndex = {
      creationTime: new Date().getTime(),
      groups: []
    }
    const lines = chatCompletionResult.message.split('\n') as string[];
    let currentGroup: undefined | ThemedSpaceIndexGroup = undefined;
    for (const line of lines) {
      console.info(`INFO: analysing line: ${line}`);
      const lineLower = line.toLowerCase();
      const themePrefixIndex = lineLower.indexOf('theme:');
      if (themePrefixIndex >= 0) {
        const themeName = line.substring(themePrefixIndex + 6).trim();
        console.info(`INFO: found theme: "${themeName}"`);
        currentGroup = {
          theme: themeName,
          contentItems: []
        }
        index.groups.push(currentGroup);
        console.info(`Pushed new group ${JSON.stringify(currentGroup)}. Length is now ${index.groups.length}`);
      } else {
        const topicPrefixIndex = lineLower.indexOf('topic:');
        if (topicPrefixIndex >= 0) {
          const topicName = line.substring(topicPrefixIndex + 6).trim();
          console.info(`INFO: found topic: "${topicName}"`);
          if (currentGroup) {
            const searchResult = this._findSearchResultByTitle(topicName, searchResults);
            if (searchResult) {
              const contentItem: ContentItemReference = {
                spaceKey: spaceKey,
                contentId: searchResult.content.id,
                contentTitle: searchResult.content.title,
                contentType: searchResult.content.type
              }
              currentGroup.contentItems.push(contentItem);
            } else {
              console.warn(`WARNING: unable to find search result with title: "${topicName}"!!!`);
            }
          } else {
            console.warn(`No current group to add topic to!!!`);
          }
        } else {
          if (line && line.trim().length) {
            console.warn(`WARNING: line is neither a theme nor topic: ${line}`);
          }
        }
      }
    }
    return index;
  }

  _findSearchResultByTitle = (title: string, searchResults: ConfluenceContentSearchResult[]): undefined | ConfluenceContentSearchResult => {
    for (const searchResult of searchResults) {
      if (searchResult.content.title === title) {
        return searchResult;
      }
    }
    return undefined;
  }

  _buildCreateIndexPrompt = (searchResults: ConfluenceContentSearchResult[]): string => {
    let prompt = `Group the following topics into themes with the results formatted as nested bullet point lists where the outer list identifies the themes and the inner lists identifies the topics matching the themes and each theme is prefixed with "theme:" and each topic is prefixed with "topic:"`;
    for (const searchResult of searchResults) {
      if (searchResult && searchResult.content && searchResult.content.type === 'page') {
        prompt = `${prompt}\n* ${searchResult.content.title}`
      }
    }
    prompt = `${prompt}\n\nPreferably identify an even number of themes and ensure there are more than one topic matching the majority of themes.`
    return prompt;
  }

}

export default new ThemedSpaceIndexCreator();