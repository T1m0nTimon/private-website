import { FontAwesome5 } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import { Divider } from 'react-native-paper';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { fetchUsersData } from '../../../redux/actions/index';
import { container, text, utils } from '../../styles';
import { timeDifference } from '../../utils';
import CachedImage from '../random/CachedImage';


function Chat(props) {
    const [chats, setChats] = useState([])
    const [reload, setReload] = useState(false)
    const [input, setInput] = useState("")
    const [caption, setCaption] = useState("")
    const [textInput, setTextInput] = useState(null)

    useEffect(() => {
        // Process chats to add otherUser data if needed
        const processedChats = props.chats.map(chat => {
            // Skip if already processed
            if (chat.hasOwnProperty('otherUser')) {
                return chat;
            }

            // Find other user in the chat
            let otherUserId;
            if (chat.users && chat.users.length >= 2) {
                if (chat.users[0] === props.currentUser?.id) {
                    otherUserId = chat.users[1];
                } else if (chat.users[1] === props.currentUser?.id) {
                    otherUserId = chat.users[0];
                } else {
                    // If current user is not in this chat, take the first user
                    otherUserId = chat.users[0];
                }
            } else {
                // Fallback
                otherUserId = chat.users && chat.users.length > 0 ? chat.users[0] : null;
            }

            // Find user data from props.users
            const user = props.users.find(x => x.uid === otherUserId);

            return {
                ...chat,
                otherUser: user || {
                    uid: otherUserId || 'unknown',
                    name: 'Unknown User',
                    username: 'unknown',
                    image: 'default'
                }
            };
        });

        setChats(processedChats);
    }, [props.chats, props.users, props.currentUser?.id])

    const sendPost = async (item) => {
        // Chat sending functionality would require backend endpoints
        // For now, we'll just show an alert or do nothing
        alert('Chat messaging is coming soon!');
        // Clear input anyway
        setInput("")
        if (textInput) {
            textInput.clear()
        }
    }

    if (chats.length === 0) {
        return (
            <View style={{ height: '100%', justifyContent: 'center', margin: 'auto' }}>
                <FontAwesome5 style={{ alignSelf: 'center', marginBottom: 20 }} name="comments" size={40} color="black" />
                <Text style={[text.notAvailable]}>No chats available</Text>
            </View>
        )
    }
    return (
        <View style={[container.container, container.alignItemsCenter, utils.backgroundWhite]}>
            {props.route.params.post !== undefined ?
                <View style={{ flexDirection: 'row', padding: 20 }}>
                    <TextInput
                        style={[container.fillHorizontal, container.input, container.container]}
                        multiline={true}
                        ref={setTextInput}
                        placeholder="Write a message . . ."
                        onChangeText={(caption) => setInput(caption)}
                    />
                    {props.route.params.post.type === 1 ?
                        <Image
                            style={utils.profileImageSmall}
                            source={{ uri: props.route.params.post.downloadURL }}
                            style={{ aspectRatio: 1 / 1, backgroundColor: 'black', height: 80 }}
                        />
                        :
                        <CachedImage
                            cacheKey={props.route.params.post.id}
                            style={{ aspectRatio: 1 / 1, height: 80 }}
                            source={{ uri: props.route.params.post.downloadURLStill }}
                        />
                    }
                </View>
                : null}

            <Divider />

            {chats.length !== 0 ?
                <FlatList
                    numColumns={1}
                    horizontal={false}
                    data={chats}
                    keyExtractor={(item, index) => item.id.toString()}
                    renderItem={({ item }) => (
                        <View style={!item[props.currentUser?.id] ? { backgroundColor: '#d2eeff' } : null}>
                            {item.otherUser == null ? (
                                <FontAwesome5
                                    style={[utils.profileImageSmall]}
                                    name="user-circle" size={35} color="black" />
                            )
                            :
                            (
                                <TouchableOpacity style={[utils.padding15, container.horizontal]}
                                    activeOpacity={props.route.params.share ? 1 : 0}
                                    onPress={() => {
                                        if (!props.route.params.share) {
                                            props.navigation.navigate("Chat", { user: item.otherUser })
                                        }
                                    }}>
                                    <View style={container.horizontal}>
                                        {item.otherUser.image == 'default' ? (
                                            <FontAwesome5
                                                style={[utils.profileImageSmall]}
                                                name="user-circle" size={35} color="black" />
                                        )
                                        :
                                        (
                                            <Image
                                                style={[utils.profileImageSmall]}
                                                source={{
                                                    uri: item.otherUser.image
                                                }} />
                                        )}
                                    </View>

                                    <View>
                                        <Text style={[text.bold]}>{item.otherUser.name}</Text>

                                        <Text numberOfLines={1} ellipsizeMode='tail' style={[utils.margin15Right, utils.margin5Bottom, { paddingBottom: 10 }]}>
                                            {item.lastMessage || 'New chat'} {" "}
                                            {item.lastMessageTimestamp ? (
                                                <Text
                                                    style={[text.grey, text.small, utils.margin5Bottom]}>
                                                    {timeDifference(new Date(), new Date(item.lastMessageTimestamp))}
                                                </Text>
                                            ) : (
                                                <Text
                                                    style={[text.grey, text.small, utils.margin5Bottom]}>
                                                    Now
                                                </Text>
                                            )}
                                        </Text>
                                    </View>

                                    {props.route.params.share ? <TouchableOpacity
                                        style={[utils.buttonOutlined, utils.margin15Right, { backgroundColor: '#0095ff', marginLeft: 'auto', justifyContent: 'center' }]}
                                        onPress={() => sendPost(item)}>
                                        <Text style={[text.bold, { color: 'white', textAlign: 'center', textAlignVertical: 'center' }]}>Send</Text>
                                    </TouchableOpacity> :
                                        null}
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                />
                :
                <View style={{ height: '100%', justifyContent: 'center', margin: 'auto' }}>
                    <FontAwesome5 style={{ alignSelf: 'center', marginBottom: 20 }} name="comments" size={40} color="black" />
                    <Text style={[text.notAvailable]}>No chats available</Text>
                </View>
            }
        </View >
    )
}

const mapStateToProps = (store) => ({
    currentUser: store.userState.currentUser,
    chats: store.userState.chats,
    users: store.usersState.users,
})

const mapDispatchProps = (dispatch) => bindActionCreators({ fetchUsersData })(dispatch);

export default connect(mapStateToProps, mapDispatchProps)(Chat);