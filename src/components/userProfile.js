import React, { Component } from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
var screen = Dimensions.get('window');

class UserProfile extends Component {


    render() {
        return (
            <View styles={styles.main}>
                <TouchableOpacity onPress={this._toggleModal}>
                    <Image
                        style={{ width: 65, height: 65 }}
                        source={require('../images/userProfile.png')}
                    />
                </TouchableOpacity>

            </View>
        );
    }

}


const styles = StyleSheet.create({
    main: {
        flex: 1,
    },

});


export default UserProfile;