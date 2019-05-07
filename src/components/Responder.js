

import React, { Component } from "react";
import {
    Text, TouchableOpacity, View, Image, Dimensions, TextInput, StyleSheet, TouchableHighlight, Keyboard, Alert,
    DrawerLayoutAndroid
} from "react-native";
import Modal from 'react-native-modal';
import ActionButton, { ActionButtonItem } from 'react-native-action-button';
import AwesomeButton from 'react-native-really-awesome-button';
import Drawer from 'react-native-circle-drawer'
import Button from 'react-native-button'
import BottomDrawer from 'rn-bottom-drawer';
import RadioGroup from 'react-native-radio-buttons-group';
import Icon from 'react-native-vector-icons/FontAwesome';

import 'babel-polyfill';
import 'es6-symbol';

import app from '../config/fire';
import apiKey from '../config/apiKey';
import _ from 'lodash';

import MapView, { PROVIDER_GOOGLE, Polyline, Marker } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import PolyLine from '@mapbox/polyline';
var screen = Dimensions.get('window');
const TAB_BAR_HEIGHT = 100;
var profileName = 'LOL';


export default class Responder extends Component {
    _isMounted = false;
    constructor(props) {
        super(props);
        this.state = {
            isModalVisible: false,
            isAccepted: false,
            isIncidentReady: false,
            destinationPlaceId: '',
            isRequestingResponders: '',
            dispatchedResponder: false,
            incidentID: '',
            userId: '',
            originalResponder: false,
            userKey: "",
            userType: '',
            incidentType: "Vehicular Accident",
            incidentLocation: "",
            firstName: "",
            lastName: "",
            user: null,
            unresponded: true,
            isResponding: false,
            isSettled: false,
            incidentPhoto: '',
            reportedBy: '',
            timeReceive: '',
            timeResponded: '',
            responderResponding: '',
            volunteerResponding: '',
            requestResponders: false,
            coordinates: {
                lng: null,
                lat: null
            },
            pointCoords: [],
            error: "",
            latitude: null,
            longitude: null,
            locationPredictions: [],
            data: [
                {
                    label: "Vehicular Accident",
                    value: "Vehicular Accident"
                },
                {
                    label: "Physical Injury",
                    value: "Physical Injury"
                }
            ]
        };
        this.onChangeDestinationDebounced = _.debounce(
            this.onChangeDestination,
            1000
        );

    }

    onPress = data => {
        this.setState({ data });

        let selectedButton = this.state.data.find(e => e.selected == true);
        selectedButton = selectedButton ? selectedButton.value : this.state.data[0].label;
        this.setState({ incidentType: selectedButton });

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
            app.database().ref(`mobileUsers/Responder/${that.state.userId}`).update({
                incidentID: '',
                isAccepted: false,
            })

        })


    }

    changeIncidentState = (incidentType, incidentLocation, incidentID, destinationPlaceId, userId) => {

        var time = Date(Date.now());
        date = time.toString();


        app.database().ref(`incidents/${incidentID}`).update({
            isRespondingResponder: true,
            unrespondedResponder: false,
            responderResponding: this.state.userId,
            timeReceive: date,
        });

        app.database().ref(`mobileUsers/Responder/${userId}`).update({
            isAccepted: true,

        })
        this.getRouteDirection(destinationPlaceId, incidentLocation);
    }

    arrivedLocation = () => {
        this.setState({ isIncidentReady: false });
        var time = Date(Date.now());
        date = time.toString();

        let incidentID = this.state.incidentId;
        console.log("incidentID on arrived Location", incidentID);
        app.database().ref(`incidents/${incidentID}`).update({
            timeResponderResponded: date,
        });
    }

    clearSettled = () => {

        let incidentID = this.state.incidentId;
        let userId = this.state.userId;
        console.log("is settled?", incidentID, userId);

        this.setState({
            isSettled: false,
            dispatchedResponder: false,
            isIncidentReady: false,
            originalResponder: false,
            isRequestingResponders: false,
            requestResponders: false,
            incidentId: "",
            isAccepted: false,

        })
        var responderListen = app.database().ref(`mobileUsers/Responder/${userId}`)
        responderListen.update({
            incidentID: '',
            isAccepted: false,
        })
    }

    isSettled = () => {

        let incidentID = this.state.incidentId;
        let userId = this.state.userId;
        console.log("is settled?", incidentID, userId);

        this.setState({
            isSettled: false,
            dispatchedResponder: false,
            isIncidentReady: false,
            originalResponder: false,
            isRequestingResponders: false,
            requestResponders: false,
            incidentId: "",
            isAccepted: false,

        })
        var responderListen = app.database().ref(`mobileUsers/Responder/${userId}`)
        responderListen.update({
            incidentID: '',
            isAccepted: false,
        })

        app.database().ref(`incidents/${incidentID}`).update({
            isSettled: true,
        });
    }


    arrivedLocationRequested = () => {
        var time = Date(Date.now());
        date = time.toString();


        let incidentID = this.state.incidentId;
        let userId = this.state.userId;
        console.log("incidentID on arrived Location", incidentID, userId);
        app.database().ref(`incidents/${incidentID}/requestResponders/${userId}`).update({
            timeArrived: date,
        });
    }

    arrivedLocationDispatched = () => {
        var time = Date(Date.now());
        date = time.toString();

        let incidentID = this.state.incidentId;
        let userId = this.state.userId;
        console.log("incidentID on arrived Location", incidentID, userId);
        app.database().ref(`incidents/${incidentID}/additionalDispatched/${userId}`).update({
            timeArrived: date,
        });
    }

    isRequestingResponders = (incidentId, userId, destinationPlaceId, incidentLocation) => {
        var time = Date(Date.now());
        date = time.toString();


        console.log("REQUEST", this.state.userId);
        this.setState({
            // isRequestingResponders: true,
            isIncidentReady: true,
            requestResponders: true,
        })

        app.database().ref(`incidents/${incidentId}/requestResponders/${userId}`).update({
            timeArrived: '',
            timeReceive: date,
        });

        app.database().ref(`mobileUsers/Responder/${userId}`).update({
            isAccepted: true,
        });
        this.getRouteDirection(destinationPlaceId, incidentLocation);
    }

    requestAdditionalResponders = () => {
        let incidentID = this.state.incidentId;
        let userId = this.state.userId;
        console.log("incidentID on arrived Location", incidentID, userId);
        app.database().ref(`incidents/${incidentID}`).update({
            isRequestingResponders: true,
        });


    }

    requestAdditionalVolunteers = () => {
        let incidentID = this.state.incidentId;
        let userId = this.state.userId;
        console.log("incidentID on arrived Location", incidentID, userId);
        app.database().ref(`incidents/${incidentID}`).update({
            isRequestingVolunteers: true,
        });
    }

    additionalDispatchedResponders = (incidentID, userId, destinationPlaceId, incidentLocation) => {
        var time = Date(Date.now());
        date = time.toString();


        console.log("OTHER DISPATCHED", this.state.userId);
        this.setState({
            isIncidentReady: true,
            dispatchedResponder: true,
        })

        app.database().ref(`incidents/${incidentID}/additionalDispatched/${userId}`).update({
            timeArrived: '',
            timeReceive: date,
        });

        app.database().ref(`mobileUsers/Responder/${userId}`).update({
            isAccepted: true,
        });

        this.getRouteDirection(destinationPlaceId, incidentLocation);

    }

    incidentListener = (userId) => {
        // this._isMounted = true;
        console.log("INCIDNE LISTENER", userId);
        this.responderListen = app.database().ref(`mobileUsers/Responder/${userId}`)
        var that = this;
        var incidentDetails = '';


        this.responderListen.on('value', (snapshot) => {

            userId = this.state.userId;
            var data = snapshot.val();
            var incidentID = data.incidentID;
            console.log("incident ID", incidentID);

            if (incidentID !== "") {
                console.log("hey i got here");
                this.userIncidentId = app.database().ref(`incidents/${incidentID}`);
                app.database().ref(`mobileUsers/Responder/${that.state.userId}`).update({
                    incidentID: incidentID,
                })
                this.userIncidentId.on('value', (snapshot) => {
                    incidentDetails = snapshot.val() || null;
                    var incidentType = incidentDetails.incidentType;
                    var incidentLocation = incidentDetails.incidentLocation;
                    var destinationPlaceId = incidentDetails.destinationPlaceId;
                    var responderResponding = incidentDetails.responderResponding;
                    var isSettled = incidentDetails.isSettled;
                    var isRequestingResponders = incidentDetails.isRequestingResponders;


                    if (incidentID !== "" && responderResponding === "" && isSettled === false) {
                        console.log("ARGUMENT 1");
                        Alert.alert(
                            "INCIDENT DETAILS ",
                            `Incident Type: ${incidentType}
                                                 Incident Location: ${incidentLocation}
                                                                         `
                            ,
                            [
                                { text: "Respond", onPress: () => { that.changeIncidentState(incidentType, incidentLocation, incidentID, destinationPlaceId, userId) } },
                            ],
                            { cancelable: false }
                        );
                        that.setState({ originalResponder: true, isIncidentReady: true, incidentType, incidentLocation, destinationPlaceId, userId, incidentId: incidentID });
                    }
                    else if (incidentID !== "" && responderResponding === userId && isSettled === false) {
                        console.log("ARGUMENT 2");
                        console.log("same responder");

                        that.setState({ originalResponder: true, isIncidentReady: true, incidentType, incidentLocation, destinationPlaceId, userId, incidentId: incidentID, isSettled: false });
                        that.getRouteDirection(destinationPlaceId, incidentLocation);
                    }
                    else if (incidentID !== "" && responderResponding !== userId && isRequestingResponders === true && this.state.requestResponders === false && isSettled === false) {

                        console.log("ARGUMENT 3");
                        Alert.alert(
                            "REQUESTING ADDITIONAL RESPONDER ",
                            `Incident Type: ${incidentType}
                                                 Incident Location: ${incidentLocation}
                                                                         `
                            ,
                            [
                                { text: "Respond", onPress: () => { that.isRequestingResponders(incidentID, userId, destinationPlaceId, incidentLocation) } },
                            ],
                            { cancelable: false }
                        );
                        that.setState({ incidentType, incidentLocation, destinationPlaceId, incidentId: incidentID, userId });
                    }
                    else if (incidentID !== "" && responderResponding === userId && isSettled === true) {
                        console.log("ARGUMENT 4");
                        console.log("same additional responder has acceted")
                        that.setState({ isIncidentReady: false, isSettled: true, incidentId: incidentID });
                        Alert.alert(
                            "INCIDENT HAS BEEN SETTLED",
                            `Incident Type: ${incidentType}
                                                 Incident Location: ${incidentLocation}
                                                                         `
                            ,
                            [
                                { text: "Ok", onPress: () => { that.clearSettled() } },
                            ],
                            { cancelable: false }
                        );

                    }
                    else if (incidentID !== "" && responderResponding !== userId && isRequestingResponders === true && this.state.requestResponders === true && isSettled === false) {
                        //condition requested responders
                        console.log("ARGUMENT 5");
                        that.setState({ isSettled: false, isIncidentReady: true, incidentType, incidentLocation, destinationPlaceId, incidentId: incidentID, userId });
                        that.getRouteDirection(destinationPlaceId, incidentLocation);
                    }
                    else if (incidentID !== "" && responderResponding !== userId && isRequestingResponders === true && this.state.requestResponders === true && isSettled === true) {
                        console.log("ARGUMENT 6");
                        that.setState({ isSettled: true, isIncidentReady: false, incidentType, incidentLocation, destinationPlaceId, incidentId: incidentID, userId });
                        Alert.alert(
                            "INCIDENT HAS BEEN SETTLED",
                            `Incident Type: ${incidentType}
                                                 Incident Location: ${incidentLocation}
                                                                         `
                            ,
                            [
                                { text: "Ok", onPress: () => { that.clearSettled() } },
                            ],
                            { cancelable: false }
                        );
                    }
                    else if (incidentID !== "" && responderResponding !== userId && isRequestingResponders === false && this.state.requestResponders === false && isSettled === false) {
                        console.log("ARGUMENT 7");
                        if (that.state.dispatchedResponder === false) {
                            Alert.alert(
                                "INCIDENT DETAILS",
                                `Incident Type: ${incidentType}
                                                 Incident Location: ${incidentLocation}
                                                                         `
                                ,
                                [
                                    { text: "Respond", onPress: () => { that.additionalDispatchedResponders(incidentID, userId, destinationPlaceId, incidentLocation) } },
                                ],
                                { cancelable: false }
                            );
                            that.setState({ incidentType, incidentLocation, destinationPlaceId, incidentId: incidentID, userId });
                        }
                        this.getRouteDirection(destinationPlaceId, incidentLocation);
                    }

                    else if (incidentID !== "" && isSettled === true) {
                        console.log("ARGUMENT 8");
                        that.setState({ isSettled: true, isIncidentReady: false, incidentType, incidentLocation, destinationPlaceId, incidentId: incidentID, userId });
                        Alert.alert(
                            "INCIDENT HAS BEEN SETTLED",
                            `Incident Type: ${incidentType}
                                                 Incident Location: ${incidentLocation}
                                                                         `
                            ,
                            [
                                { text: "Ok", onPress: () => { that.clearSettled() } },
                            ],
                            { cancelable: false }
                        );
                    }
                    else {
                        console.log("system is FLAWED")
                    }
                })
            }
            else {
                console.log("incident Id is not here");
                that.setState({ isIncidentReady: false, destinationPlaceId: '', incidentLocation: '', isSettled: false, });
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
                app.database().ref(`mobileUsers/Responder/${this.state.userId}`).update({
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

                app.database().ref(`mobileUsers/Responder/${this.state.userId}`).update({
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
            { enableHighAccuracy: true, distanceFilter: 3, interval: 4000 }
        );
    }


    componentWillUnmount() {
        this._isMounted = false;
        Geolocation.clearWatch(this.watchId);
        this.user2.off();
        this.responderListen.off();
        this.userIncidentId.off();
    }


    submitIncidentHandler = () => {
        var time = Date(Date.now());
        date = time.toString();


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
            timeReceive: date,
            timeResponderResponded: '',
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
        app.database().ref(`mobileUsers/Responder/${this.state.userId}`).update({
            incidentID: this.state.incidentUserKey,
        });

    }

    async getRouteDirection(destinationPlaceId, destinationName) {


        console.log("HIIII DESTINATION PLACE IS", destinationPlaceId);
        // destinationPlaceId = this.state.incidentPhoto;
        try {
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/directions/json?origin=${
                this.state.latitude
                },${
                this.state.longitude
                }&destination=place_id:${destinationPlaceId}&key=${apiKey}`
            );
            const json = await response.json();
            console.log(json);
            const points = PolyLine.decode(json.routes[0].overview_polyline.points);
            const pointCoords = points.map(point => {
                return { latitude: point[0], longitude: point[1] };
            });
            this.setState({
                destinationPlaceId,
                pointCoords,
                locationPredictions: [],
                incidentLocation: destinationName,
            });
            Keyboard.dismiss();
            this.map.fitToCoordinates(pointCoords);
        } catch (error) {
            console.log(error);
        }

    }


    _toggleModal = () => {
        this.setState({ isModalVisible: !this.state.isModalVisible });
    }

    _openDrawer = () => {
        this.refs.DRAWER.open();
    }


    // renderSideMenu() {
    //     return (
    //         <View>
    //             <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 50 }}>
    //                 Hello {profileName}!
    //              </Text>
    //             <TouchableOpacity onPress={() => { console.log(profileName) }}>
    //                 <Text style={{ color: 'white', fontSize: 30 }}>
    //                     Profile
    //                  </Text>
    //             </TouchableOpacity>
    //             <TouchableOpacity onPress={this.signOutUser}>
    //                 <Text style={{ color: 'white', fontSize: 30 }}>
    //                     Log Out
    //                  </Text>
    //             </TouchableOpacity>
    //         </View>
    //     )
    // }

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
                    {this.state.requestResponders === true ?
                        <View style={styles.buttonContainer}><AwesomeButton height={50} width={190} backgroundColor="#467541" onPress={this.arrivedLocationRequested}>I have arrived! Requested. </AwesomeButton></View>
                        :
                        this.state.dispatchedResponder === false ?
                            <View style={styles.buttonContainer}><AwesomeButton height={50} width={190} backgroundColor="#467541" onPress={this.arrivedLocation}>I have arrived! </AwesomeButton></View>
                            :
                            <View style={styles.buttonContainer}><AwesomeButton height={50} width={190} backgroundColor="#467541" onPress={this.arrivedLocationDispatched}>I have arrived! Dispatched. </AwesomeButton></View>
                    }
                    <View style={styles.buttonContainer}><AwesomeButton height={50} width={190} backgroundColor="#2c6c7c" onPress={this.isSettled}>Incident is settled!</AwesomeButton></View>
                </View>
            </View>
        )
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
                    title={`${this.state.incidentType}`}
                    description={this.state.incidentLocation}

                >
                    <Image
                        source={require("../images/alert.png")}
                        style={{ height: 45, width: 45 }} />
                </Marker>
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

        const locationPredictions = this.state.locationPredictions.map(
            prediction => (
                <TouchableHighlight
                    key={prediction.id}
                    onPress={() =>
                        this.getRouteDirection(
                            prediction.place_id,
                            prediction.description
                        )
                    }
                >

                    <Text style={styles.locationSuggestion}>
                        {prediction.description}
                    </Text>
                </TouchableHighlight>
            )
        );


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

                >
                    {getUserLocation}
                    {this.state.isIncidentReady === true ? polylinemarker : null}
                    {this.state.isIncidentReady === true ? marker : null}
                </MapView>

                {!this.state.isIncidentReady ? null :

                    <ActionButton buttonColor="orange" position='left' offsetY={45} offsetX={13}
                        renderIcon={() => (<Icon name="user-plus" style={styles.actionButtonIcon} />)}>
                        <ActionButton.Item buttonColor='#3498db' title="I need more responders" onPress={() => { this.requestAdditionalResponders() }}>
                            <Icon name="user-plus" style={styles.actionButtonIcon} />
                        </ActionButton.Item>
                        <ActionButton.Item buttonColor='#1abc9c' title="I need more volunteers" onPress={() => { this.requestAdditionalVolunteers() }}>
                            <Image source={require("../images/sendreport.png")} />
                        </ActionButton.Item>
                    </ActionButton>
                }

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
                    }}>INPUT INCIDENT
                    </Text>
                    <RadioGroup radioButtons={this.state.data} onPress={this.onPress} />
                    <TextInput
                        placeholder="Enter location.."
                        style={styles.destinationInput}
                        onChangeText={incidentLocation => {
                            this.setState({ incidentLocation });
                            this.onChangeDestinationDebounced(incidentLocation);
                        }}
                        value={this.state.incidentLocation}

                    />
                    {locationPredictions}
                    <Button
                        style={{ fontSize: 18, color: 'white' }}
                        onPress={this.submitIncidentHandler}
                        containerStyle={{
                            padding: 8,
                            marginLeft: 70,
                            marginRight: 70,
                            height: 40,
                            borderRadius: 6,
                            backgroundColor: 'mediumseagreen',
                            marginTop: 20,

                        }}
                        disabled={!this.state.destinationPlaceId || !this.state.incidentLocation || !this.state.incidentType}
                    >

                        <Text style={{ justifyContent: 'center', color: 'white' }} >Submit Incident</Text>
                    </Button>

                </Modal>
            </View>
        );
    }
}


const styles = StyleSheet.create({
    mapDrawerOverlay: {
        position: 'absolute',
        left: 0,
        top: 0,
        opacity: 0.0,
        height: Dimensions.get('window').height,
        width: 10,
    },
    profile: {
        marginLeft: 12,
        marginTop: 10
    },
    actionButtonIcon: {
        fontSize: 20,
        height: 22,
        color: 'white',
    },
    responderButtons: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 10,
        alignItems: 'center',
        marginBottom: 15
    },
    buttonContainer: {
        flex: 1,
    },
    main: {
        flex: 1,
        justifyContent: 'center',
        justifyContent: 'center',
        backgroundColor: '#232323'
    },
    user: {
        position: 'absolute',
        top: 150
    },
    shadow: {
        shadowColor: 'black',
        shadowRadius: 100,
        shadowOpacity: 1
    },
    container: {

        flex: 1,
        // justifyContent: 'center',
        // alignItems: 'center',
    },
    map: {
        //     width: screen.width,
        // height: Dimensions.get('window').height,
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