import React, { Component } from 'react';
import './style.sass';
import Axios from 'axios';
import { connect } from 'react-redux';
import { updateGoogleAPIKey, updateQueryString } from '../../actions';
import { Card } from '@shopify/polaris';

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

class Settings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dialogType: this.props.dialogType,
      bannerTitle: 'No changes have been made',
      bannerMsg: 'Remember to save your changes',
      bannerStatus: 'warning',
      settings: {
        googleAPIKey: this.props.googleAPIKey,
        wrapperClass: '',
        sectionHeader: '',
        googleAPIWhitelistDomains: '',
      },
      isLoading: true,
    }
  }

  handleWrapperClassChange = (value) => {
    this.setState({
      bannerTitle: 'No changes have been made',
      bannerMsg: 'Remember to save your changes',
      bannerStatus: 'warning',
      settings: {
        ...this.state.settings,
        wrapperClass: value,
      }
    })
  }

  handleSectionHeaderChange = (value) => {
    this.setState({
      bannerTitle: 'No changes have been made',
      bannerMsg: 'Remember to save your changes',
      bannerStatus: 'warning',
      settings: {
        ...this.state.settings,
        sectionHeader: value,
      }
    })
  }

  handleGoogleAPIKeyChange = (value) => {
    this.setState({
      bannerTitle: 'No changes have been made',
      bannerMsg: 'Remember to save your changes',
      bannerStatus: 'warning',
      settings: {
        ...this.state.settings,
        googleAPIKey: value,
      }
    });
  }

  makeParams = () => {
    let queryString = this.props.queryString.substr(1);
    let splittedParams = queryString.split('&');

    let paramsObj = {};
    for (let index in splittedParams) {
      let param = splittedParams[index].split('=');
      paramsObj[param[0]] = param[1]
    }

    return paramsObj
  }

  saveAllChanges = (e) => {
    e.preventDefault();

    let paramsObj = this.makeParams();
    paramsObj['settings'] = this.state.settings;
    Axios
      .post('/api/settings/change', paramsObj)
      .then((response) => {
        if (response.status) {
          this.setState({
            bannerTitle: "Settings updated",
            bannerStatus: 'success',
            bannerMsg: "All changes has been saved"
          })
        }
      })
  }

  componentDidMount() {
    Axios.get(`/api/getAllSettings${this.props.queryString}`).then((response) => {
      console.log(response);
      this.setState({
        settings: {
          ...this.state.settings,
          wrapperClass: response.data.wrapperClass,
          sectionHeader: response.data.sectionHeader,
          googleAPIWhitelistDomains: response.data.googleAPIWhitelistDomains,
        },
        isLoading: false,
      })
    }).catch((error) => {
      console.log("ERROR fetching storefront settings");
      console.error(error);
    });
  }

  render() {
    console.log(this.state.settings);
    return (
      <>
        <div className="divSectionContainer">
          <div>
            <Card
              title="Set up your Google Maps API Key"
            >
            </Card>
          </div>
        </div>

        <div className="divSectionContainer">
          <div className="divSettings halfWidthDiv">
            <Card
              title="General"
            >
            </Card>
          </div>

          <div className="halfWidthDiv">
            <Card
              title="Map settings"
            >
            </Card>
          </div>
        </div>

        <div className="divSectionContainer">
          <div className="divSettings">
            <Card
              title="Content"
            >
            </Card>
          </div>
        </div>

        <div className="divSectionContainer">
          <div className="divSettings">
            <Card
              title="Language"
            >
            </Card>
          </div>
        </div>
      </>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Settings);