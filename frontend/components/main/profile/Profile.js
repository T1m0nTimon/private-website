import { FontAwesome5 } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { sendNotification } from '../../../redux/actions/index';
import api from '../../../services/api';
import { container, text, utils } from '../../styles';
import CachedImage from '../random/CachedImage';


function Profile(props) {
    const [userPosts, setUserPosts] = useState([])
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [following, setFollowing] = useState(false)

    useEffect(() => {
        loadProfileData();
    }, [props.route.params.uid, props.following, props.currentUser, props.posts])

    const loadProfileData = async () => {
        try {
            const currentUserId = props.currentUser ? props.currentUser.id : null;
            const profileUid = props.route.params.uid;

            // Check if this is the current user's profile
            if (currentUserId && currentUserId === parseInt(profileUid)) {
                setUser(props.currentUser);
                setUserPosts(props.posts);
                setLoading(false);
                return;
            }

            // Fetch user profile from API
            const userResponse = await api.userAPI.getProfile(profileUid);
            const userData = userResponse.user;

            if (userData) {
                // Set navigation title
                // Note: We can't directly set navigation title here without navigation prop
                // In a full implementation, we might use useFocusEffect or navigation.setOptions in useEffect
                setUser({
                    uid: userData.id,
                    email: userData.email,
                    name: userData.name,
                    username: userData.username,
                    image: userData.image || 'default',
                    description: userData.description || '', // Assuming we have this field
                    followersCount: userData.followersCount || 0,
                    followingCount: userData.followingCount || 0
                });
            } else {
                setUser(null);
            }

            // Fetch user posts from API
            const postsResponse = await api.userAPI.getUserPosts(profileUid);
            const postsData = postsResponse.posts || [];

            // Format posts to match expected structure
            const formattedPosts = postsData.map(post => ({
                ...post,
                // Assuming API returns userId, we might want to add user info
                // For now, we'll keep it as is and the Post component can fetch user data if needed
            }));

            setUserPosts(formattedPosts);
            setLoading(false);
        } catch (error) {
            console.error('Load profile error:', error);
            setUser(null);
            setUserPosts([]);
            setLoading(false);
        }
    }

    // Update following status when following list changes
    useEffect(() => {
        if (props.currentUser && props.route.params.uid) {
            const isFollowing = props.following.includes(parseInt(props.route.params.uid));
            setFollowing(isFollowing);
        }
    }, [props.following, props.currentUser, props.route.params.uid])

    const onFollow = async () => {
        try {
            if (props.currentUser && props.route.params.uid) {
                await api.userAPI.follow(props.route.params.uid);
                setFollowing(true);

                // Send notification
                if (props.currentUser.name) {
                    // We would need to get the user's notification token to send notification
                    // For now, we'll skip the notification or implement it later
                    console.log('Would send follow notification to user:', props.route.params.uid);
                }
            }
        } catch (error) {
            console.error('Follow error:', error);
        }
    }

    const onUnfollow = async () => {
        try {
            if (props.currentUser && props.route.params.uid) {
                await api.userAPI.unfollow(props.route.params.uid);
                setFollowing(false);

                // Send notification (if needed)
                console.log('Would send unfollow notification to user:', props.route.params.uid);
            }
        } catch (error) {
            console.error('Unfollow error:', error);
        }
    }

    if (loading) {
        return (
            <View style={{ height: '100%', justifyContent: 'center', margin: 'auto' }}>
                <ActivityIndicator style={{ alignSelf: 'center', marginBottom: 20 }} size="large" color="#00ff00" />
                <Text style={[text.notAvailable]}>Loading</Text>
            </View>
        )
    }
    if (user === null) {
        return (
            <View style={{ height: '100%', justifyContent: 'center', margin: 'auto' }}>
                <FontAwesome5 style={{ alignSelf: 'center', marginBottom: 20 }} name="dizzy" size={40} color="black" />
                <Text style={[text.notAvailable]}>User Not Found</Text>
            </View>
        )
    }
    return (
        <ScrollView style={[container.container, utils.backgroundWhite]}>
            <View style={[container.profileInfo]}>
                <View style={[utils.noPadding, container.row]}>
                    {user.image == 'default' ?
                        (
                            <FontAwesome5
                                style={[utils.profileImageBig, utils.marginBottomSmall]}
                                name="user-circle" size={80} color="black" />
                        )
                        :
                        (
                            <Image
                                style={[utils.profileImageBig, utils.marginBottomSmall]}
                                source={{
                                    uri: user.image
                                }}
                            />
                        )
                    }
                    <View style={[container.container, container.horizontal, utils.justifyCenter, utils.padding10Sides]}>
                        <View style={[utils.justifyCenter, text.center, container.containerImage]}>
                            <Text style={[text.bold, text.large, text.center]}>{userPosts.length}</Text>
                            <Text style={[text.center]}>Posts</Text>
                        </View>
                        <View style={[utils.justifyCenter, text.center, container.containerImage]}>
                            <Text style={[text.bold, text.large, text.center]}>{user.followersCount}</Text>
                            <Text style={[text.center]}>Followers</Text>
                        </View>
                        <View style={[utils.justifyCenter, text.center, container.containerImage]}>
                            <Text style={[text.bold, text.large, text.center]}>{user.followingCount}</Text>
                            <Text style={[text.center]}>Following</Text>
                        </View>
                    </View>
                </View>

                <View>
                    <Text style={text.bold}>{user.name}</Text>
                    <Text style={[text.profileDescription, utils.marginBottom]}>{user.description}</Text>

                    {props.route.params.uid !== props.currentUser.id ?
                        (
                            <View style={[container.horizontal]}>
                                {following ? (
                                    <TouchableOpacity
                                        style={[utils.buttonOutlined, container.container, utils.margin15Right]}
                                        title="Following"
                                        onPress={() => onUnfollow()}>
                                        <Text style={[text.bold, text.center, text.green]}>Following</Text>
                                    </TouchableOpacity>
                                )
                                :
                                (
                                    <TouchableOpacity
                                        style={[utils.buttonOutlined, container.container, utils.margin15Right]}
                                        title="Follow"
                                        onPress={() => onFollow()}>
                                        <Text style={[text.bold, text.center, { color: '#2196F3' }]}>Follow</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    style={[utils.buttonOutlined, container.container]}
                                    title="Follow"
                                    onPress={() => props.navigation.navigate('Chat', { user })}>
                                    <Text style={[text.bold, text.center]}>Message</Text>
                                </TouchableOpacity>
                            </View>
                        )
                        :
                        <TouchableOpacity
                            style={utils.buttonOutlined}
                            onPress={() => props.navigation.navigate('Edit')}>
                            <Text style={[text.bold, text.center]}>Edit Profile</Text>
                        </TouchableOpacity>}
                </View>
            </View>

            <View style={[utils.borderTopGray]}>
                <FlatList
                    numColumns={3}
                    horizontal={false}
                    data={userPosts}
                    style={{}}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[container.containerImage, utils.borderWhite]}
                            onPress={() => props.navigation.navigate("Post", { item, user })}>
                            {item.type == 0 ?
                                <CachedImage
                                    cacheKey={item.id}
                                    style={container.image}
                                    source={{ uri: item.downloadURLStill }}
                                />
                                :
                                <CachedImage
                                    cacheKey={item.id}
                                    style={container.image}
                                    source={{ uri: item.downloadURL }}
                                />
                            }
                        </TouchableOpacity>
                    )}
                />
            </View>
        </ScrollView >
    )
}

const mapStateToProps = (store) => ({
    currentUser: store.userState.currentUser,
    posts: store.userState.posts,
    following: store.userState.following

})

const mapDispatchProps = (dispatch) => bindActionCreators({ sendNotification }, dispatch);

export default connect(mapStateToProps, mapDispatchProps)(Profile);