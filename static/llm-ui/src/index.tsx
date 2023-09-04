import React from 'react';
import ReactDOM from 'react-dom';
import { view } from '@forge/bridge';
import PageSummariserView from './summariser/PageSummariserView';
import '@atlaskit/css-reset';
import "./toolbar/StylesToolbar.css";
import './themed-space-index/ThemedSpaceIndex.css'
import ThemedSpaceIndexView from './themed-space-index/ThemedSpaceIndexView';

const render = async () => {
  const context = await view.getContext();
  const moduleKey = context.moduleKey;
  const renderedUI =
    moduleKey === 'content-summariser' ? <PageSummariserView /> :
      moduleKey === 'themed-space-index' ? <ThemedSpaceIndexView /> : null;
  ReactDOM.render(
    <React.StrictMode>
      {renderedUI}
    </React.StrictMode>,
    document.getElementById('root')
  );
}

render();
