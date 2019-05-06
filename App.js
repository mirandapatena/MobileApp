
import React, { Component } from 'react';
import {
  Platform, StyleSheet, Text, View, StatusBar, PermissionsAndroid
} from 'react-native';


import Volunteer from './src/components/Volunteer';
import RegularUser from './src/components/RegularUser';
import Responder from './src/components/Responder';
import LoadingScreen from './src/components/LoadingScreen';
import Login from './src/components/Login';
import Register from './src/components/Register';


import 'babel-polyfill';
import 'es6-symbol'
import { YellowBox } from 'react-native';
import _ from 'lodash';
import app from './src/config/fire';

import { Actions, Scene, Router, Stack } from 'react-native-router-flux';

YellowBox.ignoreWarnings(['Setting a timer']);
const _console = _.clone(console);
console.warn = message => {
  if (message.indexOf("Setting a timer") <= -1) {
    _console.warn(message);
  }
};

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: {},
      userId: "",
      userType: [],
      userAccount: {
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        user_type: '',
        isMobile: null,
        contactNumber: ''
      }
    };
  }

  componentDidMount() {
    this.authListener();
    this.askUserGPSPermission();
  }

  askUserGPSPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Persistence',
          message:
            'Tabang! application needs access to your location',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('You can user user location');
      }
      else {
        console.log('Location permission denied');
      }
    }
    catch (error) {
      console.log(error);
    }
  }
  authListener() {
    app.auth().onAuthStateChanged(user => {
      if (user) {
        this.setState({ user, userId: user.uid });
        this.userDetails();
      } else {
        setTimeout(() => Actions.login(), 1500);
        this.setState({ user: null, userId: null });
      }
    });

  }

  userDetails = () => {
    let userValue = "";
    console.log("userr", this.state.userId);
    app.database().ref(`users/${this.state.userId}`).once("value").then(snapshot => {
      userValue = snapshot.val();
      // console.log("uservalues", userValue);
      this.setState({ userType: userValue.user_type });
      this.setState({ userAccount: userValue });
      // this.props.logUser(this.state.userAccount);
    })
      .then(() => {
        this.rerouteUserAccess();
      })
      .catch(err => console.log(err));

  }

  rerouteUserAccess = () => {
    // console.log("thisss", this.state.userType);
    switch (this.state.userType) {
      case 'Regular User':
        // console.log('Regular User');
        Actions.RegularUser();
        // browserHistory.push('/administrator');
        //this.props.logUser();
        break;
      case 'Responder':
        // console.log('Responder');
        // browserHistory.push('/ccpersonnel');
        Actions.Responder();
        break;
      case 'Volunteer':
        // console.log('Volunteer');
        Actions.Volunteer();
        // browserHistory.push('/ccpersonnel');
        break;
      default: Actions.login();
        break;
    }
  }

  Volunteer() {
    Actions.userMap();
  }

  render() {
    return (
      <View style={styles.container}>
        <Router>
          <Stack key="root" hideNavBar={true}>
            <Scene key="loading" component={LoadingScreen} initial={true} title="Loading" />
            <Scene key="login" component={Login} title="Login" />
            <Scene key="signup" component={Register} title="Register" />
            <Scene key="RegularUser" component={RegularUser} title="RegularUser" />
            <Scene key="Volunteer" component={Volunteer} title="Volunteer" />
            <Scene key="Responder" component={Responder} title="Responder" />
          </Stack>
        </Router>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1

    // alignItems: 'center',
    // backgroundColor: '#455a64',
  }
});
