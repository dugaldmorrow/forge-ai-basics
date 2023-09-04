
/**
 * Set the OpenAPI API Key as follows:
 * forge variables set --encrypt OPEN_API_KEY your-key
 * export FORGE_USER_VAR_OPEN_API_KEY=your-key
 */
export const getOpenAPIKey = () => {
  return process.env.OPEN_API_KEY;
}

export const getOpenAPIModel = () => {
  return 'gpt-3.5-turbo';
  // return 'gpt-4';
}

export const getSummarisationTtlMillis = () => {
  // The cleanup of summarisation data is triggered via an async event and the maximum delay
  // async event execution is 900 seconds so this becomes our maximum time to live (TTL) for
  // cached summarisation values.
  return 900 * 1000;
}
