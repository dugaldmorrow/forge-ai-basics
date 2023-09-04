import React, { useEffect, useState } from 'react';
import { FlagOptions, invoke, router, showFlag } from '@forge/bridge';
import Button, { Appearance } from '@atlaskit/button';
import {
  ContentItemReference,
  GenericOperationResult,
  SpaceThemeIndexCreationResult,
  ThemedSpaceIndexGroup
} from '../types';
import ToolbarItem from '../toolbar/ToolbarItem';
import ToolbarRight from '../toolbar/ToolbarRight';
import ActivityIndicator from '../widget/ActivityIndicator';
import SectionMessage from '@atlaskit/section-message';

const millisToSuggestReindex = 4 * 7 * 24 * 60 * 60 * 1000; // 4 weeks

function ThemedSpaceIndexView() {

  const [activityMessage, setActivityMessage] = useState<string>('');
  const [spaceThemeData, setSpaceThemeData] = useState<undefined | SpaceThemeIndexCreationResult>(undefined);

  const groupComparator = (groupA: ThemedSpaceIndexGroup, groupB: ThemedSpaceIndexGroup): number => {
    if (groupA.contentItems.length === groupB.contentItems.length) {
      return groupA.theme.localeCompare(groupB.theme);
    } else {
      // Groups with most items first
      return groupB.contentItems.length - groupA.contentItems.length;
    }
  }

  const sortResult = (unsortedResult: SpaceThemeIndexCreationResult): void => {
    if (unsortedResult.index) {
      unsortedResult.index.groups.sort(groupComparator);
    }
  }

  const summarisePage = async (forceRebuild: boolean) => {
    setActivityMessage('Creating themed space index...');
    try {
      const response = await invoke('getSpaceThemeData', { forceRebuild: forceRebuild }) as string;
      const result = JSON.parse(response) as SpaceThemeIndexCreationResult;
      sortResult(result);
      setSpaceThemeData(result);
      setActivityMessage('');
    } catch (error) {
      setActivityMessage('');
      displayFlag({
        status: 500,
        message: `Internal error: ${error}`
      });
    }
  }

  useEffect(() => {
    summarisePage(false);
  }, []);

  const displayFlag = (result: GenericOperationResult) => {
    const success = result.status >= 200 && result.status < 300;
    const flagOptions: FlagOptions = {
      id: `flag-${new Date().getTime()}`,
      title: success ? 'Success' : 'Error',
      type: success ? 'success' : 'error',
      description: result.message,
      isAutoDismiss: true,
    };
    showFlag(flagOptions);
  }

  const onRebuildIndexButtonClick = async (): Promise<void> => {
    await summarisePage(true);
  }

  const renderRebuildIndexButton = () => {
    let appearance: Appearance = 'default';
    if (spaceThemeData) {
      if (spaceThemeData.index) {
        const now = new Date().getTime();
        const millisSinceCreationTime = now - spaceThemeData.index.creationTime;
        if (millisSinceCreationTime > millisToSuggestReindex) {
          appearance = 'primary';
        }
      } else {
        appearance = 'primary';
      }
    } else {
      appearance = 'primary';
    }
    return (
      <Button
        appearance={appearance}
        onClick={onRebuildIndexButtonClick}
      >
        Rebuild index
      </Button>
    );
  }

  const renderToolbar = () => {
    if (spaceThemeData) {
      return (
        <ToolbarRight style={{marginBotton: '5px'}}>
          <ToolbarItem>
            {renderRebuildIndexButton()}
          </ToolbarItem>
        </ToolbarRight>
      );
    } else {
      return null;
    }
  }

  const renderSlug = (contentItem: ContentItemReference) => {
    return encodeURIComponent(contentItem.contentTitle);
  }

  const renderGroupContentItems = (group: ThemedSpaceIndexGroup) => {
    const renderedGroupContentItems = group.contentItems.map(contentItem => {
      return (
        <li>
          <a
            href=""
            onClick={(event) => {
              const contentUrl = `/wiki/spaces/${contentItem.spaceKey}/pages/${contentItem.contentId}/${renderSlug(contentItem)}`
              router.open(contentUrl);
              event.preventDefault();
            }}
          >{contentItem.contentTitle}</a>
        </li>
      );
    });
    return (
      <ul className="contentGroupList">
        {renderedGroupContentItems}
      </ul>
    );
  }

  const renderGroup = (group: ThemedSpaceIndexGroup) => {
    return (
      <div className="themedSpaceIndexGroup">
        <SectionMessage title={group.theme} appearance="information">
          {renderGroupContentItems(group)}
        </SectionMessage>
      </div>
    );
  }

  const renderData = () => {
    if (!spaceThemeData) {
      return null;
    }
    if (spaceThemeData.index && spaceThemeData.index.groups && spaceThemeData.index.groups.length) {
      const renderedGroups = spaceThemeData.index.groups.map(group => {
        return renderGroup(group);
      });
      return (
        <div className="themedSpaceIndexContainer">
          {renderedGroups}
        </div>
      );
    } else {
      return (
        <div style={{marginTop: '20px'}}>
          <SectionMessage title="Error" appearance="error">
            {spaceThemeData.message ? spaceThemeData.message : `No data was returned.`}
          </SectionMessage>
        </div>
      );
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

export default ThemedSpaceIndexView;
