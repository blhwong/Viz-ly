import React from 'react';
import {render} from 'react-dom';
import $ from 'jquery';

class App extends React.Component {
  render () {
    return (
      <div>
        <p> Hello Viz.ly!</p>
        <form ref='uploadForm'
          id='uploadForm'
          action='http://localhost:3000/upload'
          method='post'
          encType="multipart/form-data">
          <input type="file" name="sampleFile" />
          <input type='submit' value='Upload!' />
        </form>
      </div>
    );
  }
}

render(<App/>, document.getElementById('app'));
