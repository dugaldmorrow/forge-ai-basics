import { storage } from "@forge/api";
import { SpaceThemeIndexCreationResult } from '../types';

class ThemedSpaceIndexStorageUtil {

  buildSpaceStorageKey = (spaceKey: string) => {
    const storageKey = `space-index-${spaceKey}`;
    return storageKey;
  }

  getCachedResult = async (spaceKey: string): Promise<undefined | SpaceThemeIndexCreationResult> => {
    const storageKey = this.buildSpaceStorageKey(spaceKey);
    const cachedResult = await storage.get(storageKey) as undefined | SpaceThemeIndexCreationResult;
    return cachedResult;
  }

  storeCacheResult = async (spaceKey: string, result: SpaceThemeIndexCreationResult): Promise<void> => {
    const storageKey = this.buildSpaceStorageKey(spaceKey);
    await storage.set(storageKey, result);
  }

  deleteCacheResult = async (spaceKey: string): Promise<void> => {
    const storageKey = this.buildSpaceStorageKey(spaceKey);
    await storage.delete(storageKey);
    
  }

}

export default new ThemedSpaceIndexStorageUtil();
