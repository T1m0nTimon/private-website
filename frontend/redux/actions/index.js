import * as Notifications from 'expo-notifications';
import { Constants } from 'react-native-unimodules';
import { Platform } from 'react-native';
import { CLEAR_DATA, USERS_DATA_STATE_CHANGE, USERS_LIKES_STATE_CHANGE, USERS_POSTS_STATE_CHANGE, USER_CHATS_STATE_CHANGE, USER_FOLLOWING_STATE_CHANGE, USER_POSTS_STATE_CHANGE, USER_STATE_CHANGE } from '../constants/index';
import api from '../../services/api';

let unsubscribe = [];

export function clearData() {
    return ((dispatch) => {
        for (let i = unsubscribe; i < unsubscribe.length; i++) {
            unsubscribe[i]();
        }
        dispatch({ type: CLEAR_DATA })
    })
}

export function reload() {
    return ((dispatch) => {
        dispatch(clearData())
        dispatch(fetchUser())
        dispatch(setNotificationService())
        dispatch(fetchUserFollowing())
        // Note: Skipping fetchUserPosts and fetchUserChats for now as they may not be needed
        // or can be implemented later if required
    })
}

export const setNotificationService = () => async dispatch => {
    let token;
    if (Constants.isDevice) {
        const existingStatus = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus.status !== 'granted') {
            const status = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus.status !== 'granted') {
            alert('Failed to get push token for push notification!');
            return;
        }
        token = (await Notifications.getExpoPushTokenAsync());
    } else {
        alert('Must use physical device for Push Notifications');
    }

    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: false,
            shouldSetBadge: false,
        }),
    });

    if (token != undefined) {
        // Instead of storing in Firestore, we'll store in local state or skip for now
        // In a full implementation, we'd have an API endpoint to update notification token
        console.log('Expo push token:', token);
        // TODO: Implement API call to update notification token in backend
    }
}

export const sendNotification = (to, title, body, data) => dispatch => {
    if (to == null) {
        return;
    }

    let response = fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            to,
            sound: 'default',
            title,
            body,
            data
        })
    })
}

export function fetchUser() {
    return ((dispatch) => {
        // Instead of Firestore listener, we'll make a one-time API call
        // For real-time updates, we could implement polling or websockets later
        api.auth.me()
            .then((userData) => {
                // Format user data to match what the reducer expects
                const formattedUser = {
                    uid: userData.id,
                    email: userData.email,
                    name: userData.name,
                    username: userData.username,
                    image: userData.image || 'default',
                    followersCount: userData.followersCount || 0,
                    followingCount: userData.followingCount || 0
                };
                dispatch({ type: USER_STATE_CHANGE, currentUser: formattedUser });
            })
            .catch((error) => {
                console.error('Fetch user error:', error);
                // Dispatch empty user or handle error appropriately
                dispatch({ type: USER_STATE_CHANGE, currentUser: null });
            });
    })
}

export function fetchUserChats() {
    // Chat functionality would require backend endpoints for chats
    // For now, we'll dispatch an empty array or implement later
    return ((dispatch) => {
        dispatch({ type: USER_CHATS_STATE_CHANGE, chats: [] });
    })
}

export function fetchUserPosts() {
    // Get current user's posts
    return ((dispatch) => {
        api.auth.me()
            .then((userData) => {
                return api.userAPI.getUserPosts(userData.id);
            })
            .then((response) => {
                const posts = response.posts || [];
                dispatch({ type: USER_POSTS_STATE_CHANGE, posts });
            })
            .catch((error) => {
                console.error('Fetch user posts error:', error);
                dispatch({ type: USER_POSTS_STATE_CHANGE, posts: [] });
            });
    })
}

export function fetchUserFollowing() {
    // Get list of users that current user follows
    return ((dispatch) => {
        api.auth.me()
            .then((userData) => {
                return api.userAPI.getFollowed();
            })
            .then((response) => {
                const followedUsers = response.followed || [];
                // Extract just the user IDs for the following array
                const followingIds = followedUsers.map(user => user.id);
                dispatch({ type: USER_FOLLOWING_STATE_CHANGE, following: followingIds });
            })
            .catch((error) => {
                console.error('Fetch user following error:', error);
                dispatch({ type: USER_FOLLOWING_STATE_CHANGE, following: [] });
            });
    })
}

export function fetchUsersData(uid, getPosts) {
    return ((dispatch, getState) => {
        // Check if we already have this user data
        const found = getState().usersState.users.some(el => el.uid === uid);
        if (!found) {
            // Fetch user profile from API
            api.userAPI.getProfile(uid)
                .then((response) => {
                    const user = response.user || {};
                    // Format to match expected structure
                    const formattedUser = {
                        uid: user.id,
                        email: user.email,
                        name: user.name,
                        username: user.username,
                        image: user.image || 'default',
                        followersCount: user.followersCount || 0,
                        followingCount: user.followingCount || 0
                    };
                    dispatch({ type: USERS_DATA_STATE_CHANGE, user: formattedUser });
                })
                .catch((error) => {
                    console.error('Fetch user data error:', error);
                });

            if (getPosts) {
                dispatch(fetchUsersFollowingPosts(uid));
            }
        }
    })
}

export function fetchUsersFollowingPosts(uid) {
    return ((dispatch, getState) => {
        api.userAPI.getUserPosts(uid)
            .then((response) => {
                const posts = response.posts || [];
                // Add user info to each post for consistency with original format
                const postsWithUser = posts.map(post => ({
                    ...post,
                    user: {
                        id: uid,
                        // We could fetch the user data here, but for now let's keep it simple
                        // In a full implementation, we'd want to include user info with each post
                        username: post.username || 'unknown',
                        name: post.userName || 'Unknown User',
                        image: post.userImage || 'default'
                    }
                }));
                dispatch({ type: USERS_POSTS_STATE_CHANGE, posts: postsWithUser, uid });
            })
            .catch((error) => {
                console.error('Fetch users following posts error:', error);
                dispatch({ type: USERS_POSTS_STATE_CHANGE, posts: [], uid });
            });
    })
}

export function fetchUsersFollowingLikes(uid, postId) {
    // For likes, we need to check if current user liked this post
    // Since we don't have a direct endpoint for this, we'll check by getting the post's likes
    // or we can infer from the likesCount if we had that info
    // For simplicity, we'll assume we don't have this info and set currentUserLike to false
    // A better implementation would have an endpoint to check like status
    return ((dispatch, getState) => {
        // We'll skip the real-time listener for now and just dispatch a default value
        // In a full implementation, we'd need to check if the current user liked this post
        dispatch({ type: USERS_LIKES_STATE_CHANGE, postId, currentUserLike: false });
    })
}

export function queryUsersByUsername(username) {
    return ((dispatch, getState) => {
        return new Promise((resolve, reject) => {
            if (username.length == 0) {
                resolve([])
            }
            // Since we don't have a search endpoint yet, we'll return empty array
            # In a full implementation, we'd add a search endpoint to the backend
            resolve([]);
        })
    })
}

export function deletePost(item) {
    return ((dispatch, getState) => {
        return new Promise((resolve, reject) => {
            # We need a delete post endpoint in the backend
            # For now, we'll just reject or show an error
            reject(new Error('Delete post functionality not implemented'));
        })
    })
}