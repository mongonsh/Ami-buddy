import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Dashboard from '../screens/Dashboard';
import CameraScreen from '../screens/CameraScreen';
import ResultScreen from '../screens/ResultScreen';
import LocalGallery from '../screens/LocalGallery';
import CharacterCreation from '../screens/CharacterCreation';
import HomeworkUpload from '../screens/HomeworkUpload';
import { COLORS } from '../theme/colors';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerTintColor: COLORS.navy,
          headerTitleStyle: { color: COLORS.navy },
          contentStyle: { backgroundColor: COLORS.cream }
        }}
      >
        <Stack.Screen name="Dashboard" component={Dashboard} options={{ title: 'アミバディ' }} />
        <Stack.Screen name="CameraScan" component={CameraScreen} options={{ title: 'スキャン' }} />
        <Stack.Screen name="LocalGallery" component={LocalGallery} options={{ headerShown: false }} />
        <Stack.Screen name="CharacterCreation" component={CharacterCreation} options={{ headerShown: false }} />
        <Stack.Screen name="HomeworkUpload" component={HomeworkUpload} options={{ headerShown: false }} />
        <Stack.Screen name="Result" component={ResultScreen} options={{ title: 'けっか' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
