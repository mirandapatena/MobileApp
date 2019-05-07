import React, { Component } from "react";
import { Text, TouchableOpacity, View, Image, Dimensions, TextInput, StyleSheet, TouchableHighlight, Keyboard, Alert } from "react-native";
import Modal from 'react-native-modal';
import ActionButton, { ActionButtonItem } from 'react-native-action-button';
import AwesomeButton from 'react-native-really-awesome-button';
import ImageView from 'react-native-image-view';
import Drawer from 'react-native-circle-drawer';
import BottomDrawer from 'rn-bottom-drawer';
import RadioGroup from 'react-native-radio-buttons-group';
import Icon from 'react-native-vector-icons/FontAwesome';

import 'babel-polyfill';
import 'es6-symbol';

import app from '../config/fire';
import apiKey from '../config/apiKey';
import _ from 'lodash';
import Geolocation from 'react-native-geolocation-service';
import MapView, { PROVIDER_GOOGLE, Polyline, Marker } from 'react-native-maps';

import PolyLine from '@mapbox/polyline';
var screen = Dimensions.get('window');
const TAB_BAR_HEIGHT = 100;


export default class Volunteer extends Component {

    renderContent = () => {
        const { isImageViewVisible, imageIndex } = this.state;
        const images = [
            {
                source: {
                    uri: this.state.image_uri
                },
            },
        ];
        return (
            <View>
                <Text style={{
                    fontSize: 20,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    marginTop: 5
                }}>
                    {this.state.incidentType}
                </Text>
                <Text style={{
                    fontSize: 19,
                    textAlign: 'center',
                    marginBottom: 10
                }}>
                    {this.state.incidentLocation}
                </Text>
                <TouchableOpacity
                    onPress={() => {
                        this.setState({
                            isImageViewVisible: true,
                        });
                    }}
                >
                    {/* <Image source={{ uri: this.state.image_uri }} style={{
                        width: 100, height: 100,
                        marginBottom: 15, left: 100
                    }}></Image> */}
                </TouchableOpacity>
                <ImageView
                    glideAlways
                    style={{ flex: 1, width: undefined, height: undefined }}
                    images={images}
                    imageIndex={imageIndex}
                    animationType="fade"
                    isVisible={isImageViewVisible}
                    renderFooter={this.renderFooter}
                    onClose={() => this.setState({ isImageViewVisible: false })}
                />
            </View>
        )
    }
    _isMounted = false;
    constructor(props) {
        super(props);
        this.state = {
            isModalVisible: false,
            isAccepted: false,
            isIncidentReady: false,
            destinationPlaceId: '',
            isRequestingVolunteers: '',
            incidentID: '',
            userId: '',
            originalVolunteer: false,
            image_uri: '',
            userKey: "",
            userType: '',
            incidentType: "",
            incidentLocation: "",
            firstName: "",
            lastName: "",
            user: null,
            isImageViewVisible: false,
            imageIndex: '',
            unresponded: true,
            isResponding: false,
            isSettled: false,
            incidentPhoto: '',
            reportedBy: '',
            timeReceive: '',
            timeResponded: '',
            responderResponding: '',
            volunteerResponding: '',
            requestVolunteers: false,
            coordinates: {
                lng: null,
                lat: null
            },
            pointCoords: [],
            error: "",
            latitude: null,
            longitude: null,
            locationPredictions: [],
        };

    }


    signOutUser() {
        app.auth().signOut().then(function () {
            console.log("SUCCESFULL LOG OUT");
        }).catch(function (error) {
            console.log(error)
        });

    }


    authListener() {
        // this._isMounted = true;
        app.auth().onAuthStateChanged(user => {
            if (user) {

                this.setState({ user, userId: user.uid });
                var userId = this.state.userId
                this.getUserInfo();
                this.incidentListener(userId);


            }
        });
    }

    getUserInfo = () => {
        var userType = '';
        var firstName = '';
        var lastName = '';
        var that = this;
        console.log("HI", this.state.userId);
        this.user2 = app.database().ref(`users/${this.state.userId}/`);
        this.user2.on('value', function (snapshot) {
            const data2 = snapshot.val() || null;
            console.log("data2", data2);

            if (data2) {
                userType = data2.user_type;
                firstName = data2.firstName;
                lastName = data2.lastName;
            }
            that.setState({ userType, firstName, lastName });
        })

    }

    changeIncidentState = (incidentType, incidentLocation, incidentID, destinationPlaceId, userId, image_uri) => {
        var date = Date(Date.now());
        date1 = date.toString();


        this.setState({ originalVolunteer: true, isIncidentReady: true, incidentType, incidentLocation, destinationPlaceId, userId, incidentId: incidentID, image_uri });

        app.database().ref(`incidents/${incidentID}`).update({
            isRespondingVolunteer: true,
            // image_uri: this.state.image_uri,
            unrespondedVolunteer: false,
            volunteerResponding: this.state.userId,
            timeReceiveVolunteer: date1
        });

        app.database().ref(`mobileUsers/Volunteer/${this.state.userId}`).update({
            isAccepted: true,
        })
        this.getRouteDirection(destinationPlaceId, incidentLocation);
    }

    arrivedLocation = () => {
        this.setState({ isIncidentReady: false });
        var date = Date(Date.now());
        date1 = date.toString();

        let incidentID = this.state.incidentId;
        console.log("incidentID on arrived Location", incidentID);
        app.database().ref(`incidents/${incidentID}`).update({
            timeVolunteerResponded: date1
        });
    }


    isSettled = () => {

        let incidentID = this.state.incidentId;
        let userId = this.state.userId;
        console.log("is settled?", incidentID, userId);
        this.setState({
            isIncidentReady: false,
            isSettled: true,
            incidentId: '',
            requestVolunteers: false,
        });
        // this.setState({ isSettled: true })
        var volunteerListen = app.database().ref(`mobileUsers/Volunteer/${userId}`)
        volunteerListen.update({
            incidentID: '',
            isAccepted: false,
        })

        // app.database().ref(`incidents/${incidentID}`).update({
        //     isSettled: true,
        // });
    }


    arrivedLocationRequested = () => {
        var date = Date(Date.now());
        date1 = date.toString();

        let incidentID = this.state.incidentId;
        let userId = this.state.userId;
        console.log("incidentID on arrived Location", incidentID, userId);
        app.database().ref(`incidents/${incidentID}/requestVolunteers/${userId}`).update({
            timeArrived: date1,
        });
    }

    isRejected = () => {

        let incidentID = this.state.incidentId;
        let userId = this.state.userId;


        var volunteerListen = app.database().ref(`mobileUsers/Volunteer/${userId}`)
        volunteerListen.update({
            incidentID: "",
            isRejected: false,
        })
    }


    isRequestingVolunteers = (incidentId, userId, destinationPlaceId, incidentLocation) => {
        var date = Date(Date.now());
        date1 = date.toString();

        console.log("REQUEST", this.state.userId);
        this.setState({
            // isRequestingResponders: true,
            isIncidentReady: true,
            requestVolunteers: true,
        })

        app.database().ref(`incidents/${incidentId}/requestVolunteers/${userId}`).update({

            timeArrived: '',
            timeReceive: date1,
        });

        app.database().ref(`mobileUsers/Volunteer/${userId}`).update({
            isAccepted: true,
        });
        this.getRouteDirection(destinationPlaceId, incidentLocation);
    }


    requestAdditionalVolunteers = () => {
        let incidentID = this.state.incidentId;
        let userId = this.state.userId;
        console.log("incidentID on arrived Location", incidentID, userId);
        app.database().ref(`incidents/${incidentID}`).update({
            isRequestingVolunteers: true,
        });
    }

    incidentListener = (userId) => {
        // this._isMounted = true;
        console.log("INCIDNE LISTENER", userId);
        this.volunteerListen = app.database().ref(`mobileUsers/Volunteer/${userId}`)
        var that = this;
        var incidentDetails = '';


        this.volunteerListen.on('value', (snapshot) => {


            userId = this.state.userId;
            var data = snapshot.val();
            var incidentID = data.incidentID;
            console.log("incident ID", incidentID);

            if (incidentID !== "") {
                console.log("hey i got here");
                this.userIncidentId = app.database().ref(`incidents/${incidentID}`)
                this.userIncidentId.on('value', (snapshot) => {
                    incidentDetails = snapshot.val() || null;
                    var incidentType = incidentDetails.incidentType;
                    var incidentLocation = incidentDetails.incidentLocation;
                    var destinationPlaceId = incidentDetails.destinationPlaceId;
                    var image_uri = incidentDetails.image_uri;
                    var volunteerResponding = incidentDetails.volunteerResponding;
                    var isSettled = incidentDetails.isSettled;
                    var isRequestingVolunteers = incidentDetails.isRequestingVolunteers;

                    if (incidentID && volunteerResponding === "" && isSettled === false) {
                        Alert.alert(
                            "INCIDENT DETAILS ",
                            `Incident Type: ${incidentType}
                                                 Incident Location: ${incidentLocation}
                                                                         `
                            ,
                            [
                                { text: "Respond", onPress: () => { that.changeIncidentState(incidentType, incidentLocation, incidentID, destinationPlaceId, userId, image_uri) } },
                                { text: "Decline", onPress: () => { this.isRejected() } },
                            ],
                            { cancelable: false }
                        );


                    }
                    else if (volunteerResponding === userId && isSettled === false) {
                        console.log("same volunteer");

                        that.setState({ originalVolunteer: true, isIncidentReady: true, incidentType, incidentLocation, destinationPlaceId, userId, incidentId: incidentID, isSettled: false, image_uri });
                        that.getRouteDirection(destinationPlaceId, incidentLocation);
                    }
                    else if (volunteerResponding !== userId && this.isRequestingVolunteers === true && this.state.requestVolunteers === false) {
                        Alert.alert(
                            "REQUESTING ADDITIONAL VOLUNTEER ",
                            `Incident Type: ${incidentType}
                                                 Incident Location: ${incidentLocation}
                                                                         `
                            ,
                            [
                                { text: "Respond", onPress: () => { that.isRequestingVolunteers(incidentID, userId, destinationPlaceId, incidentLocation) } },
                                { text: "Decline", onPress: () => { this.isRejected() } },
                            ],
                            { cancelable: false }
                        );
                        that.setState({ incidentType, incidentLocation, destinationPlaceId, incidentId: incidentID, userId, image_uri });
                    }
                    else if (volunteerResponding === userId && isSettled === true) {
                        console.log("same additional volunteer has acceted")

                        Alert.alert(
                            "INCIDENT HAS BEEN SETTLED",
                            `Incident Type: ${incidentType}
                                                 Incident Location: ${incidentLocation}
                                                                         `
                            ,
                            [
                                { text: "OK", onPress: () => { that.isSettled() } },
                            ],
                            { cancelable: false }
                        );
                        that.setState({ isIncidentReady: false, isSettled: true, incidentType, incidentLocation, destinationPlaceId, userId, incidentId: incidentID, image_uri });

                    }
                    else if (volunteerResponding !== userId && isRequestingVolunteers === true && this.state.requestVolunteers === true && isSettled === false) {
                        console.log("requested volunteer condition. settled: false");
                        that.setState({ incidentType, incidentLocation, destinationPlaceId, incidentId: incidentID, userId, image_uri });
                        that.getRouteDirection(destinationPlaceId, incidentLocation);
                    }
                    else if (volunteerResponding !== userId && isRequestingVolunteers === true && this.state.requestVolunteers === true && isSettled === true) {
                        console.log("requested volunteer condition");
                        Alert.alert(
                            "INCIDENT HAS BEEN SETTLED",
                            `Incident Type: ${incidentType}
                                                 Incident Location: ${incidentLocation}
                                                                         `
                            ,
                            [
                                { text: "OK", onPress: () => { that.isSettled() } },
                            ],
                            { cancelable: false }
                        );
                        that.setState({ isIncidentReady: false, isSettled: true, incidentType, incidentLocation, destinationPlaceId, incidentId: incidentID, userId });

                    }
                    else {
                        console.log("system is FLAWED")
                    }
                })
            }
            else {
                console.log("incident Id is not here");
                that.setState({ isIncidentReady: false, destinationPlaceId: '', incidentLocation: '' });
                console.log("incident is not ready", that.state.isIncidentReady);
            }

        })
    }

    async onChangeDestination(incidentLocation) {
        this.setState({ incidentLocation });
        const apiUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?key=${apiKey}&input={${incidentLocation}}&location=${
            this.state.latitude
            },${this.state.longitude}&radius=2000`;
        const result = await fetch(apiUrl);
        const jsonResult = await result.json();
        this.setState({
            locationPredictions: jsonResult.predictions
        });
        console.log(jsonResult);
    }

    componentDidMount() {
        this._isMounted = true;

        this.authListener();

        Geolocation.getCurrentPosition(

            position => {
                this.setState({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
                // if (this.state.destinationPlaceId) {
                //     this.getRouteDirection(this.state.destinationPlaceId, this.state.incidentLocation);
                // }
                app.database().ref(`mobileUsers/Volunteer/${this.state.userId}`).update({
                    coordinates: {
                        lng: this.state.longitude,
                        lat: this.state.latitude
                    },
                });

            },
            error => this.setState({ error: error.message }),
            { enableHighAccuracy: true }
        );

        this.watchId = Geolocation.watchPosition(

            position => {
                this.setState({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });

                app.database().ref(`mobileUsers/Volunteer/${this.state.userId}`).update({
                    coordinates: {
                        lng: this.state.longitude,
                        lat: this.state.latitude
                    },
                })
                    .then(() => {
                        console.log('Coordinates Updated: ', this.state.longitude, ' ', this.state.latitude);
                    });

            },
            error => this.setState({ error: error.message }),
            { enableHighAccuracy: true, distanceFilter: 5, interval: 4000 }
        );
    }


    componentWillUnmount() {
        this._isMounted = false;
        Geolocation.clearWatch(this.watchId);
        this.user2.off();
        this.volunteerListen.off();
        this.userIncidentId.off();
    }


    submitIncidentHandler = () => {
        var date = Date(Date.now());
        date1 = date.toString();

        var coords = this.state.pointCoords;
        var coords2 = this.state.pointCoords[coords.length - 1];
        var coordLat = coords2.latitude;
        var coordLng = coords2.longitude;
        app.database().ref("/incidents").push({
            incidentType: this.state.incidentType,
            incidentLocation: this.state.incidentLocation,
            unresponded: true,
            isResponding: false,
            isSettled: false,
            incidentPhoto: '',
            reportedBy: this.state.userId,
            timeReceive: date1,
            timeResponded: '',
            responderResponding: this.state.userId,
            volunteerResponding: '',
            coordinates: {
                lat: coordLat,
                lng: coordLng
            },
            destinationPlaceId: this.state.destinationPlaceId,
            isRequestingResponders: false,
            isRequestingVolunteers: false,
        }).then((snap) => {
            const incidentUserKey = snap.key
            this.setState({ incidentUserKey })
            console.log("INCIDENT USER KEY HEREEEEE: ", this.state.userId);
        })
        this.setState({
            incidentType: '',
            incidentLocation: '',
            unresponded: null,
            isResponding: null,
            isSettled: null,
            incidentPhoto: '',
            reportedBy: '',
            timeReceive: '',
            timeResponded: '',
            responderResponding: '',
            volunteerResponding: '',
            coordinates: {
                lat: null,
                lng: null
            },
            markerCoords: {
                lat: null,
                lng: null
            },
            destinationPlaceId: '',
            isRequestingResponders: false,
            isRequestingVolunteers: false,


        });
        console.log(this.state.incidentsList);
        Alert.alert(
            'Attention: ',
            'Report has been sent',
            [
                {
                    text: 'Cancel',
                    onPress: () => console.log('Cancel Pressed'),
                    style: 'cancel',
                },
                { text: 'OK', onPress: () => this.setIncidentID() },
            ],
            { cancelable: false },
        );
    }

    setIncidentID = () => {
        app.database().ref(`mobileUsers/Volunteer/${this.state.userId}`).update({
            incidentID: this.state.incidentUserKey,
        });

    }

    getRouteDirection(destinationPlaceId, destinationName) {
        fetch(
            `https://maps.googleapis.com/maps/api/directions/json?origin=${
            this.state.latitude
            },${
            this.state.longitude
            }&destination=place_id:${destinationPlaceId}&key=${apiKey}`
        )
            .then((res) => res.json())
            .then(json => {
                console.log('Data: ', json);
                const points = PolyLine.decode(json.routes[0].overview_polyline.points);
                const pointCoords = points.map(point => {
                    return { latitude: point[0], longitude: point[1] };
                });
                this.setState({
                    pointCoords,
                    locationPredictions: [],
                    incidentLocation: destinationName,
                    destinationPlaceId,
                });
                Keyboard.dismiss();
                this.map.fitToCoordinates(pointCoords);
            })
            .catch((error) => {
                console.log(error);
            });
    }


    _toggleModal = () => {
        this.setState({ isModalVisible: !this.state.isModalVisible });
    }

    renderContent = () => {
        return (
            <View style={styles.main}>
                <View>
                    <Text style={{
                        fontSize: 20,
                        color: 'white',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        marginTop: 5
                    }}>
                        {this.state.incidentType}
                    </Text>
                    <Text style={{
                        color: 'white',
                        fontSize: 19,
                        textAlign: 'center',
                        marginBottom: 7
                    }}>
                        {this.state.incidentLocation}
                    </Text></View>

                <View style={styles.responderButtons}>
                    {this.state.requestVolunteers === true ?
                        <View style={styles.buttonContainer}><AwesomeButton height={50} width={190} backgroundColor="#467541" onPress={() => { this.arrivedLocationRequested() }}>I have arrived! Requested. </AwesomeButton></View>
                        :
                        <View style={styles.buttonContainer}><AwesomeButton height={50} width={190} backgroundColor="#467541" onPress={() => { this.arrivedLocation() }}>I have arrived! </AwesomeButton></View>
                    }

                </View>
            </View>
        )
    }
    _openDrawer = () => {
        this.refs.DRAWER.open();
    }


    renderSideMenu() {
        return (
            <View>
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 50 }}>
                    Hello {this.state.firstName}!
                 </Text>
                <Text style={{ color: 'white', fontWeight: 'normal', fontSize: 15 }}>
                    You are a {this.state.userType}.
                 </Text>
                <TouchableOpacity disabled={this.state.isIncidentReady} onPress={this.signOutUser}>
                    <Text style={{ color: 'white', fontSize: 30 }}>
                        Log Out
                     </Text>
                </TouchableOpacity>
            </View>
        )
    }

    renderTopRightView() {
        return (
            <View style={{ top: 10, left: 75 }}>
                <Image style={{ width: 65, height: 65 }} source={require("../images/avatar.png")} />
            </View>
        )
    }

    render() {

        let marker = null;

        if (this.state.pointCoords.length > 1) {
            marker = (
                <Marker
                    coordinate={this.state.pointCoords[this.state.pointCoords.length - 1]}
                />
            );
        }


        let polylinemarker = null;

        polylinemarker = (
            <Polyline
                coordinates={this.state.pointCoords}
                strokeWidth={4}
                strokeColor="red"
            />
        )


        if (this.state.latitude) {
            getUserLocation = (
                <Marker
                    coordinate={
                        {
                            latitude: this.state.latitude,
                            longitude: this.state.longitude
                        }
                    }
                    title={`Hello ${this.state.firstName}`}
                    description={'You are here'}
                >
                    <Image
                        source={require("../images/userPosition.png")}
                        style={{ height: 45, width: 45 }} />
                </Marker>
            )
        }

        // const locationPredictions = this.state.locationPredictions.map(
        //     prediction => (
        //         <TouchableHighlight
        //             key={prediction.id}
        //             onPress={() =>
        //                 this.getRouteDirection(
        //                     prediction.place_id,
        //                     prediction.description
        //                 )
        //             }
        //         >

        //             <Text style={styles.locationSuggestion}>
        //                 {prediction.description}
        //             </Text>
        //         </TouchableHighlight>
        //     )
        // );


        if (this.state.latitude === null) return null;

        return (

            <View style={styles.container}>

                <Drawer
                    style={styles.mapDrawerOverlay}
                    ref="DRAWER"
                    primaryColor="#2d2d2d"
                    secondaryColor="#5C7788"
                    cancelColor="#5C7788"
                    sideMenu={this.renderSideMenu()}
                    topRightView={this.renderTopRightView()} />

                <View style={{ alignSelf: 'flex-end', position: 'absolute', marginTop: 8, paddingRight: 8 }}><AwesomeButton backgroundColor="#2d2d2d" borderRadius={50} height={35} width={35} raiseLevel={2} backgroundDarker="rgba(0,0,0,0.05)" onPress={this._openDrawer}>
                    <Image style={{ width: 22.63, height: 15.33 }} source={require("../images/menu.png")} /></AwesomeButton></View>

                <MapView
                    ref={map => { this.map = map; }}
                    provider={PROVIDER_GOOGLE} // remove if not using Google Maps
                    style={styles.map}
                    region={{
                        latitude: this.state.latitude,
                        longitude: this.state.longitude,
                        latitudeDelta: 0.015,
                        longitudeDelta: 0.0121,
                    }}
                // showsUserLocation={true}

                >
                    {getUserLocation}
                    {this.state.isIncidentReady === true ? polylinemarker : null}
                    {this.state.isIncidentReady === true ? marker : null}
                </MapView>


                {/* {!this.state.isIncidentReady ?
                    <ActionButton buttonColor="rgba(50,0,60,1)" position='right' offsetX={17} onPress={this.signOutUser} /> :

                    // <ActionButton buttonColor="orange" position='left' offsetY={85} offsetX={17}>
                    //     <ActionButton.Item buttonColor='#9b59b6' title="I have arrived" onPress={() => { this.arrivedLocation() }}>
                    //         <Icon name="md-create" style={styles.actionButtonIcon} />
                    //     </ActionButton.Item>
                    //     <ActionButton.Item buttonColor='#1abc9c' title="Sign Out" onPress={this.signOutUser}>
                    //         <Icon name="md-done-all" style={styles.actionButtonIcon} />
                    //     </ActionButton.Item>

                    <ActionButton buttonColor="orange" position='left' offsetY={85} offsetX={17}>
                        {this.state.requestVolunteers === true ?
                            <ActionButton.Item buttonColor='#9b59b6' title="Arrived (Requested)" onPress={() => { this.arrivedLocationRequested() }}>
                                <Icon name="md-create" style={styles.actionButtonIcon} />
                            </ActionButton.Item>
                            : <ActionButton.Item buttonColor='#9b59b6' title="Arrived" onPress={() => { this.arrivedLocation() }}>
                                <Icon name="md-create" style={styles.actionButtonIcon} />
                            </ActionButton.Item>
                        }
                        <ActionButton.Item buttonColor='#1abc9c' title="Sign Out" onPress={this.signOutUser}>
                            <Icon name="md-done-all" style={styles.actionButtonIcon} />
                        </ActionButton.Item>


                    </ActionButton>
                } */}

                {/* {this.state.isIncidentReady ?
                    <BottomDrawer containerHeight={150} downDisplay={50} startUp={false} roundedEdges={true}>
                        {this.renderContent()}
                    </BottomDrawer> :
                    <ActionButton buttonColor="rgba(0,76,60,1)" position='left' offsetX={17} onPress={this._toggleModal} />
                } */}

                {this.state.isIncidentReady ?
                    <BottomDrawer containerHeight={170} startUp={false} roundedEdges={true}>
                        {this.renderContent()}
                    </BottomDrawer> :
                    <ActionButton
                        buttonColor="#2d2d2d"
                        shadowStyle={{ shadowRadius: 10, shadowColor: 'black', shadowOpacity: 1 }}
                        position='left'
                        offsetX={13}
                        onPress={this._toggleModal}
                        icon={<Image source={require("../images/sendreport.png")} />}
                    />
                }

                <Modal isVisible={this.state.isModalVisible}
                    style={{
                        justifyContent: 'center',
                        borderRadius: 20,
                        shadowRadius: 10,
                        width: screen.width - 50,
                        backgroundColor: 'white',

                    }}
                >
                    <TouchableOpacity onPress={this._toggleModal}>
                        <Image
                            style={{ width: 45, height: 45, marginLeft: 240 }}
                            source={require('../images/cancel.png')}
                        />
                    </TouchableOpacity>
                    <Text style={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        textAlign: 'center',
                        marginTop: 20,
                        marginBottom: 15
                    }}> INCIDENT DESCRIPTION
                    </Text>
                    <Text style={{
                        fontSize: 20,
                        textAlign: 'center',
                        marginTop: 20,
                        marginBottom: 15
                    }}>  {this.state.isIncidentReady === true ? (
                        <Text>
                            Incident Type: {this.state.incidentType}
                            Incident Location: {this.state.incidentLocation}
                            {/* Photo of Incident: <Image source={{ uri: this.state.image_uri }} style={{ width: 100, height: 100 }}></Image> */}

                        </Text>
                    ) : (<Text> No Incident Yet</Text>)
                        }
                    </Text>
                </Modal>
            </View>
        );
    }
}


const styles = StyleSheet.create({
    user: {
        position: 'absolute',
        top: 150
    },
    main: {
        flex: 1,
        padding: 30,
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: '#6565fc'
    },
    container: {
        ...StyleSheet.absoluteFillObject,
        flex: 1,
        // justifyContent: 'center',
        // alignItems: 'center',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    title: {
        marginBottom: 20,
        fontSize: 25,
        textAlign: 'center'
    },
    itemInput: {
        height: 50,
        padding: 4,
        marginRight: 5,
        fontSize: 23,
        borderWidth: 1,
        borderColor: 'black',
        borderRadius: 8,
        color: 'black'
    },
    buttonText: {
        fontSize: 18,
        color: '#111',
        alignSelf: 'center'
    },
    button: {
        height: 45,
        flexDirection: 'row',
        backgroundColor: 'white',
        borderColor: 'white',
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 10,
        marginTop: 10,
        alignSelf: 'stretch',
        justifyContent: 'center'
    },
    valueText: {
        fontSize: 18,
        marginBottom: 50,
    },
    destinationInput: {
        borderWidth: 0.5,
        borderColor: "grey",
        height: 40,
        marginTop: 10,
        marginLeft: 20,
        marginRight: 20,
        padding: 5,
        backgroundColor: "white"
    },
    locationSuggestion: {
        backgroundColor: "white",
        padding: 3,
        fontSize: 15,
        borderWidth: 0.5
    },
});