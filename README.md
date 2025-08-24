# 🍅 Pomodoro Timer App

A comprehensive, enterprise-level Pomodoro timer built with React Native, Expo, and Firebase. Features advanced session tracking, real-time statistics, offline support, and intelligent data management.

## ✨ Features

- ⏰ **Advanced Timer Management** - Background execution, system interruption handling
- 📊 **Real-time Statistics** - Live updates via Firestore listeners with intelligent caching
- 🔒 **Firebase Authentication** - Email/password and Google OAuth
- 📱 **Mobile-First** - Optimized for iOS and Android
- 🚀 **Offline-First Architecture** - Robust offline queuing with conflict resolution
- 📈 **Performance Analytics** - Complete monitoring and error tracking
- 🛡️ **Data Integrity** - Comprehensive validation, corruption recovery, automated backups
- 🎯 **Custom Presets** - Flexible timer configurations with validation

## 🏗️ Architecture

### Service Layer (`src/services/`)
- **`sessionManager.ts`** - Complete session lifecycle management
- **`settingsManager.ts`** - Settings persistence with validation
- **`statisticsManager.ts`** - Real-time statistics with Firestore listeners
- **`timerManager.ts`** - Advanced timer with background execution
- **`dataValidator.ts`** - Comprehensive data validation
- **`dataRecovery.ts`** - Data integrity and recovery mechanisms
- **`analyticsManager.ts`** - Performance monitoring and analytics

### Hook Layer (`src/hooks/`)
- **`useSessionManager.ts`** - Session state management
- **`useSettings.ts`** - Settings management
- **`useStatistics.ts`** - Real-time statistics updates
- **`useAdvancedTimer.ts`** - Advanced timer with interruption handling

### Component Architecture
```
App Root
├── /auth - Authentication screens
└── /(tabs) - Main application
    ├── /index - Timer interface
    ├── /stats - Statistics dashboard  
    └── /settings - User preferences
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g @expo/cli`
- Firebase project with Authentication & Firestore enabled

### Installation

```bash
# Clone and install dependencies
git clone <your-repo>
cd pomodoroapp
npm install

# Start development server
npm start

# Run on specific platforms
npm run ios     # iOS simulator
npm run android # Android emulator
```

### Prerequisites

Firebase is already configured and working! ✅

- Firebase Authentication (Email/Password + Google OAuth)
- Firestore database with proper security rules
- Real-time listeners and offline persistence enabled

## 📊 Data Architecture

### Session Data Flow
```
Session Start → sessionManager.startSession()
     ↓
Firebase Write → sessions collection
     ↓
Real-time Update → statisticsManager listeners
     ↓
UI Update → useStatistics hook
```

### Offline Architecture
```
Network Available:
  Actions → Firebase → Real-time sync

Network Unavailable:
  Actions → Local Queue → Background sync when online
```

### Database Structure
```
/sessions
  - sessionId: string
  - userId: string
  - type: 'work' | 'break' | 'longBreak'
  - startTime: Timestamp
  - endTime: Timestamp
  - plannedDuration: number
  - actualDuration: number
  - completed: boolean
  - date: string (YYYY-MM-DD)

/users/{userId}
  - profile data
  - settings
  - aggregated statistics
  - custom presets

/analytics
  - performance metrics
  - user interactions
  - error events
```

## 🔧 Development Standards

### Code Organization
```
src/
├── config/          # Firebase and app configuration
├── services/        # Business logic and data management
├── hooks/           # React hooks for state management
├── providers/       # React context providers
├── types/           # TypeScript type definitions
└── components/      # Reusable UI components
```

### Naming Conventions
- **Files**: camelCase (`sessionManager.ts`)
- **Services**: PascalCase classes (`SessionManager`)
- **Hooks**: Prefix with `use` (`useSessionManager`)
- **Components**: PascalCase (`CustomTimerModal`)
- **Constants**: UPPER_SNAKE_CASE (`TIMER_PRESETS`)

### Error Handling Pattern
```typescript
try {
  await serviceOperation();
} catch (error) {
  console.error('Operation failed:', error);
  analyticsManager.trackError('operation_failed', error.message);
  // Graceful fallback or user notification
}
```

### Real-time Updates Pattern
```typescript
// Service layer - establish listeners
subscribeToData(userId: string, callback: (data: any) => void) {
  const unsubscribe = onSnapshot(query, callback);
  return unsubscribe;
}

// Hook layer - manage subscriptions
useEffect(() => {
  if (user) {
    const unsubscribe = service.subscribeToData(user.uid, setData);
    return () => unsubscribe();
  }
}, [user]);
```

### Offline-First Pattern
```typescript
// Always queue operations
async performOperation(data: any) {
  try {
    await firebaseOperation(data);
  } catch (error) {
    await queueForOffline(data);
    throw error;
  }
}

// Process queue when online
async processOfflineQueue() {
  const queue = await getOfflineQueue();
  for (const item of queue) {
    await processQueueItem(item);
  }
}
```

### Testing Standards
```bash
# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📱 Build & Deploy

### Development Build
```bash
# Preview builds for testing
eas build --profile preview --platform ios
eas build --profile preview --platform android
```

### Production Build
```bash
# Production builds for app stores
eas build --profile production --platform ios
eas build --profile production --platform android
```

### Deployment Checklist
- [ ] Firebase project configured with production settings
- [ ] Security rules updated and tested
- [ ] OAuth credentials configured for production
- [ ] Analytics and error tracking enabled
- [ ] Performance monitoring configured
- [ ] App Store/Play Store metadata prepared

## 🐛 Troubleshooting

### Common Issues

**Authentication Problems**
```bash
# Check OAuth configuration
# Verify bundle ID/package name consistency
# Test with Expo Go vs production builds
```

**Timer Not Working**
```bash
# Check session manager initialization
# Verify Firebase permissions
# Test background app permissions
```

**Statistics Not Updating**
```bash
# Check Firestore listeners
# Verify security rules
# Test offline/online transitions
```

### Debug Mode
```typescript
// Enable detailed logging
if (__DEV__) {
  console.log('Session state:', sessionManager.getActiveSession());
  analyticsManager.trackUserInteraction('debug_mode_enabled', 'system');
}
```

## 📈 Performance Optimization

### Firebase Optimization
- Firestore indexes for common queries
- Offline persistence enabled
- Real-time listeners optimized
- Batch writes for related operations

### React Native Optimization
- Image assets optimized for mobile
- Bundle size monitoring
- Memory leak prevention
- Performance profiling enabled

### Monitoring
```typescript
// Performance tracking
analyticsManager.trackPerformance('screen_render', renderTime);
analyticsManager.trackUserInteraction('button_press', 'timer_screen');
analyticsManager.trackError('validation_error', errorMessage);
```

## 🤝 Contributing

1. Follow the established architecture patterns
2. Add comprehensive error handling
3. Include performance tracking
4. Write tests for new functionality
5. Update documentation

---

Built with ❤️ using React Native, Expo, and Firebase