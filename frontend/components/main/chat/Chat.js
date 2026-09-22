import { FontAwesome5 } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CachedImage from 'react-native-expo-cached-image';
import { Provider } from 'react-native-paper';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { fetchUserChats, sendNotification } from '../../../redux/actions/index';
import { container, text, utils } from '../../styles';
import { timeDifference } from '../../utils';


function Chat(props) {
    const [user, setUser] = useState(null)
    const [chat, setChat] = useState(null)
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState("")
    const [textInput, setTextInput] = useState(null)
    const [flatList, setFlatList] = useState(null)
    const [initialFetch, setInitialFetch] = useState(false)

    useEffect(() => {
        // Get user data from route params instead of Firestore
        if (props.route.params.user) {
            setUser(props.route.params.user);
        }
    }, [props.route.params.user])

    useEffect(() => {
        if (user == null) {
            return;
        }
        if (initialFetch) {
            return;
        }

        // Find chat from props.chats (Redux state)
        const chat = props.chats.find(el => el.users && el.users.includes(user.uid));
        setChat(chat)


        props.navigation.setOptions({
            headerTitle: () => (
                <View style={[container.horizontal, utils.alignItemsCenter, { overflow: 'hidden' }]}>
                    {
                        user.image == 'default' ?
                            (
                                <FontAwesome5
                                    style={[utils.profileImageSmall]}
                                    name="user-circle" size={35} color="black" />
                            )
                            :
                            (
                                <Image
                                    style={[utils.profileImageSmall]}
                                    source={{
                                        uri: user.image
                                    }}
                                />
                            )
                    }
                    <Text style={[text.bold, text.large, { flex: 1 }]} numberOfLines={1} ellipsizeMode='tail'>{user.username}</Text>
                </View>
            ),
        });
        if (chat !== undefined) {
            // For now, we'll just show a placeholder since we don't have real-time messaging implemented
            // In a full implementation, we would:
            // 1. Load messages from API when chat loads
            // 2. Set up real-time updates via websockets or polling
            // 3. Allow sending new messages via API
            setMessages([]); // Clear messages for now
            setInitialFetch(true)
        } else {
            // Create chat would require backend endpoint
            // For now, we'll just set initialFetch to true to prevent looping
            setInitialFetch(true)
        }
    }, [user, props.chats])

    const onSend = () => {
        // Chat sending functionality would require backend endpoints
        // For now, we'll just show an alert or do nothing
        alert('Chat functionality is coming soon!');
        // Clear input anyway
        setInput("")
        if (textInput) {
            textInput.clear()
        }
    }

    return (
        <View style={[container.container, container.alignItemsCenter, utils.backgroundWhite]}>
            <Provider>

                <FlatList
                    numColumns={1}
                    horizontal={false}
                    data={messages}
                    ref={setFlatList}
                    onContentSizeChange={() => { if (flatList != null) flatList.scrollToEnd({ animated: true }) }}
                    renderItem={({ item }) => (
                        <View style={[utils.padding10, container.container, item.creator == props.currentUser?.id ? container.chatRight : container.chatLeft]}>
                            {item.creator !== undefined && item.creation !== null ?
                                <View style={container.horizontal}>
                                    <View>
                                        <Text style={[utils.margin5Bottom, text.white]}>
                                            {item.text}
                                        </Text>
                                        {item.post != null ?

                                            <TouchableOpacity style={{ marginBottom: 20, marginTop: 10 }} onPress={() => { props.navigation.navigate("Post", { item: item.post, user: item.post.user }) }}>
                                                {item.post.type == 0 ?
                                                    <CachedImage
                                                        cacheKey={item.id}
                                                        style={{ aspectRatio: 1 / 1, width: 200 }}
                                                        source={{ uri: item.post.downloadURLStill }}
                                                    />
                                                    :

                                                    <CachedImage
                                                        cacheKey={item.id}
                                                        style={{ aspectRatio: 1 / 1, width: 200 }}
                                                        source={{ uri: item.post.downloadURL }}
                                                    />
                                                }
                                            </TouchableOpacity>
                                            : null}
                                        <Text
                                            style={[text.grey, text.small, utils.margin5Bottom, text.whitesmoke]}>
                                            {timeDifference(new Date(), item.creation.toDate())}
                                        </Text>
                                    </View>
                                </View>
                                : null}


                        </View>
                    )
                    }
                />

                < View style={[container.horizontal, utils.padding10, utils.alignItemsCenter, utils.backgroundWhite, utils.borderTopGray]} >
                    {
                        props.currentUser?.image == 'default' ?
                            (
                                <FontAwesome5
                                    style={[utils.profileImageSmall]}
                                    name="user-circle" size={35} color="black" />
                            )
                            :
                            (
                                <Image
                                    style={[utils.profileImageSmall]}
                                    source={{
                                        uri: props.currentUser?.image
                                    }}
                                />
                            )
                    }


                    <View style={[container.horizontal, utils.justifyCenter, utils.alignItemsCenter]}>
                        < TextInput
                            ref={input => { setTextInput(input) }}
                            value={input}
                            multiline={true}
                            style={[container.fillHorizontal, container.input, container.container]}
                            placeholder='message...'
                            onChangeText={(input) => setInput(input)} />

                        < TouchableOpacity
                            onPress={() => onSend()}
                            style={{ width: 100, alignSelf: 'center' }}>
                            <Text style={[text.bold, text.medium, text.deepskyblue]} >Send</Text>
                        </TouchableOpacity >
                    </View>
                </View >

            </Provider>

        </View >
    )
}

const mapStateToProps = (store) => ({
    currentUser: store.userState.currentUser,
    chats: store.userState.chats,
    following: store.userState.following,
    feed: store.usersState.feed,
})

const mapDispatchProps = (dispatch) => bindActionCreators({ fetchUserChats, sendNotification }, dispatch);

export default connect(mapStateToProps, mapDispatchProps)(Chat);