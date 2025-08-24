# 📋 Coding Standards & Guidelines

## 🎯 Project Philosophy

This Pomodoro app follows **enterprise-grade development practices** with emphasis on:
- **Reliability** - Robust error handling and data integrity
- **Performance** - Optimized for mobile with real-time capabilities  
- **Maintainability** - Clean architecture with clear separation of concerns
- **Scalability** - Built to handle production workloads

## 🏗️ Architecture Principles

### 1. Service-Oriented Architecture
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

### 2. Data Flow Pattern
```
User Action → Hook → Service → Firebase → Real-time Update → Hook → UI
```

## 📁 File Organization

### Directory Structure
```
src/
├── config/          # App and Firebase configuration
├── services/        # Business logic services
├── hooks/           # React hooks for state management
├── providers/       # React context providers
├── types/           # TypeScript definitions
├── components/      # Reusable UI components
└── utils/           # Pure utility functions
```

### File Naming Convention
- **Files**: camelCase (`sessionManager.ts`, `useStatistics.ts`)
- **Classes**: PascalCase (`class SessionManager`)
- **Components**: PascalCase (`CustomTimerModal.tsx`)
- **Hooks**: Prefix `use` (`useSessionManager.ts`)
- **Constants**: UPPER_SNAKE_CASE (`const TIMER_PRESETS`)

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

### Strict Type Checking
```typescript
// Enable strict TypeScript settings
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true
  }
}
```

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

## 🧪 Testing Standards

### Unit Test Pattern
```typescript
describe('ServiceManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should handle successful operation', async () => {
    const result = await serviceManager.performAction(validData);
    expect(result).toBeDefined();
    expect(analyticsManager.trackError).not.toHaveBeenCalled();
  });
  
  it('should handle operation failure', async () => {
    mockFirestore.mockRejectedValueOnce(new Error('Network error'));
    
    await expect(serviceManager.performAction(validData))
      .rejects.toThrow('Network error');
    
    expect(analyticsManager.trackError).toHaveBeenCalledWith(
      'operation_failed',
      'Network error',
      expect.any(String)
    );
  });
});
```

## 📝 Documentation Standards

### Code Documentation
```typescript
/**
 * Manages user session lifecycle with Firebase persistence
 * Handles offline queuing and conflict resolution
 */
export class SessionManager {
  
  /**
   * Start a new Pomodoro session
   * @param userId - User identifier
   * @param type - Session type (work/break/longBreak)  
   * @param duration - Session duration in seconds
   * @returns Promise resolving to session ID
   */
  async startSession(userId: string, type: SessionType, duration: number): Promise<string> {
    // Implementation
  }
}
```

### README Updates
- Keep documentation current with implementation
- Include setup instructions and troubleshooting
- Document API changes and breaking changes
- Provide examples for common use cases

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

### Architecture Review
- [ ] Follows service → hook → component pattern
- [ ] Services are pure business logic (no React dependencies)
- [ ] Hooks properly manage React state and side effects
- [ ] Components focus on UI with minimal business logic
- [ ] Real-time subscriptions properly cleaned up
- [ ] Offline scenarios handled appropriately

---

**Remember**: Code quality is more important than speed. Take time to implement proper error handling, performance monitoring, and maintainable architecture patterns.