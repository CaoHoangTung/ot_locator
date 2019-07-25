import React, { Component } from 'react';
import './style.sass';
import Axios from 'axios';
import { connect } from 'react-redux';
import { updateGoogleAPIKey, updateQueryString } from '../../actions';
import { Button, Heading, Card, TextField, Banner, Page } from '@shopify/polaris';

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
      }
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

  componentDidMount(){
    Axios.get(`/api/getStorefrontSettings${this.props.queryString}`).then((response) => {
      console.log(response);
      this.setState({
        settings: {
          ...this.state.settings,
          wrapperClass: response.data.wrapperClass,
          sectionHeader: response.data.sectionHeader,
        }
      })
    }).catch((error) => {
      console.log("ERROR fetching storefront settings");
      console.error(error);
    });
  }

  render() {
    return (
      <Page>
        <Banner title={this.state.bannerTitle} status={this.state.bannerStatus} >
          <p>{this.state.bannerMsg}</p>
        </Banner>
        <Card>
          <div className="settingsWrapper">
            <Heading>
              Storefront settings
            </Heading>

            <TextField
              label="Wrapper class/id"
              name="wrapperClass"
              value={this.state.settings.wrapperClass}
              onChange={this.handleWrapperClassChange}
            />
            <TextField
              label="Section header"
              name="sectionHeader"
              value={this.state.settings.sectionHeader}
              onChange={this.handleSectionHeaderChange}
            />
          </div>
        </Card>

        <Card>
          <div className="settingsWrapper">
            <Heading>
              Server settings
          </Heading>
            <TextField
              label="Google Map API Key"
              name="googleAPIKey"
              value={this.state.settings.googleAPIKey}
              onChange={this.handleGoogleAPIKeyChange}
            />
          </div>
        </Card>
        <Card>
          <div className="settingsWrapper">
            <Button
              primary
              onClick={this.saveAllChanges}
            >
              Save all changes
            </Button>
          </div>
        </Card>
      </Page>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Settings);