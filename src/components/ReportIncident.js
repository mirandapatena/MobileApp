import React, { Component } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  Image,
  Dimensions,
  TextInput,
  StyleSheet,
  TouchableHighlight,
  Keyboard,
  Alert
} from "react-native";
import Modal from "react-native-modal";
import Button from "react-native-button";
import "babel-polyfill";
import "es6-symbol";
import RadioGroup from "react-native-radio-buttons-group";
import apiKey from "../config/apiKey";
import _ from "lodash";
import Login from '../components/Login';

import db, { app, auth, provier } from '../config/fire';

import { Actions } from "react-native-router-flux";
import MapView, { PROVIDER_GOOGLE, Polyline, Marker } from "react-native-maps";

import PolyLine from "@mapbox/polyline";

var screen = Dimensions.get("window");

export default class ReportIncident extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isModalVisible: false,
      userKey: "",
      userType: '',
      incidentType: "",
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
      userId: '',
      // userID: '',
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
  // update state
  onPress = data => {
    this.setState({ data });

    let selectedButton = this.state.data.find(e => e.selected == true);
    selectedButton = selectedButton
      ? selectedButton.value
      : this.state.data[0].label;
    this.setState({ incidentType: selectedButton });
    console.log("rock", this.state.incidentType);
  };

  authListener() {
    app.auth().onAuthStateChanged((user) => {
      if (user) {
        this.setState({
          user,
          userId: user.uid,
        });
      } else {
        this.setState({ user: null });
      }
    });


  }

  Volunteer() {
    // Actions.login();
    <Login />
  }

  componentDidMount() {
    this.authListener();



    this.watchId = navigator.geolocation.watchPosition(

      position => {
        this.setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });


        var userType = '';
        var firstName = '';

        console.log("HI", this.state.userId);
        var user2 = db.ref(`users/${this.state.userId}/`);
        user2.on('value', function (snapshot) {
          const data2 = snapshot.val() || null;
          console.log("data2", data2);

          if (data2) {
            userType = data2.user_type;
            firstName = data2.firstName;
            lastName = data2.lastName;
          }
        })
        this.setState({ userType, firstName });
        console.log("USER TYPE", this.state.userType, this.state.firstName)

        db.ref(`mobileUsers/${this.state.userType}/${this.state.userId}`).update({
          coordinates: {
            lng: this.state.longitude,
            lat: this.state.latitude
          },
        });

      },
      error => this.setState({ error: error.message }),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 }
    );
  }

  componentWillUnmount() {
    navigator.geolocation.clearWatch(this.watchId);
  }

  async getRouteDirection(destinationPlaceId, destinationName) {
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
        pointCoords,
        locationPredictions: [],
        incidentLocation: destinationName
      });
      Keyboard.dismiss();
      this.map.fitToCoordinates(pointCoords);
    } catch (error) {
      console.error(error);
    }
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


  _toggleModal = () => {
    this.setState({ isModalVisible: !this.state.isModalVisible });
  };

  signOutUser() {
    app.auth().signOut().then(function () {
      // Sign-out successful.
      console.log("SUCCESFULL LOG OUT");

    }).catch(function (error) {
      // An error happened.
      console.log(error)
    });

  }


  submitIncidentHandler = () => {

    //THIS CODE HAS BUGS ------------- for getting first name of report user
    // var userid = this.props.user;
    // db.ref('users/' + this.props.userId).on('value', (snapshot) => {
    //   var user = snapshot.val();
    //   this.setState({ reportedBy: user.firstName })
    //   console.log("mam", this.props.userId)
    //   console.log("ser", user)
    // })

    var coords = this.state.pointCoords;
    var coords2 = this.state.pointCoords[coords.length - 1];
    var coordLat = coords2.latitude;
    var coordLng = coords2.longitude;
    db.ref("/incidents").push({
      incidentType: this.state.incidentType,
      incidentLocation: this.state.incidentLocation,
      unresponded: true,
      isResponding: false,
      isSettled: false,
      incidentPhoto: '',
      reportedBy: this.state.firstName + " " + this.state.lastName,
      timeReceive: '',
      timeResponded: '',
      responderResponding: '',
      volunteerResponding: '',
      coordinates: {
        lat: coordLat,
        lng: coordLng
      },
    });
    this.setState({
      incidentType: "",
      incidentLocation: "",
      unresponded: null,
      isResponding: null,
      isSettled: null,
      lng: null,
      lat: null
    });
    console.log(this.state.incidentsList);
    Alert.alert(
      "Attention: ",
      "Report has been sent",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel"
        },
        { text: "OK", onPress: () => console.log("Ok Button") }
      ],
      { cancelable: false }
    );
  };

  render() {

    let marker = null;
    let len = this.state.pointCoords;
    if (len.length > 1) {
      marker = (
        <Marker
          coordinate={this.state.pointCoords[len.length - 1]}
        />
      );
    }

    if (this.state.latitude === null) return null;

    const locationPredictions = this.state.locationPredictions.map(
      prediction => (
        <TouchableHighlight
          key={prediction.id}
          onPress={() =>
            // this.pressedPrediction(prediction)
            this.getRouteDirection(
              prediction.place_id,
              prediction.description,
            )
          }
        >
          <Text style={styles.locationSuggestion}>
            {prediction.description}
          </Text>
        </TouchableHighlight>
      )
    );

    // let selectedButton = this.state.data.find(e => e.selected == true);
    // selectedButton = selectedButton ? selectedButton.value : this.state.data[0].label;

    return (
      <View style={styles.container}>
        <MapView
          ref={map => {
            this.map = map;
          }}
          provider={PROVIDER_GOOGLE} // remove if not using Google Maps
          style={styles.map}
          region={{
            latitude: this.state.latitude,
            longitude: this.state.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.0121
          }}
          showsUserLocation={true}
        >
          <Polyline
            coordinates={this.state.pointCoords}
            strokeWidth={4}
            strokeColor="red"
          />
          {marker}
        </MapView>
        <TouchableOpacity
          style={{
            top: screen.height - 650,
            paddingLeft: 100
          }}
          onPress={() => this.signOutUser()}
        >
          <Image
            style={{ width: 65, height: 65 }}
            source={require("../images/logout.png")}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            top: screen.height - 180,
            paddingLeft: 20,
            paddingBottom: 30
          }}
          onPress={this._toggleModal}
        // onPress={() => this.signOutUser()}
        >
          <Image
            style={{ width: 65, height: 65 }}
            source={require("../images/addLogo.png")}
          />
        </TouchableOpacity>
        <Modal
          isVisible={this.state.isModalVisible}
          style={{
            justifyContent: "center",
            borderRadius: 20,
            shadowRadius: 10,
            width: screen.width - 50,
            backgroundColor: "white"
          }}
        >
          <TouchableOpacity onPress={this._toggleModal}>
            <Image
              style={{ width: 45, height: 45, marginLeft: 240 }}
              source={require("../images/cancel.png")}
            />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              textAlign: "center",
              marginTop: 20,
              marginBottom: 15
            }}
          >
            INPUT INCIDENT
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
            style={{ fontSize: 18, color: "white" }}
            onPress={this.submitIncidentHandler}
            // onPress={this._toggleModal}
            containerStyle={{
              padding: 8,
              marginLeft: 70,
              marginRight: 70,
              height: 40,
              borderRadius: 6,
              backgroundColor: "mediumseagreen",
              marginTop: 20
            }}
          >
            <Text style={{ justifyContent: "center", color: "white" }}>
              Submit Incident
            </Text>
          </Button>
        </Modal>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    padding: 30,
    flexDirection: "column",
    justifyContent: "center",
    backgroundColor: "#6565fc"
  },
  container: {
    ...StyleSheet.absoluteFillObject,
    flex: 1
    // justifyContent: 'center',
    // alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject
  },
  title: {
    marginBottom: 20,
    fontSize: 25,
    textAlign: "center"
  },
  itemInput: {
    height: 50,
    padding: 4,
    marginRight: 5,
    fontSize: 23,
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 8,
    color: "black"
  },
  buttonText: {
    fontSize: 18,
    color: "#111",
    alignSelf: "center"
  },
  button: {
    height: 45,
    flexDirection: "row",
    backgroundColor: "white",
    borderColor: "white",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    marginTop: 10,
    alignSelf: "stretch",
    justifyContent: "center"
  },
  valueText: {
    fontSize: 18,
    marginBottom: 50
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
  }
});
