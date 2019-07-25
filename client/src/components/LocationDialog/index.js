import React from 'react';
import Axios from 'axios';
import './style.sass';
import { Modal, Banner, Button } from '@shopify/polaris';
import Map from '../Map';
import { connect } from 'react-redux';

const mapStateToProps = state => {
    return {
        queryString: state.AppAction.queryString,
        currentLocation: state.AppAction.currentLocation
    }
}

class LocationDialog extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            confirmDeleteDialog: false,
            location: this.props.location,
            dialogType: this.props.dialogType,
            bannerTitle: 'No changes have been made',
            bannerMsg: 'Remember to save your changes',
            bannerStatus: 'warning',
        }
    }

    handleCloseDialog = () => {
        if (this.state.bannerStatus === 'success'){
            this.props.showLoading();
            window.location.reload();
        }
        
        this.props.handleCloseDialog();
    }

    makeParams = () => {
        let queryString = this.props.queryString.substr(1);
        let splittedParams = queryString.split('&');

        let paramsObj = {};
        for (let index in splittedParams) {
            let param = splittedParams[index].split('=');
            paramsObj[param[0]] = param[1]
        }

        paramsObj['location'] = this.props.currentLocation
        return paramsObj
    }

    handleAddLocation = () => {
        let paramsObj = this.makeParams();

        Axios
            .post('/api/locations/add', paramsObj)
            .then(response => {
                if (response.data.status) {
                    this.setState({
                        bannerTitle: 'Success',
                        bannerMsg: 'A new location has been added!',
                        bannerStatus: 'success'
                    })
                    setTimeout(() => this.handleCloseDialog(),800)
                }
                else {
                    this.setState({
                        bannerTitle: 'Server error',
                        bannerMsg: 'No changes has been made',
                        bannerStatus: 'critical'
                    })
                }
            })
            .catch(err => {
                if (err) {
                    this.setState({
                        bannerTitle: 'Server error',
                        bannerMsg: 'No changes has been made',
                        bannerStatus: 'critical'
                    })
                    throw (err);
                }
            })
    }

    handleUpdateLocation = () => {
        let paramsObj = this.makeParams();
        paramsObj['location'] = {
            ...paramsObj['location'],
            idlocations: this.state.location.idlocations
        }

        Axios
            .put('/api/locations/modify', paramsObj)
            .then(response => {
                if (response.data.status) {
                    this.setState({
                        bannerTitle: 'Saved',
                        bannerMsg: 'The information has been modified!',
                        bannerStatus: 'success'
                    })
                    setTimeout(() => this.handleCloseDialog(),800)
                }
                else {
                    this.setState({
                        bannerTitle: 'Server error',
                        bannerMsg: 'No changes has been made',
                        bannerStatus: 'critical'
                    })
                }
            })
            .catch(err => {
                if (err) {
                    this.setState({
                        bannerTitle: 'Server error',
                        bannerMsg: 'No changes has been made',
                        bannerStatus: 'critical'
                    })
                    throw (err);
                }
            })
    }

    handleDeleteLocation = () => {
        let paramsObj = this.makeParams();
        paramsObj['location'] = {
            ...paramsObj['location'],
            idlocations: this.state.location.idlocations
        }
        console.log("DELETING ",paramsObj);

        Axios
            .delete('/api/locations/delete', {data: paramsObj}) // axios is stupid, delete request body needs to be write like this
            .then(response => {
                if (response.data.status){
                    this.setState({
                        bannerTitle: 'Deleted',
                        bannerMsg: 'The location has been deleted!',
                        bannerStatus: 'success'
                    })
                    setTimeout(() => this.handleCloseDialog(),800)
                }
                else{
                    this.setState({
                        bannerTitle: 'Server error',
                        bannerMsg: 'No changes has been made',
                        bannerStatus: 'critical'
                    });
                }
            })
            .catch(err => {
                this.setState({
                    bannerTitle: 'Server error',
                    bannerMsg: 'No changes has been made',
                    bannerStatus: 'critical'
                })
                throw (err);
            })
    }

    render() {

        let { lat, lng } = this.state.location;

        return (
            <>

                {this.state.dialogType === 'create' &&

                    <Modal
                        open={true}
                        onClose={this.handleCloseDialog}
                        primaryAction={{
                            content: 'Add',
                            onAction: this.handleAddLocation,
                        }}
                        secondaryActions={[
                            {
                                content: 'Cancel',
                                onAction: this.handleCloseDialog,
                            },
                        ]}
                    >
                        <Modal.Section>
                            <Banner title={this.state.bannerTitle} status={this.state.bannerStatus} >
                                <p>{this.state.bannerMsg}</p>
                            </Banner>
                            <Map
                                google={this.props.google}
                                center={{ lat: lat, lng: lng }}
                                height='300px'
                                zoom={15}
                            />
                        </Modal.Section>
                    </Modal>
                }

                {this.state.dialogType === 'update' &&
                    <Modal
                        open={true}
                        onClose={this.handleCloseDialog}
                        primaryAction={{
                            content: 'Update',
                            onAction: this.handleUpdateLocation,
                        }}
                        secondaryActions={[
                            {
                                content: 'Cancel',
                                onAction: this.handleCloseDialog,
                            },
                        ]}
                    >
                        <Modal.Section>
                            <Banner title={this.state.bannerTitle} status={this.state.bannerStatus} >
                                <p>{this.state.bannerMsg}</p>
                            </Banner>
                            <Map
                                google={this.props.google}
                                center={{ lat: lat, lng: lng }}
                                height='300px'
                                zoom={15}
                            />

                        </Modal.Section>
                        <Modal.Section>
                            <Button
                                destructive
                                onClick={() => this.setState({ confirmDeleteDialog: true }) }
                            >
                                Delete this location
                                </Button>
                        </Modal.Section>

                    </Modal>
                }

                {this.state.confirmDeleteDialog &&
                    <Modal
                        open={true}
                        onClose={this.handleCloseDialog}
                        primaryAction={{
                            content: 'I understand. Delete it!',
                            onAction: this.handleDeleteLocation,
                        }}
                        secondaryActions={[
                            {
                                content: 'Cancel',
                                onAction: this.handleCloseDialog,
                            },
                        ]}
                    >
                        <Modal.Section>
                        <Banner title="Are you sure you want to delete this location?" status="critical" >
                                <p>This action cannot be undone</p>
                            </Banner>
                        </Modal.Section>
                    </Modal>
                }
            </>
        )
    }
}

export default connect(mapStateToProps, null)(LocationDialog);