# Firebase Database Design - Live Implementation ✅

## 🎯 Current Setup
Firebase is fully configured and operational with:
- **Real-time updates** via Firestore listeners
- **Offline-first** architecture with intelligent conflict resolution  
- **Enterprise-grade** data validation and recovery
- **Performance optimized** with caching and analytics
- **Production ready** scalable architecture

## 📊 Current Database Structure

### 1. Sessions Collection (Global)
```typescript
// Collection: sessions
// Document ID: auto-generated
{
  sessionId: string,           // Unique session identifier
  userId: string,              // User who owns this session
  type: 'work' | 'break' | 'longBreak',
  startTime: Timestamp,        // When session started
  endTime?: Timestamp,         // When session ended (if completed)
  plannedDuration: number,     // Duration in seconds
  actualDuration?: number,     // Actual time spent (if completed)
  completed: boolean,          // Whether session was completed
  date: string,               // YYYY-MM-DD for easy querying
  pausedTime?: Timestamp,      // For pause/resume functionality
  
  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 2. Users Collection
```typescript
// Collection: users
// Document ID: {userId}
{
  uid: string,
  email: string,
  displayName: string,
  photoURL?: string,
  createdAt: Timestamp,
  lastActiveAt: Timestamp,
  lastSessionDate?: string,    // For streak calculation
  
  // Aggregated statistics (denormalized for performance)
  totalSessions: number,
  totalFocusMinutes: number,
  currentStreak: number,
  longestStreak: number,
  
  // User settings with validation
  settings: {
    notifications: boolean,
    autoStartBreaks: boolean,
    autoStartPomodoros: boolean,
    defaultWorkDuration: number,     // 5-180 minutes
    defaultBreakDuration: number,    // 1-30 minutes  
    defaultLongBreakDuration: number, // 5-60 minutes
    
    // Custom presets with full validation
    customPresets: {
      [presetId: string]: {
        id: string,
        name: string,               // Max 50 characters
        work: number,               // 1-180 minutes
        break: number,              // 1-60 minutes
        longBreak: number,          // 1-120 minutes
        createdAt: Timestamp,
        isDefault: boolean
      }
    }
  },
  
  updatedAt: Timestamp
}
```

### 3. Analytics Collection (Optional)
```typescript
// Collection: analytics
// Document ID: auto-generated
{
  events: [{
    eventName: string,
    duration?: number,
    timestamp: Timestamp,
    userId?: string,
    metadata?: object,
    platform: 'react-native'
  }],
  serverTimestamp: Timestamp
}
```

### 3. Daily Stats Subcollection (pre-aggregated)
```typescript
// Collection: users/{userId}/dailyStats
// Document ID: YYYY-MM-DD
{
  date: string, // YYYY-MM-DD
  workSessions: number,
  breakSessions: number,
  totalFocusMinutes: number,
  completedSessions: number,
  totalSessions: number,
  longestStreak: number,
  
  // Hourly breakdown for detailed analytics
  hourlyBreakdown: {
    [hour]: number // sessions count per hour
  },
  
  updatedAt: Timestamp
}
```

### 4. Weekly Stats (optional, for performance)
```typescript
// Collection: users/{userId}/weeklyStats  
// Document ID: YYYY-WW
{
  week: string, // YYYY-WW
  totalSessions: number,
  totalFocusMinutes: number,
  dailyBreakdown: number[], // [mon, tue, wed, thu, fri, sat, sun]
  updatedAt: Timestamp
}
```

## 🔥 Current Firebase Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Sessions: Users can only access their own sessions
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // Users: Can only access their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
    
    // Analytics: Authenticated users can write (for performance tracking)
    match /analytics/{document=**} {
      allow write: if request.auth != null;
      allow read: if false; // No reads allowed for privacy
    }
  }
}
```

## 📱 Key Data Operations

### Real-time Queries for App Screens

#### Timer Screen
```typescript
// Listen to user settings for timer configuration
const userRef = doc(db, 'users', userId);
const unsubscribe = onSnapshot(userRef, (doc) => {
  const userData = doc.data();
  // Update timer presets and settings
});
```

#### Stats Screen - Today's Data
```typescript
const today = new Date().toISOString().split('T')[0];
const dailyStatsRef = doc(db, `users/${userId}/dailyStats`, today);
const todaySessionsRef = collection(db, `users/${userId}/sessions`);
const todayQuery = query(
  todaySessionsRef,
  where('date', '==', today),
  orderBy('startedAt', 'desc')
);
```

#### Stats Screen - Weekly Data
```typescript
const startDate = '2024-01-01'; // Start of current week
const endDate = '2024-01-07';   // End of current week
const weeklyStatsRef = collection(db, `users/${userId}/dailyStats`);
const weekQuery = query(
  weeklyStatsRef,
  where(documentId(), '>=', startDate),
  where(documentId(), '<=', endDate),
  orderBy(documentId())
);
```

### Write Operations

#### Session Start
```typescript
const sessionRef = doc(collection(db, `users/${userId}/sessions`));
await setDoc(sessionRef, {
  type: 'work',
  startedAt: serverTimestamp(),
  duration: 1500, // 25 minutes
  date: new Date().toISOString().split('T')[0],
  // ... other fields
});
```

#### Session Complete + Stats Update
```typescript
// Update session
await updateDoc(sessionRef, {
  endedAt: serverTimestamp(),
  completed: true,
  actualDuration: 1500
});

// Update daily stats (atomic increment)
const dailyStatsRef = doc(db, `users/${userId}/dailyStats`, today);
await setDoc(dailyStatsRef, {
  workSessions: increment(1),
  completedSessions: increment(1),
  totalFocusMinutes: increment(25),
  updatedAt: serverTimestamp()
}, { merge: true });

// Update user totals
await updateDoc(userRef, {
  totalSessions: increment(1),
  totalFocusMinutes: increment(25),
  lastActiveAt: serverTimestamp()
});
```

## 🚀 Benefits of This Structure

✅ **Fast Reads**: Pre-aggregated daily stats  
✅ **Real-time**: Easy snapshot listeners  
✅ **Scalable**: Subcollections prevent doc size limits  
✅ **Offline**: Firestore offline persistence works perfectly  
✅ **Cost-effective**: Minimal reads with denormalized data  
✅ **Analytics-ready**: Easy to query date ranges  
✅ **Secure**: User-scoped data with proper rules  

## 📊 Data Flow Example

1. **User starts session** → Write to `sessions` subcollection
2. **Session completes** → Update session + increment daily stats + update user totals
3. **Stats screen loads** → Read cached daily stats + listen to real-time updates
4. **Settings change** → Update user document → Real-time sync to timer
5. **Weekly view** → Query daily stats range → Aggregate client-side

This structure optimizes for the most common operations while maintaining real-time capabilities!