import React, { Component } from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';


class Logo extends Component {
    render() {
        return (
            <View style={styles.container}>
                <Image style={styles.Logo} source={require('../images/logo.png')} />

            </View>
        );
    }
}


const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        backgroundColor: '#833030',
        paddingVertical: 10,
    },
    Logo: {
        width: 120,
        height: 120
    }

});

export default Logo;