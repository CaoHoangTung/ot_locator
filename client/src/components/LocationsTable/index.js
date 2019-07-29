import React from 'react';
import Axios from 'axios';
import './style.sass';
import { Page, Card, ResourceList, TextStyle, Button, Loading } from '@shopify/polaris';
import LocationDialog from '../LocationDialog';
import { connect } from 'react-redux'

const mapStateToProps = state => {
  return {
    queryString: state.AppAction.queryString,
  }
}

// const whitelistDomains = (props) => {
//   const domains = props.domains;
//   const listDomains = domains.map((domain,key) => {
//     return (<p key={key}>
//       {domain}
//     </p>)
//   });
//   return (
//     listDomains
//   )
// }

class LocationsTable extends React.Component {
  constructor() { 
    super();
    this.state = {
      dialogType: null,
      activeLocation: null,
      locations: [],
      isLoading: true,
    }
  }

  handleCloseDialog = () => {
    this.setState({
      dialogType: null,
      activeLocation: null,
    })
  }

  showLoading = () => {
    this.setState({
      isLoading: true,
    })
  }

  componentDidMount() {

    Axios
      .get(`/api/locations/all${this.props.queryString}`)
      .then((response) => {
        console.log("LOCATION: ", response);
        if (response.data.status) {
          this.setState({
            locations: response.data.locations,
            isLoading: false,
          })
        }
      })
      .catch(err => {
        if (err) throw err;
      })
  }

  render() {

    return (
      <>
        {this.state.dialogType !== null &&
          <LocationDialog
            dialogType={this.state.dialogType}
            handleCloseDialog={this.handleCloseDialog}
            location={this.state.activeLocation}
            showLoading={this.showLoading}
          />
        }

        <Page>
          
            {this.state.isLoading &&
              <Loading />
            } 

            <Card>
              <ResourceList
                showHeader
                items={this.state.locations}
                renderItem={(item, key) => {

                  return (
                    <>
                      <ResourceList.Item
                        key={key}
                        className="locationItemContainer"
                        onClick={() => this.setState({ activeLocation: item, dialogType: 'update' })}
                      >
                        <h3>
                          <TextStyle variation="strong">{item.address}

                          </TextStyle>
                        </h3>
                        {/* <p>Delete</p> */}
                        <div>{item.state}</div>

                      </ResourceList.Item>


                    </>
                  );
                }}
              />
              <div className="addLocationBtn">
                <Button
                  onClick={() => this.setState({ dialogType: 'create', activeLocation: { lat: 21.0133525, lng: 105.81932660000007 } })}>Add a new location
              </Button>
              </div>
            </Card>
         
        </Page>
      </>
    )
  }
}
export default connect(mapStateToProps, null)(LocationsTable);