import React, { useState } from 'react';
import { Button, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { container, form } from '../styles';
import api from '../../services/api';

export default function Register(props) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const onRegister = async () => {
        // Validation
        if (!name || !username || !email || !password) {
            setError('Please fill out all fields');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await api.auth.register({
                email,
                password,
                name,
                username
            });

            // Registration successful, navigate to login
            props.navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }]
            });
        } catch (err) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={container.center}>
            <View style={container.formCenter}>
                <TextInput
                    style={form.textInput}
                    placeholder="Username"
                    value={username}
                    keyboardType="twitter"
                    onChangeText={(username) => setUsername(username.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, '').replace(/[^a-z0-9]/gi, ''))}
                />
                <TextInput
                    style={form.textInput}
                    placeholder="Name"
                    value={name}
                    onChangeText={setName}
                />
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
                    title={loading ? 'Registering...' : 'Register'}
                    onPress={onRegister}
                    disabled={loading}
                />
            </View>

            <View style={form.bottomButton} >
                <Text
                    onPress={() => props.navigation.navigate("Login")} >
                    Already have an account? Sign In.
                </Text>
            </View>
        </View>
    )
}