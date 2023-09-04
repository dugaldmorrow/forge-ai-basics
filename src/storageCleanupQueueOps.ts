import { Queue } from '@forge/events';
import Resolver from "@forge/resolver";
import summariserStorageUtil from './summarise/summariserStorageUtil';
import { Payload, PushSettings } from '@forge/events/out/types';
import { getSummarisationTtlMillis } from './config';

const cleanupQueue = new Queue({ key: 'storage-cleanup-queue' });

const resolver = new Resolver();
resolver.define("storageCleanupListener", async (queueItem) => {
  const eventPayload = queueItem.payload;
  const eventContext = queueItem.context;
  console.log(` * payload: ${JSON.stringify(eventPayload)}`);
  console.log(` * context: ${JSON.stringify(eventContext)}`);
  const cachedResult = await summariserStorageUtil.getCachedResult(eventPayload.contentId);
  const now = new Date().getTime();
  if (cachedResult) {
    const expired = (now - cachedResult.summarisationTimestamp) >= getSummarisationTtlMillis();
    if (expired) {
      console.log(`Deleting cache result for content ID ${eventPayload.contentId}...`);
      await summariserStorageUtil.deleteCacheResult(eventPayload.contentId);
    } else {
      console.log(`Cache result for content ID ${eventPayload.contentId} has not expired yet (there will be another event queued to clean it up).`);
    }
  } else {
    console.log(`Cache result for content ID ${eventPayload.contentId} not found.`);
  }
});
export const storageCleanupHandler = resolver.getDefinitions();

export async function pushCleanupEvent(contentId: string, delayInSeconds: number) {
  console.log(`pushCleanupEvent (${contentId}, ${delayInSeconds})`);
  const payload: Payload = {
    contentId: contentId
  };
  const pushSettings: PushSettings = {
    delayInSeconds: delayInSeconds
  };
  await cleanupQueue.push(payload, pushSettings);
};
