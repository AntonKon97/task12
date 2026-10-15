import "react-native-gesture-handler";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  ActivityIndicator,
  StatusBar,
  Text,
  View,
  Pressable,
} from "react-native";

import WordsNavigation from "./WordsNavigation";
import LearningNavigation from "./LearningNavigation";
import Settings from "../screens/Settings";
import { wordsLearningActions } from "../store/wordsLearningSlice";
import { themeActions } from "../store/themeSlice";
import { REFRESH_STATUSES_SPAN } from "../constants";
import { init, getWords, getTheme } from "../store/dbUtils";

const Tab = createBottomTabNavigator();

function MainNavigator() {
  const colors = useSelector((state) => state.theme.colors);
  const isDark = useSelector((state) => state.theme.isDark);
  const dispatch = useDispatch();

  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setIsLoaded(false);
      setLoadError(false);

      try {
        await init();

        const [words, savedTheme] = await Promise.all([getWords(), getTheme()]);

        if (cancelled) return;

        dispatch(wordsLearningActions.setInitial(words));
        dispatch(themeActions.setInitial(savedTheme));

        setIsLoaded(true);
      } catch (error) {
        console.error("Failed to load data from SQLite:", error);

        if (!cancelled) {
          setLoadError(true);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [dispatch, retry]);

  useEffect(() => {
    if (!isLoaded) return;

    const interval = setInterval(
      () => dispatch(wordsLearningActions.updateStatuses()),
      REFRESH_STATUSES_SPAN,
    );

    return () => clearInterval(interval);
  }, [dispatch, isLoaded]);

  if (loadError) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <Text style={{ marginBottom: 16, textAlign: "center" }}>
          Failed to load saved data. Please try again.
        </Text>

        <Pressable onPress={() => setRetry((value) => value + 1)}>
          <Text style={{ color: "#3478f6", fontSize: 18 }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!isLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar
        backgroundColor={colors.appBackground}
        barStyle={isDark ? "light-content" : "dark-content"}
      />

      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            tabBarHideOnKeyboard: true,
            headerTitleStyle: { fontWeight: "800" },
            tabBarActiveTintColor: colors.primary900,
            tabBarActiveBackgroundColor: colors.appBackground,
            tabBarInactiveBackgroundColor: colors.appBackground,
            headerStyle: {
              backgroundColor: colors.appBackground,
            },
            headerTintColor: colors.primary900,
            headerTitleAlign: "center",
          }}
        >
          <Tab.Screen
            name="Words"
            options={{
              headerShown: false,
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="list-outline" size={size} color={color} />
              ),
            }}
            component={WordsNavigation}
          />

          <Tab.Screen
            name="Learning"
            component={LearningNavigation}
            options={{
              headerShown: false,
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="book-outline" size={size} color={color} />
              ),
            }}
          />

          <Tab.Screen
            name="Settings"
            component={Settings}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="settings-outline" size={size} color={color} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}

export default MainNavigator;
