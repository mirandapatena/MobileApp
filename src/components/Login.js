import React, { Component } from 'react';
import {
  StyleSheet, Text, View, TextInput,
  TouchableOpacity, Alert, Keyboard, BackHandler
} from 'react-native';
import app from '../config/fire';
import { Formik } from 'formik'
import * as yup from 'yup'

import { Actions } from 'react-native-router-flux';

import Logo from './Logo';


// import db, { app } from '../config/fire';

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      password: '',
      user: {},
      emailError: '',
      passwordError: '',
      error: ''
    }
  }


  loginUserAccount(values) {
    app.auth()
      .signInWithEmailAndPassword(values.email.trim(), values.password)
      .catch(e => {
        var err = e.message;
        console.log(err);
        this.setState({ err: 'Username or Password is Incorrect' });
      });
    console.log("Login");
    Keyboard.dismiss();


  };

  signUp() {
    Actions.signup()
  }

  Volunteer() {
    Actions.Volunteer()
  }

  Responder() {
    Actions.Responder()
  }

  userMaps() {

    Actions.RegularUser()
  }


  componentWillMount() {
    BackHandler.addEventListener('hardwareBackPress', this.onBackPress);
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.onBackPress);
  }

  onBackPress = () => {

    //Code to display alert message when use click on android device back button.
    Alert.alert(
      ' Exit From App ',
      ' Do you want to exit Tabang! Application?',
      [
        { text: 'Yes', onPress: () => BackHandler.exitApp() },
        { text: 'No', onPress: () => console.log('NO Pressed') }
      ],
      { cancelable: false },
    );

    // Return true to enable back button over ride.
    return true;
  }

  render() {
    return (
      <Formik initialValues={{ email: '', password: '' }}
        onSubmit={values => {
          this.loginUserAccount(values);
        }}
        validationSchema={
          yup.object().shape({

            email: yup
              .string()
              .email('Invalid Email Format')
              .required('Email Address is Required'),
            password: yup
              .string()
              .strict(true)
              .matches(/[a-zA-Z0-9]/, 'Password contains Special Characte')
              .trim('Password contains Special Characters')
              .required('Password is Required'),
          })
        }>
        {({ values, handleChange, errors, setFieldTouched, touched, isValid, handleSubmit }) => (

          <View style={styles.container}>

            <Logo />
            <TextInput style={styles.inputBox}
              underlineColorAndroid='rgba(0,0,0,0)'
              placeholder="Email"
              placeholderTextColor="#ffffff"
              selectionColor="#fff"
              keyboardType="email-address"
              value={values.email}
              onBlur={() => setFieldTouched('email')}
              onChangeText={handleChange('email')}
            />
            {touched.email && errors.email &&
              <Text style={{ fontSize: 15, color: 'red' }}>{errors.email}</Text>
            }
            <TextInput style={styles.inputBox}
              underlineColorAndroid='rgba(0,0,0,0)'
              placeholder="Password"
              secureTextEntry={true}
              placeholderTextColor="#ffffff"
              value={values.password}
              onBlur={() => setFieldTouched('password')}
              onChangeText={handleChange('password')}
            />
            {touched.password && errors.password &&
              <Text style={{ fontSize: 15, color: 'red' }}>{errors.password}</Text>
            }
            <Text style={{ fontSize: 15, color: 'red' }} className='catchError'>{this.state.err}</Text>

            <TouchableOpacity style={styles.button}
              disabled={!isValid}
              onPress={handleSubmit}
            >
              <Text style={styles.buttonText}>
                Login
              </Text>
            </TouchableOpacity>


            <View style={styles.signupTextCont}>
              <Text style={styles.signupText}>Don't have an account yet?</Text>
              <TouchableOpacity onPress={this.signUp}><Text style={styles.signupButton}> Signup</Text></TouchableOpacity>
            </View>
          </View>
        )}
      </Formik>


    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#833030',
  },
  signupTextCont: {
    flexGrow: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingVertical: 16,
    flexDirection: 'row'
  },
  signupText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16
  },
  signupButton: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500'
  },

  inputBox: {
    width: 300,
    borderColor: 'rgba(255, 255,255,0.3)',
    backgroundColor: 'rgba(255, 255,255,0.3)',
    borderRadius: 10,
    paddingHorizontal: 16,
    marginVertical: 10,
    marginHorizontal: 45,
    position: 'relative'
  },
  button: {
    width: 300,
    backgroundColor: '#1c313a',
    borderRadius: 25,
    marginVertical: 10,
    paddingVertical: 13
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    textAlign: 'center'
  }
});
export default Login;