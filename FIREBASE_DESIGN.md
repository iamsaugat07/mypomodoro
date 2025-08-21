# Firebase Database Design for Expo Pomodoro App

## 🎯 Design Goals
- **Fast reads** for real-time UI updates
- **Scalable** structure that handles millions of users
- **Offline-first** design with Firestore caching
- **Cost-optimized** with minimal reads/writes
- **Real-time sync** across devices

## 📊 Database Structure

### 1. Users Collection
```typescript
// Collection: users
// Document ID: {userId}
{
  uid: string,
  email: string,
  displayName: string,
  photoURL: string | null,
  createdAt: Timestamp,
  lastActiveAt: Timestamp,
  
  // Cached stats for quick access (denormalized)
  totalSessions: number,
  totalFocusMinutes: number,
  currentStreak: number,
  longestStreak: number,
  
  // User preferences
  settings: {
    notifications: boolean,
    autoStartBreaks: boolean,
    autoStartPomodoros: boolean,
    defaultWorkDuration: number,
    defaultBreakDuration: number,
    defaultLongBreakDuration: number,
    
    // Custom presets stored as map
    customPresets: {
      [presetId]: {
        name: string,
        work: number,
        break: number,
        longBreak: number,
        createdAt: Timestamp
      }
    }
  }
}
```

### 2. Sessions Subcollection (per user)
```typescript
// Collection: users/{userId}/sessions
// Document ID: auto-generated
{
  id: string,
  type: 'work' | 'break' | 'longBreak',
  startedAt: Timestamp,
  endedAt: Timestamp | null,
  duration: number, // planned duration in seconds
  actualDuration: number, // actual time spent
  completed: boolean,
  presetUsed: string, // 'pomodoro', 'custom_123', etc.
  
  // For easy querying
  date: string, // YYYY-MM-DD
  dayOfWeek: number, // 0-6 (Sunday-Saturday)
  week: string, // YYYY-WW
  month: string, // YYYY-MM
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

## 🔥 Firebase Rules (Security)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Subcollections inherit parent permissions
      match /sessions/{sessionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /dailyStats/{date} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /weeklyStats/{week} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
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