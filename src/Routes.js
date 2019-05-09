import React, { Component } from 'react';
import { Router, Stack, Scene } from 'react-native-router-flux';

import Login from './components/Login';
import Register from './components/Register';
import Volunteer from './components/Volunteer';
//import ReportIncident from './components/ReportIncident';
import RegularUser from './components/RegularUser';
import Responder from './components/Responder';
import LoadingScreen from './components/LoadingScreen';
import ForgotPassword from './components/forgotPassword';


export default class Routes extends Component {

    render() {
        return (
            <Router>
                <Stack key="root" hideNavBar={true}>
                    <Scene key="loading" component={LoadingScreen} title="Loading" />
                    <Scene key="login" component={Login} title="Login" />
                    <Scene key="signup" component={Register} title="Register" />
                    <Scene key="forgotPass" component={ForgotPassword} title="Forgot Password" />
                    <Scene key="RegularUser" component={RegularUser} title="RegularUser" />
                    <Scene key="Volunteer" component={Volunteer} title="Volunteer" />
                    <Scene key="Responder" component={Responder} title="Responder" />

                </Stack>
            </Router>
        )
    }
}