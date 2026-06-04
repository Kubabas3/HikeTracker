// navigation/AppNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsContext } from '../context/SettingsContext';
import WelcomeScreen     from '../screens/WelcomeScreen';
import HomeScreen        from '../screens/HomeScreen';
import AddHikeScreen     from '../screens/AddHikeScreen';
import HikeDetailsScreen from '../screens/HikeDetailsScreen';
import SettingsScreen    from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { themeStyles } = React.useContext(SettingsContext);

  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: themeStyles.background },
      }}
    >
      <Stack.Screen name="Welcome"       component={WelcomeScreen} />
      <Stack.Screen name="Home"          component={HomeScreen} />
      <Stack.Screen name="AddHike"       component={AddHikeScreen} />
      <Stack.Screen name="HikeDetails"   component={HikeDetailsScreen} />
      <Stack.Screen name="Settings"      component={SettingsScreen} />
    </Stack.Navigator>
  );
}
