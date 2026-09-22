import { FontAwesome5 } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { fetchUsersData, sendNotification } from '../../../redux/actions/index';
import api from '../../../services/api';
import { container, text, utils } from '../../styles';
import { timeDifference } from '../../utils';


function Comment(props) {
    const [comments, setComments] = useState([])
    const [postId, setPostId] = useState("")
    const [input, setInput] = useState("")
    const [refresh, setRefresh] = useState(false)
    const [textInput, setTextInput] = useState(null)

    useEffect(() => {
        getComments();
    }, [props.route.params.postId, props.users, refresh])

    const matchUserToComment = (comments) => {
        for (let i = 0; i < comments.length; i++) {
            if (comments[i].hasOwnProperty('user')) {
                continue;
            }

            const user = props.users.find(x => x.uid === comments[i].creator)
            if (user == undefined) {
                props.fetchUsersData(comments[i].creator, false)
            } else {
                comments[i].user = user
            }
        }
        setComments(comments)
        setRefresh(false)
    }
    const getComments = () => {
        if (props.route.params.postId !== postId || refresh) {
            // Use our API to get comments
            api.postAPI.getComments(props.route.params.postId)
                .then((response) => {
                    const fetchedComments = response.comments || [];
                    // Format comments to match expected structure
                    const formattedComments = fetchedComments.map(comment => ({
                        ...comment,
                        creator: comment.userId // Assuming API returns userId
                    }));
                    matchUserToComment(formattedComments);
                })
                .catch((error) => {
                    console.error('Get comments error:', error);
                    setComments([]);
                    setRefresh(false);
                })
            setPostId(props.route.params.postId)
        } else {
            matchUserToComment(comments)
        }
    }
    const onCommentSend = () => {
        const textToSend = input;

        if (input.length == 0) {
            return;
        }
        setInput("")

        textInput.clear()
        // Use our API to create comment
        api.postAPI.createComment(props.route.params.postId, textToSend)
            .then(() => {
                setRefresh(true)
            })
            .catch((error) => {
                console.error('Create comment error:', error);
                // Optionally show error to user
            })

        // Send notification using our action (which uses Expo, not Firebase)
        // Note: We need to get the post owner's user ID to send notification
        // For now, we'll skip the notification or implement it later
        // In a full implementation, we'd get the post data to find the owner
    }

    return (
        <View style={[container.container, container.alignItemsCenter, utils.backgroundWhite]}>
            <FlatList
                numColumns={1}
                horizontal={false}
                data={comments}
                renderItem={({ item }) => (
                    <View style={utils.padding10}>
                        {item.user !== undefined ?
                            <View style={container.horizontal}>
                                {item.user.image == 'default' ?
                                    (
                                        <FontAwesome5
                                            style={[utils.profileImageSmall]}
                                            name="user-circle" size={35} color="black"
                                            onPress={() => props.navigation.navigate("Profile", { uid: item.user.uid, username: undefined })} />

                                    )
                                    :
                                    (
                                        <Image
                                            style={[utils.profileImageSmall]}
                                            source={{
                                                uri: item.user.image
                                            }}
                                            onPress={() => props.navigation.navigate("Profile", { uid: item.user.uid, username: undefined })} />
                                    )
                                }
                                <View style={{ marginRight: 30 }}>
                                    <Text style={[utils.margin15Right, utils.margin5Bottom, { flexWrap: 'wrap' }]}>
                                        <Text style={[text.bold]}
                                            onPress={() => props.navigation.navigate("Profile", { uid: item.user.uid, username: undefined })}>
                                            {item.user.name}
                                        </Text>
                                        {" "}  {item.text}
                                    </Text>
                                    <Text
                                        style={[text.grey, text.small, utils.margin5Bottom]}>
                                        {timeDifference(new Date(), item.creation.toDate())}
                                    </Text>
                                </View>

                            </View>
                            : null}


                    </View>
                )
                }
            />
            <View style={[utils.borderTopGray]}>
                < View style={[container.horizontal, utils.padding10, utils.alignItemsCenter, utils.backgroundWhite]} >
                    {
                        props.currentUser.image == 'default' ?
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
                                        uri: props.currentUser.image
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
                            placeholder='comment...'
                            onChangeText={(input) => setInput(input)} />

                        < TouchableOpacity
                            onPress={() => onCommentSend()}
                            style={{ width: 100, alignSelf: 'center' }}>
                            <Text style={[text.bold, text.medium, text.deepskyblue]} >Post</Text>
                        </TouchableOpacity >
                    </View>

                </View >

            </View>

        </View >
    )
}


const mapStateToProps = (store) => ({
    users: store.usersState.users,
    currentUser: store.userState.currentUser
})
const mapDispatchProps = (dispatch) => bindActionCreators({ fetchUsersData, sendNotification }, dispatch);

export default connect(mapStateToProps, mapDispatchProps)(Comment);