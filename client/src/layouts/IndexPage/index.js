import React, { Component } from 'react';
import axios from 'axios';
import LocationsTable from '../../components/LocationsTable';
import { Page } from '@shopify/polaris';
import { connect } from 'react-redux';
import { updateGoogleAPIKey, updateQueryString } from '../../actions';

const mapStateToProps = state => {
  return {
    googleAPIKey: state.GoogleAction.googleAPIKey,
    queryString: state.AppAction.queryString,
  };
};

function mapDispatchToProps(dispatch) {
  return {
    updateGoogleAPIKey: apiKey => dispatch(updateGoogleAPIKey(apiKey)),
    updateQueryString: queryString => dispatch(updateQueryString(queryString))
  };
}

class IndexPage extends Component {

  async componentDidMount() {
    
    await this.props.updateQueryString(window.location.search);

    // retrieve shop and token from url params
    let queryString = this.props.queryString.substr(1);
    let splittedParams = queryString.split('&');

    let paramsObj = {};
    for (let index in splittedParams) {
      let param = splittedParams[index].split('=');
      paramsObj[param[0]] = param[1]
    }
    
    axios.get(`/api/getGoogleAPIKey${this.props.queryString}`).then((response) => {
        let apiKey = response.data.key;
        
        // pass api key to global store state
        this.props.updateGoogleAPIKey(apiKey);

      }).catch((error) => {
        console.log("ERROR fetching google API Key");
        console.error(error);
      });
  }

  render() {
    console.log(this.props);
    return (

      // Important! Always set the container height explicitly
      <div>
        {this.props && this.props.googleAPIKey &&
          <Page>
            {/* <Map
              google={this.props.google}
              center={{ lat: 18.5204, lng: 73.8567 }}
              height='300px'
              zoom={15}
            /> */}
            <LocationsTable />
          </Page>

        }
        {!this.props.googleAPIKey &&
          <Page>
            <h1>Please provide a google api key in the settings panel</h1>  
          </Page>
        }
      </div>

    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(IndexPage);