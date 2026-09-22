import { FontAwesome5 } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import api from '../../../services/api';
import { container, text, utils } from '../../styles';


function Search(props) {
    const [users, setUsers] = useState([]);

    const handleSearch = async (searchTerm) => {
        if (searchTerm.trim() === '') {
            setUsers([]);
            return;
        }

        try {
            const response = await api.userAPI.searchUsers(searchTerm);
            const foundUsers = response.users || [];
            // Format users to match expected structure
            const formattedUsers = foundUsers.map(user => ({
                id: user.id,
                name: user.name,
                username: user.username,
                image: user.image || 'default',
                // Add other fields as needed
                followersCount: user.followersCount || 0,
                followingCount: user.followingCount || 0
            }));
            setUsers(formattedUsers);
        } catch (error) {
            console.error('Search error:', error);
            setUsers([]);
        }
    };

    return (
        <View style={[utils.backgroundWhite, container.container]}>
            <View style={{ marginVertical: 30, paddingHorizontal: 20 }}>
                <TextInput
                    style={utils.searchBar}
                    placeholder="Type Here..."
                    onChangeText={(search) => handleSearch(search)}
                />
            </View>


            <FlatList
                numColumns={1}
                horizontal={false}
                data={users}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[container.horizontal, utils.padding10Sides, utils.padding10Top]}
                        onPress={() => props.navigation.navigate("Profile", { uid: item.id, username: undefined })}>

                        {item.image == 'default' ?
                            (
                                <FontAwesome5
                                    style={[utils.profileImage, utils.marginBottomSmall]}
                                    name="user-circle" size={50} color="black" />

                            )
                            :
                            (
                                <Image
                                    style={[utils.profileImage, utils.marginBottomSmall]}
                                    source={{
                                        uri: item.image
                                    }}
                                />
                            )
                        }
                        <View style={utils.justifyCenter}>
                            <Text style={text.username}>{item.username}</Text>
                            <Text style={text.name} >{item.name}</Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View >
    )
}

const mapDispatchProps = (dispatch) => bindActionCreators({ })(dispatch);

export default connect(null, mapDispatchProps)(Search);