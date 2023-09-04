import React from 'react';
import Spinner from '@atlaskit/spinner';

function ActivityIndicator(activityMessage: undefined | string) {

  if (activityMessage) {
    const maskStyle: any = {
      display: 'block',
      position: 'absolute',
      width: '100%',
      height: '1000px',
      top: 0,
      left: 0,
      backgroundColor: '#fff',
      opacity: 0.5
    }
    const messageStyle: any = {
      textAlign: 'center',
      display: 'block',
      position: 'absolute',
      top: '30px',
      border: '1px solid #777',
      backgroundColor: '#fff',
      borderRadius: '4px',
      width: '50%',
      left: '25%',
      padding: '10px'
    }
    return (
      <>
        <div style={maskStyle}>
        </div>
        <div style={messageStyle}>
          <Spinner size='small' /> {activityMessage}
        </div>
      </>
    );
  } else {
    return null;
  }

}

export default ActivityIndicator;
