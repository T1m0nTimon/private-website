import { Feather } from '@expo/vector-icons';
import { Video } from 'expo-av';
import React, { useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MentionsTextInput from 'react-native-mentions';
import { Snackbar } from 'react-native-paper';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { fetchUserPosts, sendNotification } from '../../../redux/actions/index';
import api from '../../../services/api';
import { container, navbar, text, utils } from '../../styles';


function Save(props) {
    const [caption, setCaption] = useState("")
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState(false)
    const [data, setData] = useState("")
    const [keyword, setKeyword] = useState("")

    useLayoutEffect(() => {
        props.navigation.setOptions({
            headerRight: () => (
                <Feather style={navbar.image} name="check" size={24} color="green" onPress={() => { uploadImage() }} />
            ),
        });
    }, [caption]);

    const uploadImage = async () => {
        if (uploading) {
            return;
        }
        setUploading(true)

        try {
            // Upload media using our API
            const uploadResponse = await api.uploadAPI.upload(props.route.params.source);
            const mediaUrl = uploadResponse.url;

            // For now, we'll treat all media as video/posts without separate thumbnail
            // In a full implementation, we might extract a thumbnail for videos
            const downloadURLStill = null; // Placeholder

            savePostData(mediaUrl, downloadURLStill);
        } catch (uploadError) {
            console.error('Upload error:', uploadError);
            setUploading(false);
            setError(true);
        }
    }

    const savePostData = async (downloadURL, downloadURLStill) => {
        try {
            // Create post using our API
            const postData = {
                media: {
                    uri: downloadURL,
                    type: 'video/mp4', // Adjust based on actual file type
                    fileName: 'post.mp4'
                },
                caption: caption
            };

            const response = await api.postAPI.create(postData);

            // Handle success
            props.fetchUserPosts()
            props.navigation.popToTop()
        } catch (error) {
            console.error('Save post error:', error);
            setUploading(false)
            setError(true)
        }
    }

    // Simplified mention handling - in a full implementation, we'd have API endpoints for this
    const renderSuggestionsRow = ({ item }, hidePanel) => {
        return (
            <TouchableOpacity onPress={() => onSuggestionTap(item.username, hidePanel)}>
                <View style={styles.suggestionsRowContainer}>
                    <View style={styles.userIconBox}>
                        <Image
                            style={{ aspectRatio: 1 / 1, height: 45 }}
                            source={{
                                uri: item.image
                            }}
                        />
                    </View>
                    <View style={styles.userDetailsBox}>
                        <Text style={styles.displayNameText}>{item.name}</Text>
                        <Text style={styles.usernameText}>@{item.username}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        )
    }

    const onSuggestionTap = (username, hidePanel) => {
        hidePanel();
        const comment = caption.slice(0, - keyword.length)
        setCaption(comment + '@' + username + " ");
    }

    // Simplified mention suggestions - in a full implementation, we'd have a search endpoint
    const callback = (keyword) => {
        setKeyword(keyword)
        // For now, we'll return empty suggestions since we don't have a search endpoint
        setData([])

        // In a full implementation, we would call:
        // api.userAPI.searchUsersByUsername(keyword.substring(1))
        //   .then(users => setData(users))
        //   .catch(err => console.error('Search error:', err));
    }

    return (
        <View style={[container.container, utils.backgroundWhite]}>
            {uploading ? (
                <View style={[container.container, utils.justifyCenter, utils.alignItemsCenter]}>
                    <ActivityIndicator style={utils.marginBottom} size="large" />
                    <Text style={[text.bold, text.large]}>Upload in progress...</Text>
                </View>
            ) : (
                <View style={[container.container]}>
                    <View style={[container.container, utils.backgroundWhite, utils.padding15]}>
                        <View style={[{ marginBottom: 20, width: '100%' }]}>
                            <MentionsTextInput
                                textInputStyle={{ borderColor: '#ebebeb', borderWidth: 1, padding: 5, fontSize: 15, width: '100%' }}
                                suggestionsPanelStyle={{ backgroundColor: 'rgba(100,100,100,0.1)' }}
                                loadingComponent={() => <View style={{ flex: 1, width: 200, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /></View>}
                                textInputMinHeight={30}
                                textInputMaxHeight={80}
                                trigger={'@'}
                                triggerLocation={'new-word-only'} // 'new-word-only', 'anywhere'
                                value={caption}
                                onChangeText={setCaption}
                                triggerCallback={callback.bind(this)}
                                renderSuggestionsRow={renderSuggestionsRow.bind(this)}
                                suggestionsData={data}
                                keyExtractor={(item, index) => item.username}
                                suggestionRowHeight={45}
                                horizontal={true}
                                MaxVisibleRowCount={3}
                            />
                        </View>
                        <View>
                            {props.route.params.type ?
                                <Image
                                    style={container.image}
                                    source={{ uri: props.route.params.source }}
                                    style={{ aspectRatio: 1 / 1, backgroundColor: 'black' }}
                                />
                                :
                                <Video
                                    source={{ uri: props.route.params.source }}
                                    shouldPlay={true}
                                    isLooping={true}
                                    resizeMode="cover"
                                    style={{ aspectRatio: 1 / 1, backgroundColor: 'black' }}
                                />
                            }
                        </View>
                    </View>
                    <Snackbar
                        visible={error}
                        duration={2000}
                        onDismiss={() => setError(false)}>
                        Something Went Wrong!
                    </Snackbar>
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        height: 300,
        justifyContent: 'flex-end',
        paddingTop: 100
    },
    suggestionsRowContainer: {
        flexDirection: 'row',
    },
    userAvatarBox: {
        width: 35,
        paddingTop: 2
    },
    userIconBox: {
        height: 45,
        width: 45,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#54c19c'
    },
    usernameInitials: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 14
    },
    userDetailsBox: {
        flex: 1,
        justifyContent: 'center',
        paddingLeft: 10,
        paddingRight: 15
    },
    displayNameText: {
        fontSize: 13,
        fontWeight: '500'
    },
    usernameText: {
        fontSize: 12,
        color: 'rgba(0,0,0,0.6)'
    }
});

const mapStateToProps = (store) => ({
    currentUser: store.userState.currentUser
})

const mapDispatchProps = (dispatch) => bindActionCreators({ fetchUserPosts, sendNotification }, dispatch);


export default connect(mapStateToProps, mapDispatchProps)(Save);