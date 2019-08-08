import React from 'react';
import Axios from 'axios';
import FileBase64 from 'react-file-base64';
import './style.sass';
import { Modal, Banner, Button } from '@shopify/polaris';
import Map from '../Map';
import { connect } from 'react-redux';
import { TextField } from '@shopify/polaris';
import { _helper_api_makeParams } from '../../helper/api';

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
            formValue: {
                store_name: null,
                priority: null,
                custom_address: null,
                custom_province: null,
                custom_country: null,
                zip_code: null,
                phone: null,
                email: null,
                fax: null,
                website: null,
                note: null,
                store_image: null,
                marker_image: null,
                tags: null,
            }
        }
    }

    handleCloseDialog = () => {
        if (this.state.bannerStatus === 'success') {
            this.props.showLoading();
            window.location.reload();
        }

        this.props.handleCloseDialog();
    }

    showBanner = (bannerTitle, bannerMsg, bannerStatus) => {
        this.setState({
            bannerTitle: bannerTitle,
            bannerMsg: bannerMsg,
            bannerStatus: bannerStatus
        })
    }

    handleAddLocation = () => {
        let paramsObj = _helper_api_makeParams(this.props.queryString, this.props.currentLocation);
        paramsObj.location = {
            ...paramsObj.location,
            ...this.state.formValue,
        }
        
        Axios
            .post('/api/locations/add', paramsObj)
            .then(response => {
                if (response.data.status) {
                    this.setState({
                        bannerTitle: 'Success',
                        bannerMsg: 'A new location has been added!',
                        bannerStatus: 'success'
                    })
                    setTimeout(() => this.handleCloseDialog(), 800)
                }
                else {
                    this.showBanner('Server error', 'No changes has been made', 'cirtical');
                }
            })
            .catch(err => {
                if (err) {
                    this.showBanner('Server error', 'No changes has been made', 'critical');
                    throw (err);
                }
            })
    }

    handleUpdateLocation = () => {
        let paramsObj = _helper_api_makeParams(this.props.queryString, this.props.currentLocation);
        paramsObj['location'] = {
            ...paramsObj['location'],
            idlocations: this.state.location.idlocations,
            ...this.state.formValue,
        }

        Axios
            .put('/api/locations/modify', paramsObj)
            .then(response => {
                if (response.data.status) {
                    this.showBanner('Saved', 'The information has been modified', 'success');
                    setTimeout(() => this.handleCloseDialog(), 800)
                }
                else {
                    this.showBanner('Server error', 'No changes has been made', 'critical');
                }
            })
            .catch(err => {
                if (err) {
                    this.showBanner('Server error', 'No changes has been made', 'critical');
                    throw (err);
                }
            })
    }

    handleDeleteLocation = () => {
        let paramsObj = _helper_api_makeParams(this.props.queryString, this.props.currentLocation);
        paramsObj['location'] = {
            ...paramsObj['location'],
            idlocations: this.state.location.idlocations
        }

        Axios
            .delete('/api/locations/delete', { data: paramsObj }) // axios is stupid, delete request body needs to be write like this
            .then(response => {
                if (response.data.status) {
                    this.showBanner('Deleted', 'The location has been deleted', 'success');
                    setTimeout(() => this.handleCloseDialog(), 800)
                }
                else {
                    this.showBanner('Server error', 'No changes has been made', 'critical');
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

    handleFormInputChange = (key, val) => {
        this.setState({
            formValue: {
                ...this.state.formValue,
                [key]: val
            }
        })
    }

    async componentDidMount() {
        if (this.state.dialogType === 'update') {
            let paramsObj = _helper_api_makeParams(this.props.queryString, this.props.currentLocation);
            paramsObj['location'] = {
                ...paramsObj['location'],
                idlocations: this.state.location.idlocations
            }

            let response =
                await Axios
                    .get(`/api/locations/get${this.props.queryString}&idlocations=${this.state.location.idlocations}`)
                    .catch(err => {
                        this.setState({
                            bannerTitle: 'Server error',
                            bannerMsg: 'No changes has been made',
                            bannerStatus: 'critical'
                        })
                        console.error(err);
                        return null;
                    })
            if (response && response.status){ // if successfully retrieve info
                console.log(response.data);
                let formData = response.data.location;
                this.setState({
                    formValue: {
                        ...formData
                    }
                })
                console.log(this.state.formValue)
            }
            else{
                alert("Server error. Please try again");
            }
        }
    }

    render() {

        let { lat, lng } = this.state.location;

        const form =
            <div className="formContainer">
                <div className="formInput">
                    <TextField
                        name="name"
                        label="Name"
                        value={this.state.formValue.store_name}
                        onChange={val => this.handleFormInputChange("store_name", val)}
                        maxLength={100}

                    />
                </div>
                <div className="formInput">
                    <TextField
                        name="priority"
                        label="Priority (1-1000. 1 is highest priority)"
                        value={this.state.formValue.priority}
                        onChange={val => this.handleFormInputChange("priority", val)}
                        type="number"
                        max={1000}
                    />
                </div>
                <div className="formInput">
                    <TextField
                        name="custom_address"
                        label="Custom address"
                        value={this.state.formValue.custom_address}
                        onChange={val => this.handleFormInputChange("custom_address", val)}
                        maxLength={150}
                    />
                </div>
                <div className="formInput">
                    <TextField
                        name="custom_province"
                        label="Province"
                        value={this.state.formValue.custom_province}
                        onChange={val => this.handleFormInputChange("custom_province", val)}
                        maxLength={50}
                    />
                </div>
                <div className="formInput">
                    <TextField
                        name="custom_country"
                        label="Country"
                        value={this.state.formValue.custom_country}
                        onChange={val => this.handleFormInputChange("custom_country", val)}
                        maxLength={20}
                    />
                </div>
                <div className="formInput">
                    <TextField
                        name="zip_code"
                        label="Zip code"
                        value={this.state.formValue.zip_code}
                        onChange={val => this.handleFormInputChange("zip_code", val)}
                        maxLength={10}
                    />
                </div>
                <div className="formInput">
                    <TextField
                        name="phone"
                        label="Phone"
                        value={this.state.formValue.phone}
                        onChange={val => this.handleFormInputChange("phone", val)}
                        maxLength={45}
                    />
                </div>
                <div className="formInput">
                    <TextField
                        name="email"
                        label="Email"
                        value={this.state.formValue.email}
                        onChange={val => this.handleFormInputChange("email", val)}
                        maxLength={45}
                    />
                </div>
                <div className="formInput">
                    <TextField
                        name="fax"
                        label="Fax"
                        value={this.state.formValue.fax}
                        onChange={val => this.handleFormInputChange("fax", val)}
                        maxLength={100}
                    />
                </div>
                <div className="formInput">
                    <TextField
                        name="website"
                        label="Website"
                        value={this.state.formValue.website}
                        onChange={val => this.handleFormInputChange("website", val)}
                        maxLength={100}
                    />
                </div>
                <div className="formInput">
                    <TextField
                        name="note"
                        label="Note"
                        value={this.state.formValue.note}
                        onChange={val => this.handleFormInputChange("note", val)}
                        multiline
                    />
                </div>
                <div className="formInput">
                    <TextField
                        name="tags"
                        label="Tags"
                        value={this.state.formValue.tags}
                        onChange={val => this.handleFormInputChange("tags", val)}
                        maxLength={100}
                    />
                </div>
                <div className="formInput">
                    <DropZoneArea
                        name="store_image"
                        label="Choose store image"
                        onChange={val => {
                            if (val.type.includes("image")) { // if file type is image
                                this.handleFormInputChange("store_image", val.base64);
                            }
                            else {
                                alert("Only image file is allowed");
                            }
                        }}
                    />
                    <img
                        style={{ float: "left" }}
                        src={this.state.formValue.store_image}
                        alt="default marker"
                    />
                </div>

                <div className="formInput">
                    <DropZoneArea
                        name="marker_image"
                        label="Choose marker image"
                        onChange={val => {
                            if (val.type.includes("image")) { // if file type is image
                                this.handleFormInputChange("marker_image", val.base64);
                            }
                            else {
                                alert("Only image file is allowed");
                            }
                        }}
                    />
                    <img
                        style={{ float: "left" }}
                        src={this.state.formValue.marker_image}
                        alt="default marker"
                    />
                </div>

                <Map
                    google={this.props.google}
                    center={{ lat: lat, lng: lng }}
                    height='300px'
                    zoom={15}
                />
            </div>

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
                            {form}
                        </Modal.Section>
                        <Modal.Section>
                            <Banner title={this.state.bannerTitle} status={this.state.bannerStatus} >
                                <p>{this.state.bannerMsg}</p>
                            </Banner>
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
                            {
                                form
                            }


                        </Modal.Section>
                        <Modal.Section>
                            <Button
                                destructive
                                onClick={() => this.setState({ confirmDeleteDialog: true })}
                            >
                                Delete this location
                                </Button>
                        </Modal.Section>

                    </Modal>
                }

                {this.state.dialogType === 'delete' &&
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

class DropZoneArea extends React.Component {

    getFiles = this.props.onChange;

    render() {
        return (
            <FileBase64
                multiple={false}
                onDone={this.getFiles}
            />
        )
    }
}

export default connect(mapStateToProps, null)(LocationDialog);