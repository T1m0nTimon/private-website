import { getFocusedRouteNameFromRoute, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import 'expo-asset';
import _ from 'lodash';
import React, { Component } from 'react';
import { Image, LogBox, ActivityIndicator } from 'react-native';
import { Provider } from 'react-redux';
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import LoginScreen from './components/auth/Login';
import RegisterScreen from './components/auth/Register';
import MainScreen from './components/Main';
import SaveScreen from './components/main/add/Save';
import ChatScreen from './components/main/chat/Chat';
import ChatListScreen from './components/main/chat/List';
import CommentScreen from './components/main/post/Comment';
import PostScreen from './components/main/post/Post';
import EditScreen from './components/profile/Edit';
import ProfileScreen from './components/profile/Profile';
import BlockedScreen from './components/random/Blocked';
import { container } from './components/styles';
import rootReducer from './redux/reducers';
import api from './services/api';

const store = createStore(rootReducer, applyMiddleware(thunk))

LogBox.ignoreLogs(['Setting a timer']);
const _console = _.clone(console);
console.warn = message => {
  if (message.indexOf('Setting a timer') <= -1) {
    _console.warn(message);
  }
};

const logo = require('./assets/logo.png')

export class App extends Component {
  constructor(props) {
    super()
    this.state = {
      loaded: false,
      loggingIn: true,
      user: null
    }
  }

  async componentDidMount() {
    try {
      // Check if we have a stored token and get user info
      const userData = await api.auth.me();
      this.setState({
        loggedIn: true,
        user: userData,
        loaded: true,
        loggingIn: false
      })
    } catch (error) {
      // No valid token or error
      this.setState({
        loggedIn: false,
        loaded: true,
        loggingIn: false
      })
    }
  }

  render() {
    const { loaded, loggedIn, loggingIn, user } = this.state;

    if (!loaded) {
      return (
        <Image style={container.splash} source={logo} />
      )
    }

    if (loggingIn) {
      return (
        <ActivityIndicator style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} />
      )
    }

    if (!loggedIn) {
      return (
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Login">
            <Stack.Screen name="Register" component={RegisterScreen} navigation={this.props.navigation} options={{ headerShown: false }} />
            <Stack.Screen name="Login" component={LoginScreen} navigation={this.props.navigation} options={{ headerShown: false }} />
          </Stack.Navigator>
        </NavigationContainer>
      );
    }

    return (
      <Provider store={store}>
        <NavigationContainer >
          <Stack.Navigator initialRouteName="Main">
            <Stack.Screen key={Date.now()} name="Main" component={MainScreen} navigation={this.props.navigation} options={({ route }) => {
              const routeName = getFocusedRouteNameFromRoute(route) ?? 'Feed';

              switch (routeName) {
                case 'Camera': {
                  return {
                    headerTitle: 'Camera',
                  };
                }
                case 'chat': {
                  return {
                    headerTitle: 'Chat',
                  };
                }
                case 'Profile': {
                  return {
                    headerTitle: 'Profile',
                  };
                }
                case 'Search': {
                  return {
                    headerTitle: 'Search',
                  };
                }
                case 'Feed':
                default: {
                  return {
                    headerTitle: 'Instagram',
                  };
                }
              }
            }} />
            <Stack.Screen key={Date.now()} name="Save" component={SaveScreen} navigation={this.props.navigation} />
            <Stack.Screen key={Date.now()} name="video" component={SaveScreen} navigation={this.props.navigation} />
            <Stack.Screen key={Date.now()} name="Post" component={PostScreen} navigation={this.props.navigation} />
            <Stack.Screen key={Date.now()} name="Chat" component={ChatScreen} navigation={this.props.navigation} />
            <Stack.Screen key={Date.now()} name="ChatList" component={ChatListScreen} navigation={this.props.navigation} />
            <Stack.Screen key={Date.now()} name="Edit" component={EditScreen} navigation={this.props.navigation} />
            <Stack.Screen key={Date.now()} name="Profile" component={ProfileScreen} navigation={this.props.navigation} />
            <Stack.Screen key={Date.now()} name="Comment" component={CommentScreen} navigation={this.props.navigation} />
            <Stack.Screen key={Date.now()} name="ProfileOther" component={ProfileScreen} navigation={this.props.navigation} />
            <Stack.Screen key={Date.now()} name="Blocked" component={BlockedScreen} navigation={this.props.navigation} options={{ headerShown: false }} />
          </Stack.Navigator>
        </NavigationContainer>
      </Provider>
    );
  }
}

export default App