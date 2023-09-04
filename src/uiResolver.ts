import Resolver from '@forge/resolver';
import contentSummariser from './summarise/contentSummariser';
import themedSpaceIndexCreator from './space-theme-index/themedSpaceIndexCreator';

const resolver = new Resolver();

resolver.define('summarisePage', async (request): Promise<string> => {
  const result = await contentSummariser.processSummarisePageRequest(request);
  return JSON.stringify(result);
});

resolver.define('getSpaceThemeData', async (request): Promise<string> => {  
  const result = await themedSpaceIndexCreator.getSpaceThemeIndex(request);
  return JSON.stringify(result);
});

export const handler = resolver.getDefinitions();
