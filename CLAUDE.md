# CLAUDE.md

This file provides comprehensive guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 Project Philosophy

This Pomodoro app follows **enterprise-grade development practices** with emphasis on:
- **Reliability** - Robust error handling and data integrity
- **Performance** - Optimized for mobile with real-time capabilities
- **Maintainability** - Clean architecture with clear separation of concerns
- **Scalability** - Built to handle production workloads

## Development Commands

### Running the Application
```bash
npm start                    # Start Expo development server
npm run android             # Run on Android device/emulator
npm run ios                 # Run on iOS device/simulator
npm run web                 # Run web version
```

### Building
```bash
# Development builds
eas build --profile development --platform ios
eas build --profile development --platform android

# Preview builds for testing
eas build --profile preview --platform ios
eas build --profile preview --platform android

# Production builds
eas build --profile production --platform ios
eas build --profile production --platform android
```

### Testing & Quality
```bash
npx tsc --noEmit           # Type checking
```

## 🏗️ Architecture Overview

This is a React Native Expo app with a service-oriented architecture built around Firebase.

### Service-Oriented Architecture Pattern
```
Services → Hooks → Components
   ↓        ↓         ↓
Business  React    UI Logic
 Logic   State
```

**Services** (`src/services/`)
- Pure business logic, no React dependencies
- Handle Firebase operations, data validation, caching
- Export singleton instances: `export const serviceName = new ServiceClass()`

**Hooks** (`src/hooks/`)
- Bridge between services and React components
- Manage React state and side effects
- Pattern: `useServiceName()` returns interface with actions and state

**Components**
- Pure UI logic, minimal business logic
- Use hooks for data and state management
- Follow React best practices

### Data Flow Pattern
```
User Action → Hook → Service → Firebase → Real-time Update → Hook → UI
```

For offline scenarios:
```
User Action → Hook → Service → Local Queue → Background Sync → Firebase
```

### Core Structure
```
app/                       # Expo Router file-based routing
├── (tabs)/               # Main tabbed interface
│   ├── index.tsx         # Timer screen
│   ├── stats.tsx         # Statistics dashboard
│   └── settings.tsx      # User settings
├── auth/                 # Authentication screens
└── components/           # UI components organized by feature

src/                      # Business logic and services
├── config/          # App and Firebase configuration
├── services/        # Core business services
├── hooks/           # React hooks for state management
├── providers/       # React context providers
├── types/           # TypeScript definitions
├── components/      # Reusable UI components
└── utils/           # Pure utility functions
```

### Key Services (`src/services/`)
- **sessionManager.ts** - Session lifecycle, Firebase sync, offline queuing
- **timerManager.ts** - Advanced timer with background execution
- **statisticsManager.ts** - Real-time statistics with Firestore listeners
- **settingsManager.ts** - Settings persistence with validation
- **auth.ts** - Firebase authentication (email/password + Google OAuth)
- **subscriptionManager.ts** - Premium subscription handling via React Native Purchases
- **analyticsManager.ts** - Performance monitoring and error tracking
- **dataValidator.ts** & **dataRecovery.ts** - Data integrity and recovery

### State Management Pattern
The app uses a hook-based architecture where services are wrapped in React hooks:
- **useSessionManager.ts** - Session state management
- **useAdvancedTimer.ts** - Timer state with interruption handling
- **useStatistics.ts** - Real-time statistics updates
- **useSettings.ts** - Settings state management

### Firebase Integration
- **Authentication**: Email/password and Google OAuth
- **Firestore**: Real-time session tracking and statistics
- **Offline Support**: Firestore offline persistence with custom queuing
- **Security Rules**: Configured for user-scoped data access
- **API Version**: Uses React Native Firebase **Modular API (v22+)** - NOT the deprecated namespaced API

### Premium Features
The app includes premium functionality gated through `premiumGate.ts` and managed via React Native Purchases. Premium features are controlled throughout the UI with `PremiumBadge` and `FeatureLockedCard` components.

### Authentication Flow
Google OAuth is configured for both platforms with proper URL schemes. Authentication state is managed globally through Firebase Auth with automatic persistence.

## 📁 File Organization & Naming

### File Naming Convention
- **Files**: camelCase (`sessionManager.ts`, `useStatistics.ts`)
- **Classes**: PascalCase (`class SessionManager`)
- **Components**: PascalCase (`CustomTimerModal.tsx`)
- **Hooks**: Prefix `use` (`useSessionManager.ts`)
- **Constants**: UPPER_SNAKE_CASE (`const TIMER_PRESETS`)

## 🔥 Firebase Modular API Standards

**CRITICAL**: This codebase uses React Native Firebase **Modular API (v22+)**. The old namespaced API is deprecated and will be removed.

### Firebase Initialization Pattern
```typescript
// src/config/firebase.ts - Correct modular pattern
import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';

export const app = getApp();
export const firebaseAuth = getAuth(app);
export const db = getFirestore(app);
```

### Firestore Operations - Modular API

**✅ CORRECT - Use Modular API:**
```typescript
import { db, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit, getDocs, onSnapshot } from '../config/firebase';

// Create/update document
const userRef = doc(db, 'users', userId);
await setDoc(userRef, data, { merge: true });

// Read document
const docSnap = await getDoc(userRef);
if (docSnap.exists()) {
  const data = docSnap.data();
}

// Update document
await updateDoc(userRef, { field: 'value' });

// Delete document
await deleteDoc(userRef);

// Query collection
const sessionsRef = collection(db, 'sessions');
const q = query(
  sessionsRef,
  where('userId', '==', userId),
  orderBy('date', 'desc'),
  limit(50)
);
const querySnapshot = await getDocs(q);

// Real-time listener
const unsubscribe = onSnapshot(q, (snapshot) => {
  snapshot.forEach((doc) => {
    console.log(doc.id, doc.data());
  });
});
```

**❌ WRONG - Deprecated Namespaced API:**
```typescript
// DON'T USE THESE - They will be removed in v22+
const ref = db.collection('users').doc(userId);  // ❌ DEPRECATED
await ref.get();                                  // ❌ DEPRECATED
await ref.set(data);                             // ❌ DEPRECATED
await ref.update(data);                          // ❌ DEPRECATED
const query = db.collection('sessions')          // ❌ DEPRECATED
  .where('userId', '==', userId)
  .orderBy('date', 'desc');
```

### Authentication - Modular API

**✅ CORRECT:**
```typescript
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  signOut,
  onAuthStateChanged
} from '@react-native-firebase/auth';
import { firebaseAuth, GoogleAuthProvider } from '../config/firebase';

// Create user
await createUserWithEmailAndPassword(firebaseAuth, email, password);

// Sign in
await signInWithEmailAndPassword(firebaseAuth, email, password);

// Google sign in
const credential = GoogleAuthProvider.credential(idToken);
await signInWithCredential(firebaseAuth, credential);

// Auth listener
const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
  if (user) {
    console.log('Signed in:', user.uid);
  }
});
```

**❌ WRONG:**
```typescript
// DON'T USE - Deprecated
await firebaseAuth.createUserWithEmailAndPassword(email, password);  // ❌
await firebaseAuth.signInWithEmailAndPassword(email, password);      // ❌
const credential = auth.GoogleAuthProvider.credential(idToken);      // ❌
firebaseAuth.onAuthStateChanged((user) => {});                      // ❌
```

### Field Values - Modular API

**✅ CORRECT:**
```typescript
import { serverTimestamp, increment, arrayUnion, arrayRemove } from '../config/firebase';

await setDoc(userRef, {
  createdAt: serverTimestamp(),
  totalSessions: increment(1),
  tags: arrayUnion('new-tag'),
  oldTags: arrayRemove('old-tag')
});
```

**❌ WRONG:**
```typescript
// DON'T USE - Deprecated
import { db } from '../config/firebase';

await userRef.set({
  createdAt: firestore.FieldValue.serverTimestamp(),  // ❌
  totalSessions: firestore.FieldValue.increment(1)     // ❌
});
```

### Transactions & Batches - Modular API

**✅ CORRECT:**
```typescript
import { runTransaction, writeBatch } from '../config/firebase';

// Transaction
await runTransaction(db, async (transaction) => {
  const userDoc = await transaction.get(userRef);
  transaction.update(userRef, { count: userDoc.data().count + 1 });
});

// Batch writes
const batch = writeBatch(db);
batch.set(doc1Ref, data1);
batch.update(doc2Ref, data2);
batch.delete(doc3Ref);
await batch.commit();
```

**❌ WRONG:**
```typescript
// DON'T USE - Deprecated
await db.runTransaction(async (transaction) => {     // ❌
  const userDoc = await transaction.get(userRef);
  transaction.update(userRef, { count: userDoc.data().count + 1 });
});
```

## 🔧 Service Layer Standards

### Service Class Pattern
```typescript
// Service class structure
export class ServiceManager {
  private cache: Map<string, any> = new Map();
  private listeners: Map<string, Unsubscribe> = new Map();

  // Public methods - main functionality
  async performAction(params: ActionParams): Promise<ActionResult> {
    try {
      // Implementation
    } catch (error) {
      console.error('Action failed:', error);
      analyticsManager.trackError('action_failed', error.message);
      throw error;
    }
  }

  // Private methods - internal logic
  private async helperMethod(): Promise<void> {
    // Implementation
  }

  // Cleanup method
  cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
    this.cache.clear();
  }
}

// Export singleton
export const serviceManager = new ServiceManager();
```

### Error Handling Pattern
```typescript
// Standard error handling in services
async performOperation(data: OperationData): Promise<Result> {
  try {
    const result = await firebaseOperation(data);
    return result;
  } catch (error) {
    // Log error
    console.error('Operation failed:', error);

    // Track error for analytics
    analyticsManager.trackError('operation_failed', error.message, userId);

    // Handle offline scenarios
    if (error.code === 'unavailable') {
      await this.queueForOffline(data);
    }

    // Re-throw for caller to handle
    throw error;
  }
}
```

### Real-time Data Pattern
```typescript
// Standard real-time subscription pattern
subscribeToData(userId: string, callback: (data: DataType) => void): () => void {
  const query = createFirestoreQuery(userId);

  const unsubscribe = onSnapshot(query, (snapshot) => {
    try {
      const data = processSnapshot(snapshot);
      callback(data);
    } catch (error) {
      console.error('Snapshot processing failed:', error);
      analyticsManager.trackError('snapshot_error', error.message);
    }
  });

  // Store for cleanup
  this.listeners.set(userId, unsubscribe);

  return () => {
    this.unsubscribeFromData(userId);
  };
}

unsubscribeFromData(userId: string): void {
  const listener = this.listeners.get(userId);
  if (listener) {
    listener();
    this.listeners.delete(userId);
  }
}
```

## ⚛️ React Hooks Standards

### Hook Structure Pattern
```typescript
export interface UseServiceReturn {
  // State
  data: DataType | null;
  loading: boolean;
  error: string | null;

  // Actions
  performAction: (params: ActionParams) => Promise<void>;
  refreshData: () => Promise<void>;
}

export const useService = (): UseServiceReturn => {
  const [data, setData] = useState<DataType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize and subscribe to data
  useEffect(() => {
    if (user) {
      const unsubscribe = serviceManager.subscribeToData(
        user.uid,
        (newData) => {
          setData(newData);
          setLoading(false);
          setError(null);
        }
      );

      return () => unsubscribe();
    }
  }, [user]);

  const performAction = useCallback(async (params: ActionParams): Promise<void> => {
    try {
      setError(null);
      await serviceManager.performAction(params);
    } catch (err) {
      setError('Action failed');
      console.error('Hook action error:', err);
    }
  }, []);

  return {
    data,
    loading,
    error,
    performAction,
    refreshData: () => serviceManager.refreshData()
  };
};
```

## 🛡️ Error Handling Standards

### Global Error Boundaries
```typescript
// Component error boundaries for crash prevention
export class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    analyticsManager.trackError('react_error', error.message, undefined, error.stack);
  }
}
```

### Async Error Handling
```typescript
// Standardized async/await error handling
const handleAsyncAction = async () => {
  try {
    setLoading(true);
    await performAction();
  } catch (error) {
    console.error('Action failed:', error);
    setError(getErrorMessage(error));
    // Show user-friendly error
    Alert.alert('Error', 'Something went wrong. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

## 🔍 TypeScript Standards

### Type Definitions
```typescript
// Comprehensive interface definitions
export interface SessionData {
  sessionId: string;
  userId: string;
  type: 'work' | 'break' | 'longBreak';
  startTime: Date;
  endTime?: Date;
  plannedDuration: number;
  actualDuration?: number;
  completed: boolean;
  date: string; // YYYY-MM-DD format
}

// Use union types for known values
export type SessionType = 'work' | 'break' | 'longBreak';

// Generic interfaces for flexibility
export interface ServiceResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}
```

### React Component Typing
**Follow React Team's Official Recommendation: Avoid React.FC entirely**

```typescript
// ✅ RECOMMENDED: Plain function components with explicit prop interfaces
interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

const Button = ({ title, onPress, disabled = false }: ButtonProps) => {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
};

// ✅ RECOMMENDED: Explicit children prop when needed
interface LayoutProps {
  backgroundColor?: string;
  children: React.ReactNode;
}

const Layout = ({ backgroundColor = '#fff', children }: LayoutProps) => {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      {children}
    </View>
  );
};

// ❌ AVOID: React.FC is discouraged by React team
const BadComponent: React.FC<ButtonProps> = ({ title, onPress }) => {
  // Issues with React.FC:
  // - Implicitly adds children prop (type unsafe)
  // - Less performant
  // - More verbose
  // - React team removed from their examples
  return <TouchableOpacity onPress={onPress}><Text>{title}</Text></TouchableOpacity>;
};
```

**Why Plain Functions Are Better:**
- **Type Safety**: No implicit `children` prop
- **Performance**: No wrapper overhead
- **Clarity**: Explicit about what props are accepted
- **Modern**: Aligned with React 18+ patterns
- **React Native**: Matches RN documentation examples

## ⚡ Performance Standards

### Optimization Patterns
```typescript
// Memoization for expensive calculations
const expensiveValue = useMemo(() => {
  return calculateStatistics(rawData);
}, [rawData]);

// Callback memoization to prevent re-renders
const handleAction = useCallback((id: string) => {
  performAction(id);
}, [dependency]);

// Component memoization
export const ExpensiveComponent = React.memo(({ data }) => {
  return <ComplexUI data={data} />;
});
```

### Firebase Optimization
```typescript
// Batch Firebase operations
const batch = writeBatch(db);
operations.forEach(op => {
  batch.set(op.ref, op.data);
});
await batch.commit();

// Use appropriate Firestore queries
const optimizedQuery = query(
  collection(db, 'sessions'),
  where('userId', '==', userId),
  where('date', '>=', startDate),
  orderBy('date', 'desc'),
  limit(50)
);
```

## 📊 Analytics & Monitoring

### Performance Tracking
```typescript
// Track performance metrics
const startTime = performance.now();
await performOperation();
const duration = performance.now() - startTime;
analyticsManager.trackPerformance('operation_name', duration, userId);

// Track user interactions
analyticsManager.trackUserInteraction('button_pressed', 'screen_name', userId);
```

### Error Tracking
```typescript
// Comprehensive error tracking
try {
  await riskyOperation();
} catch (error) {
  analyticsManager.trackError(
    'operation_failed',
    error.message,
    userId,
    error.stack,
    { context: additionalInfo }
  );
}
```

## Key Configuration Files

- **app.json** - Expo configuration with Firebase setup for both iOS/Android
- **eas.json** - EAS Build profiles (development, preview, production)
- **google-services.json** & **GoogleService-Info.plist** - Firebase configuration files

## Development Patterns

### Service Layer Usage
Services are singleton classes that handle business logic and Firebase operations. Always use the corresponding hooks in components rather than calling services directly.

### Offline-First Architecture
All Firebase operations are queued locally when offline and synced when connectivity returns. This is handled automatically by the service layer.

## ✅ Code Review Checklist

### Before Submitting PR
- [ ] All TypeScript errors resolved
- [ ] Error handling implemented
- [ ] Performance tracking added where appropriate
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] No console.logs in production code (use console.error for errors)
- [ ] Proper cleanup in useEffect hooks
- [ ] Firebase security rules updated if schema changed
- [ ] Components use plain function typing (no React.FC)
- [ ] Children prop explicitly typed when needed
- [ ] **Firebase code uses modular API (v22+), NOT deprecated namespaced API**
- [ ] No `db.collection().doc()` patterns (use `doc(db, collection, id)`)
- [ ] No `ref.get()/.set()/.update()` (use `getDoc()/setDoc()/updateDoc()`)

### Architecture Review
- [ ] Follows service → hook → component pattern
- [ ] Services are pure business logic (no React dependencies)
- [ ] Hooks properly manage React state and side effects
- [ ] Components focus on UI with minimal business logic
- [ ] Real-time subscriptions properly cleaned up
- [ ] Offline scenarios handled appropriately

## Important Instructions

### Do what has been asked; nothing more, nothing less.
- NEVER create files unless they're absolutely necessary for achieving your goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User

### Code Quality Priority
Code quality is more important than speed. Take time to implement proper error handling, performance monitoring, and maintainable architecture patterns.

---

**Remember**: This codebase prioritizes reliability, maintainability, and performance. Follow the established patterns and always implement comprehensive error handling and analytics tracking.