import { Stack } from 'expo-router/stack';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#e74c3c' },
        animation: 'fade',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
          title: 'Sign In',
        }} 
      />
    </Stack>
  );
}