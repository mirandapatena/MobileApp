

import React, { Component } from 'react';
import {
    StyleSheet, Text, View, TextInput,
    TouchableOpacity, Button, Alert, Keyboard
} from 'react-native';
import RadioGroup from "react-native-radio-buttons-group";
import { fire2 } from '../config/fire';
import { Formik } from 'formik'
import * as yup from 'yup'

import Logo from './Logo';


class Register extends Component {
    constructor(props) {
        super(props);
        this.state = {
            email: '',
            password: '',
            firstName: '',
            lastName: '',
            contactNumber: '',
            isMobile: true,
            user_type: 'Responder',
            user: {},
            userId: '',
            data: [
                {
                    label: "Responder",
                    value: "Responder",
                    color: "white",
                },
                {
                    label: "Regular User",
                    value: "Regular User",
                    color: "white",
                },
                {
                    label: "Volunteer",
                    value: "Volunteer",
                    color: "white",
                },
            ]
        };
    }

    userType = data => {
        this.setState({ data });

        let selectedButton = this.state.data.find(e => e.selected == true);
        selectedButton = selectedButton
            ? selectedButton.value
            : this.state.data[0].label;
        this.setState({ user_type: selectedButton });

    };

    createUserAccount(
        values
    ) {

        var email = values.email;
        var password = values.password;
        const auth = fire2.auth();
        const promise = auth.createUserWithEmailAndPassword(email.trim(), password.trim());
        promise.then(user => {
            Alert.alert(JSON.stringify(`Account ${values.email} has been created`))
            Keyboard.dismiss();
            let app = fire2.database().ref('users/' + user.user.uid);
            let unverified = fire2.database().ref('unverifiedMobileUsers/' + user.user.uid);

            let regularUser = fire2.database().ref('mobileUsers/' + this.state.user_type + '/' + user.user.uid);

            let volunteer = fire2.database().ref('mobileUsers/' + this.state.user_type + '/' + user.user.uid);

            let responder = fire2.database().ref('mobileUsers/' + this.state.user_type + '/' + user.user.uid);
            if (this.state.user_type === 'Responder') {
                responder.update({
                    coordinates: {
                        lat: 0,
                        lng: 0,
                    },
                    incidentID: "",
                    isAccepted: false,
                })
            }
            else if (this.state.user_type === 'Regular User') {
                regularUser.update({
                    coordinates: {
                        lat: 0,
                        lng: 0,
                    },
                    incidentID: "",
                    isAccepted: false,
                })

            } else {
                volunteer.update({
                    coordinates: {
                        lat: 0,
                        lng: 0,
                    },
                    incidentID: "",
                    isAccepted: false,
                })
            }

            unverified.update({
                user_type: this.state.user_type,
            })

            app.update({
                email: values.email,
                password: values.password,
                firstName: values.firstName,
                lastName: values.lastName,
                contactNumber: values.contactNumber,
                isMobile: true,
                user_type: this.state.user_type,
            });

            console.log("Successfully Registered");

        }).catch(e => {
            var err = e.message;
            Alert.alert(JSON.stringify(`${err}`))
        })

    };


    render() {
        return (
            <Formik initialValues={{ firstName: '', lastName: '', email: '', contactNumber: '', password: '' }}
                onSubmit={values => {
                    this.createUserAccount(values);


                }}
                validationSchema={
                    yup.object().shape({
                        firstName: yup
                            .string()
                            .matches(/[a-zA-Z]/, 'Name cannot cintain Special Characters or Numbers')
                            .required('First Name is Required'),
                        lastName: yup
                            .string()
                            .strict(true)
                            .matches(/[a-zA-Z]/, 'Name cannot contain Special Characters or Numbers')
                            .trim("Name cannot contain Special Characters or Numbers")
                            .required('Last Name is Required'),
                        email: yup
                            .string()
                            .email('Invalid Email Format')
                            .required('Email Address is Required'),
                        contactNumber: yup
                            .number()
                            .typeError('Only Number Inputs Allowed')
                            .required('Contact Number is Required'),
                        password: yup
                            .string()
                            .strict(true)
                            .matches(/[a-zA-Z0-9]/, 'Password cannot contain Special Characters')
                            .trim('Name cannot contain Special Characters or Numbers')
                            .required('Password is Required'),
                    })
                }>
                {({ values, handleChange, errors, setFieldTouched, touched, isValid, handleSubmit }) => (
                    <View style={styles.container}>
                        <TextInput style={styles.inputBox}
                            underlineColorAndroid='rgba(0,0,0,0)'
                            placeholder="First Name"
                            placeholderTextColor="#ffffff"
                            selectionColor="#fff"
                            keyboardType="email-address"
                            value={values.firstName}
                            onChangeText={handleChange('firstName')}
                            onBlur={() => setFieldTouched('firstName')}
                        />
                        {touched.firstName && errors.firstName &&
                            <Text style={{ fontSize: 15, color: 'red' }}>{errors.firstName}</Text>
                        }
                        <TextInput style={styles.inputBox}
                            underlineColorAndroid='rgba(0,0,0,0)'
                            placeholder="Last Name"
                            placeholderTextColor="#ffffff"
                            selectionColor="#fff"
                            keyboardType="email-address"
                            value={values.lastName}
                            onChangeText={handleChange('lastName')}
                            onBlur={() => setFieldTouched('lastName')}
                        />
                        {touched.lastName && errors.lastName &&
                            <Text style={{ fontSize: 15, color: 'red' }}>{errors.lastName}</Text>
                        }
                        <TextInput style={styles.inputBox}
                            underlineColorAndroid='rgba(0,0,0,0)'
                            placeholder="Email Address"
                            placeholderTextColor="#ffffff"
                            selectionColor="#fff"
                            keyboardType="email-address"
                            value={values.email}
                            onChangeText={handleChange('email')}
                            onBlur={() => setFieldTouched('email')}
                        />
                        {touched.email && errors.email &&
                            <Text style={{ fontSize: 15, color: 'red' }}>{errors.email}</Text>
                        }
                        <TextInput style={styles.inputBox}
                            underlineColorAndroid='rgba(0,0,0,0)'
                            placeholder="Contact Number"
                            placeholderTextColor="#ffffff"
                            selectionColor="#fff"
                            keyboardType="email-address"
                            value={values.contactNumber}
                            onChangeText={handleChange('contactNumber')}
                            onBlur={() => setFieldTouched('contactNumber')}
                        />
                        {touched.contactNumber && errors.contactNumber &&
                            <Text style={{ fontSize: 15, color: 'red' }}>{errors.contactNumber}</Text>
                        }
                        <TextInput style={styles.inputBox}
                            underlineColorAndroid='rgba(0,0,0,0)'
                            placeholder="Password"
                            secureTextEntry={true}
                            placeholderTextColor="#ffffff"
                            value={values.password}
                            onChangeText={handleChange('password')}
                            onBlur={() => setFieldTouched('password')}

                        />
                        {touched.password && errors.password &&
                            <Text style={{ fontSize: 15, color: 'red' }}>{errors.password}</Text>
                        }
                        <RadioGroup radioButtons={this.state.data} onPress={this.userType} />
                        <TouchableOpacity style={styles.button}
                            disabled={!isValid}
                            onPress={handleSubmit}>

                            <Text style={styles.buttonText}>
                                Register
                    </Text>
                        </TouchableOpacity>
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
        backgroundColor: 'rgba(255, 255,255,0.2)',
        borderRadius: 25,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#ffffff',
        marginVertical: 10
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

export default Register;