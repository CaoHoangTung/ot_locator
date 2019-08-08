import React from 'react';
import Axios from 'axios';
import './style.sass';
import { DataTable, Card, Button, ButtonGroup, Loading, TextField } from '@shopify/polaris';
import LocationDialog from '../LocationDialog';
import { connect } from 'react-redux'

const mapStateToProps = state => {
  return {
    queryString: state.AppAction.queryString,
  }
}

class LocationsTable extends React.Component {
  constructor() {
    super();
    this.state = {
      dialogType: null,
      activeLocation: null,
      locations: [],
      formattedLocations: [], // this will change due to user's sorting or searching
      formattedLocationsStatic: [], // this will not change
      isLoading: true,
      searchText: '',
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

  showUpdateDialog = (location) => {
    this.setState({ activeLocation: location, dialogType: 'update' })
  }

  showDeleteDialog = (location) => {
    this.setState({ activeLocation: location, dialogType: 'delete' })
  }

  async componentDidMount() {
    let response = await
      Axios
        .get(`/api/locations/all${this.props.queryString}`)
        .catch(err => {
          if (err) throw err;
        })
        
    if (response.data.status) {
      let formattedLocations = [];
      // location list is in response.data.locations
      
      // format location so we can put it into the polaris datatable
      for (let key in response.data.locations) {
        let location = response.data.locations[key];
        let formattedLocation = [
          (location.store_name !== null ? location.store_name : ""),
          (location.custom_address !== null ? location.custom_address : ""),
          (location.address !== null ? location.address : ""),
          <ButtonGroup>
            <Button onClick={() => this.showUpdateDialog(location)}>Edit</Button>
            <Button destructive onClick={() => this.showDeleteDialog(location)}>Delete</Button>
          </ButtonGroup>
        ];
        formattedLocations.push(formattedLocation);
      }

      this.setState({
        locations: response.data.locations,
        formattedLocations: formattedLocations,
        formattedLocationsStatic: formattedLocations,
        isLoading: false,
      });
    }
  }

  sortLocations = (rows, index, direction) => {
    return [...rows].sort((rowA, rowB) => {
      const valueA = rowA[index];
      const valueB = rowB[index];

      let descendingReturnValue = 0; // the sorting condition , default = 0 means we assume 2 elements are equal
      if (valueB > valueA)
        descendingReturnValue = 1;
      else if (valueB < valueA)
        descendingReturnValue = -1;

      return direction === 'descending' ? descendingReturnValue : -descendingReturnValue;
    });
  };

  handleSort = (rows) => (index, direction) => {
    this.setState({ formattedLocations: this.sortLocations(rows, index, direction) });
  };


  handleSearchTextChange = (value) => {
    this.setState({
      searchText: value
    })

    // if search text is empty, return the default data
    if (value === ''){
      this.setState({
        formattedLocations: this.state.formattedLocationsStatic
      });
    }
    else{
      let tmp = [];
      for(let formattedLocation of this.state.formattedLocations){
        for (let key=0 ; key < formattedLocation.length-1; key++){  // exclude the last column ( the column which contains buttons)
          let fieldValue = formattedLocation[key];

          if (fieldValue.includes(value)){
            tmp.push(formattedLocation);
            break;
          }
        }
      }

      this.setState({
        formattedLocations: tmp
      })
    }
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

        <>

          {this.state.isLoading &&
            <Loading />
          }
          <Card>
            {/* <ResourceList
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
                        <TextStyle variation="strong">{item.custom_address}

                        </TextStyle>
                      </h3>
                      <div>{item.state}</div>

                    </ResourceList.Item>
                  </>
                );
              }}
            /> */}

            <div className="tableHeaderContainer">
              <div className="addLocationBtn">
                <Button
                  onClick={() => this.setState({ dialogType: 'create', activeLocation: { lat: 21.0133525, lng: 105.81932660000007 } })}>Add a new location
                </Button>
              </div>
              <div className="searchBox">
                <TextField
                  label="Search"
                  value={this.state.searchText}
                  onChange={this.handleSearchTextChange}
                />
              </div>
            </div>
            <DataTable
              columnContentTypes={[
                'text',
                'text',
                'text',
                'text',
              ]}
              headings={[
                'Shop name',
                'Custom address',
                'Map address',
                'Actions',
              ]}
              rows={this.state.formattedLocations}
              sortable={[true, true, false]}
              defaultSortDirection="descending"
              // initialSortColumnIndex={4}
              onSort={this.handleSort(this.state.formattedLocations)}
              footerContent={`Showing ${this.state.formattedLocations.length} of ${this.state.formattedLocations.length} results`}
            />


            <div className="addLocationBtn">
              <Button
                onClick={() => this.setState({ dialogType: 'create', activeLocation: { lat: 21.0133525, lng: 105.81932660000007 } })}>Add a new location
              </Button>
            </div>
          </Card>
        </>
      </>
    )
  }
}
export default connect(mapStateToProps, null)(LocationsTable);