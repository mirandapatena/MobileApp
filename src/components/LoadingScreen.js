import React, { Component } from 'react';
import {
  StyleSheet, Text, View, TextInput,
  TouchableOpacity, Alert, Keyboard,
  Image
} from 'react-native';

import { Actions } from 'react-native-router-flux';

export default class LoadingScreen extends Component {

  render() {
    return ( 
      <View style ={{
          height: '100%',
          width: '100%',
          position: 'relative',
          backgroundColor : '#833030',
          alignItems: 'center'
      }}>
        <Image
          style ={{
            height: '33%',
            width: '30%',
            position: 'absolute',
            top: '15%',
            resizeMode: 'contain'
          }}
          source={require('../images/logo.png')} />
        <Image 
          style={{
            height: '22%',
            width:'22%',
            top: '40%',
            position: 'absolute',
            resizeMode: 'contain'
          }} 
          source={require('../images/loading_screen.gif')} />
        <Text 
          style = {{
            height: '10%',
            width: '100%',
            position:'absolute',
            top: '60%',
            fontSize: 15,
            fontWeight: 'bold',
            color: '#000',
            textAlign: 'center',
            textAlignVertical: 'center'
          }}>
          {'Almost there, please wait..'}
        </Text>
      </View>
    );
  }
}
