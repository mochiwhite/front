import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "./src/components/Login";
import SignUp from "./src/components/SignUp";
import FirstData from "./src/components/FirstData";
import HomeScreen from "./screens/HomeScreen";
import WalkScreen from "./screens/WalkScreen";
import EndScreen from "./screens/EndScreen";
import SurveyScreen from "./screens/SurveyScreen";

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={Login}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SignUp"
          component={SignUp}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="FirstData"
          component={FirstData}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="HomeScreen"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="WalkScreen"
          component={WalkScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="EndScreen"
          component={EndScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SurveyScreen"
          component={SurveyScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
