import { Stack } from "expo-router/stack";
import { View, ActivityIndicator } from "react-native";
import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../lib/context/AuthContext";

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Don't redirect while loading

    const inAuthGroup = segments[0] === "auth";
    const inTabsGroup = segments[0] === "(tabs)";

    if (!user && !inAuthGroup) {
      // User not authenticated and not on auth screen, redirect to auth
      router.replace("/auth/");
    } else if (user && inAuthGroup) {
      // User authenticated but on auth screen, redirect to main app
      router.replace("/(tabs)/");
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#e74c3c",
        }}
      >
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#e74c3c' },
      }}
    >
      <Stack.Screen
        name="auth"
        options={{
          headerShown: false,
          contentStyle: { backgroundColor: '#e74c3c' },
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
          contentStyle: { backgroundColor: '#e74c3c' },
          animation: 'fade',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
