import { storage } from "@forge/api";
import { SummarisationResult } from '../types';

class SummariserStorageUtil {

  buildContentStorageKey = (contentId: string) => {
    const storageKey = `content-${contentId}`;
    return storageKey;
  }

  getCachedResult = async (contentId: string): Promise<undefined | SummarisationResult> => {
    const storageKey = this.buildContentStorageKey(contentId);
    const cachedResult = await storage.get(storageKey) as undefined | SummarisationResult;
    return cachedResult;
  }

  storeCacheResult = async (contentId: string, result: SummarisationResult): Promise<void> => {
    const storageKey = this.buildContentStorageKey(contentId);
    await storage.set(storageKey, result);
  }

  deleteCacheResult = async (contentId: string): Promise<void> => {
    const storageKey = this.buildContentStorageKey(contentId);
    await storage.delete(storageKey);
    
  }

}

export default new SummariserStorageUtil();
