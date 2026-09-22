import React, { useState } from 'react';
import { Button, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { container, form } from '../styles';
import api from '../../services/api';

export default function Login(props) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const onLogin = async () => {
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await api.auth.login({ email, password });

            // Navigate to main screen (auth state will be picked up by App.js)
            props.navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }]
            });
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={container.center}>
            <View style={container.formCenter}>
                <TextInput
                    style={form.textInput}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                />
                <TextInput
                    style={form.textInput}
                    placeholder="Password"
                    value={password}
                    secureTextEntry={true}
                    onChangeText={setPassword}
                />
                {loading && (
                    <ActivityIndicator size="small" color="#fff" style={{ marginTop: 10 }} />
                )}
                {!loading && error && (
                    <Text style={{ color: 'red', marginTop: 10 }}>{error}</Text>
                )}
                <Button
                    style={form.button}
                    title={loading ? 'Logging in...' : 'Sign In'}
                    onPress={onLogin}
                    disabled={loading}
                />
            </View>

            <View style={form.bottomButton} >
                <Text
                    title="Register"
                    onPress={() => props.navigation.navigate("Register")} >
                    Don't have an account? SignUp.
                </Text>
            </View>
        </View>
    )
}