import React, { useEffect, useState } from 'react';
import { FlagOptions, invoke, router, showFlag, view } from '@forge/bridge';
import Button from '@atlaskit/button';
import { GenericOperationResult, ResolverResult } from '../types';
import ToolbarItem from '../toolbar/ToolbarItem';
import { injectPageSummary } from './injectPageSummary';
import ToolbarRight from '../toolbar/ToolbarRight';
import ActivityIndicator from '../widget/ActivityIndicator';

function PageSummariserView() {

  const debugEnabled = false;
  const [activityMessage, setActivityMessage] = useState<string>('');
  const [data, setData] = useState<undefined | ResolverResult>(undefined);
  const [summaryInjected, setSummaryInjected] = useState<boolean>(false);

  const summarisePage = async () => {
    setActivityMessage('Summarising page...');
    try {
      const response = await invoke('summarisePage') as string;
      const result = JSON.parse(response) as ResolverResult;
      setData(result);
      setActivityMessage('');
      displayFlag(result);
    } catch (error) {
      setActivityMessage('');
      displayFlag({
        status: 500,
        message: `Internal error: ${error}`
      });
    }
  }

  useEffect(() => {
    summarisePage();
  }, []);

  const displayFlag = (result: GenericOperationResult) => {
    const success = result.status >= 200 && result.status < 300;
    const flagOptions: FlagOptions = {
      id: `flag-${new Date().getTime()}`,
      title: success ? 'Created page summary' : 'Error creating page sumary',
      type: success ? 'success' : 'error',
      description: result.message,
      isAutoDismiss: true,
    };
    showFlag(flagOptions);
  }

  const onReloadPageButtonClick = () => {
    router.reload();
  }

  const onInjectButtonClick = async (): Promise<void> => {
    if (data && data.contentId) {
      setActivityMessage('Injecting summary...');
      try {
        const result = await injectPageSummary(data.contentId, data.message);
        setActivityMessage('');
        displayFlag(result);
        if (result.status === 200) {
          setSummaryInjected(true);
        }
      } catch (error) {
        setActivityMessage('');
        displayFlag({
          status: 500,
          message: `Internal error: ${error}`
        });
      }
    } else {
      console.error(`Could not find contentId when trying to inject page summary.`);
    }
  }

  const onCloseButtonClick = () => {
    view.close();
  }

  const renderCacheStatus = () => {
    if (data && data.cached) {
      return `CACHE HIT`;
    } else {
      return `CACHE MISS`;
    }
  }

  const renderData = () => {
    if (data) {
      const cacheStatusSuffix = debugEnabled ? ` (${renderCacheStatus()})` : '';
      const prefix = data.status === 200 ? 'Summary' : 'ERROR';
      return (
        <>
          <strong>{prefix}</strong>: {data.message}{cacheStatusSuffix}
        </>
      );
    } else {
      return null;
    }
  }

  const renderReloadPageButton = () => {
    return (
      <Button
        appearance="primary"
        onClick={onReloadPageButtonClick}
      >
        Reload page
      </Button>
    );
  }

  const renderInjectSummaryButton = () => {
    return (
      <Button
        appearance="primary"
        onClick={onInjectButtonClick}
      >
        Add to page
      </Button>
    );
  }

  const renderCloseButton = () => {
    return (
      <Button
        appearance="default"
        onClick={onCloseButtonClick}
      >
        Close
      </Button>
    );
  }

  const renderToolbar = () => {
    if (data) {
      return (
        <ToolbarRight style={{marginBotton: '5px'}}>
          <ToolbarItem>
            {summaryInjected ? renderReloadPageButton() : renderInjectSummaryButton()}
          </ToolbarItem>
          <ToolbarItem>
            {renderCloseButton()}
          </ToolbarItem>
        </ToolbarRight>
      );
    } else {
      return null;
    }
  }

  return (
    <div>
      {renderToolbar()}
      {renderData()}
      {ActivityIndicator(activityMessage)}
    </div>
  );
}

export default PageSummariserView;
