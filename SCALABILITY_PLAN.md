# Scalability Implementation Plan

## Target: 1000 Schools × 100 Students = 100,000 Students

---

## Executive Summary

The current architecture can handle ~5,000 students. To scale to 100,000+, we need:

1. **Pagination everywhere** - No more loading all records
2. **List virtualization** - Render only visible items
3. **Query optimization** - Backend select_related/prefetch_related
4. **Caching strategy** - Redis + CDN
5. **Code splitting** - Route-level imports
6. **Database indexing** - Proper indexes on foreign keys

---

## Phase 1: Quick Wins (Week 1)

### 1.1 Add Pagination to All React Query Hooks

**Files to modify:** `lib/hooks/use-data.ts`

```typescript
// Change from:
export const fetchAll = async <T>(endpoint: string): Promise<T[]> => {
    const response = await apiClient.get(endpoint, { params });
    return response.data.results || response.data;
};

// To:
export const fetchAll = async <T>(endpoint: string, params?: {
    page?: number;
    page_size?: number;
    search?: string;
    ordering?: string;
}): Promise<Types.PaginatedResponse<T>> => {
    const response = await apiClient.get(endpoint, { 
        params: { page: 1, page_size: 20, ...params } 
    });
    return response.data;
};
```

**Add new hooks:**
- `useStudentsPaginated(page, filters)`
- `useScoresPaginated(classId, session, term, page)`
- `usePaymentsPaginated(filters)`

---

### 1.2 Create Virtualized List Components

**New file:** `components/ui/virtual-list.tsx`

```typescript
'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useMemo } from 'react';

interface VirtualListProps<T> {
    items: T[];
    estimateSize: number;
    overscan?: number;
    renderItem: (item: T, index: number) => React.ReactNode;
    containerHeight?: number;
    keyExtractor: (item: T) => string;
}

export function VirtualList<T>({ 
    items, 
    estimateSize = 60, 
    overscan = 5,
    renderItem,
    containerHeight = 500,
    keyExtractor 
}: VirtualListProps<T>) {
    const parentRef = useRef<HTMLDivElement>(null);
    
    const virtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => estimateSize,
        overscan: overscan,
    });

    return (
        <div 
            ref={parentRef} 
            className="overflow-auto"
            style={{ height: containerHeight }}
        >
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {virtualizer.getVirtualItems().map((virtualItem) => (
                    <div
                        key={keyExtractor(items[virtualItem.index])}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            transform: `translateY(${virtualItem.start}px)`,
                        }}
                    >
                        {renderItem(items[virtualItem.index], virtualItem.index)}
                    </div>
                ))}
            </div>
        </div>
    );
}
```

---

### 1.3 Update Student List to Use Virtualization

**Modify:** `app\(dashboard)\students\page.tsx`

```typescript
import { VirtualList } from '@/components/ui/virtual-list';

// Replace standard map with virtual list
<VirtualList
    items={paginatedStudents.results}
    estimateSize={72}
    containerHeight={600}
    keyExtractor={(s) => s.id}
    renderItem={(student, index) => (
        <StudentRow student={student} />
    )}
/>
```

---

## Phase 2: Backend Optimization (Week 2)

### 2.1 Add Pagination to All Django Viewsets

**New file:** `backend/schools/views_pagination.py`

```python
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework import viewsets

class StandardResultPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class StudentViewSet(viewsets.ModelViewSet):
    pagination_class = StandardResultPagination
    
    def get_queryset(self):
        qs = Student.objects.select_related(
            'user',
            'assigned_class'
        ).prefetch_related(
            'assigned_fees',
            'discounts__session'
        )
        
        # Add search
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(names__icontains=search)
            
        # Add ordering
        ordering = self.request.query_params.get('ordering', '-created_at')
        return qs.order_by(ordering)
```

### 2.2 Add Core Indexes

**New migration:** `backend/schools/migrations/0023_add_performance_indexes.py`

```python
from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [('schools', '0022_...')]
    
    operations = [
        # Student indexes
        migrations.AddIndex(
            model_name='student',
            index=models.Index(fields=['class_id'], name='student_class_idx'),
        ),
        migrations.AddIndex(
            model_name='student',
            index=models.Index(fields=['session', 'class_id'], name='student_session_idx'),
        ),
        
        # Score indexes
        migrations.AddIndex(
            model_name='score',
            index=models.Index(fields=['student_id', 'session', 'term'], name='score_student_idx'),
        ),
        
        # Attendance indexes
        migrations.AddIndex(
            model_name='attendance',
            index=models.Index(fields=['class_id', 'date'], name='attend_class_date_idx'),
        ),
        
        # Payment indexes
        migrations.AddIndex(
            model_name='payment',
            index=models.Index(fields=['student_id', 'session', 'term'], name='payment_student_idx'),
        ),
    ]
```

### 2.3 Add Rate Limiting

**Update:** `lib/rate-limit.ts`

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const rateLimit = new Ratelimit({
    redis: Redis.fromEnv(),
    prefix: 'ratelimit:',
    // Allow 100 requests per minute for regular users
    limiter: Ratelimit.slidingWindow(100, '60s'),
    // Different limit for admins
    adminLimiter: Ratelimit.slidingWindow(500, '60s'),
});

export const getRateLimit = (role: string) => {
    return role === 'admin' || role === 'super_admin' 
        ? Ratelimit.slidingWindow(500, '60s')
        : Ratelimit.slidingWindow(100, '60s');
};
```

---

## Phase 3: Caching Strategy (Week 2-3)

### 3.1 Add Redis Caching

**New file:** `lib/query-client.ts`

```typescript
import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

export const createQueryClient = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 1000 * 60 * 5, // 5 minutes
                gcTime: 1000 * 60 * 30, // 30 minutes
                retry: 1,
                refetchOnWindowFocus: false,
            },
        },
    });
    
    return queryClient;
};

// Cache school settings (rarely changes)
export const queryClient = createQueryClient();
queryClient.setQueryDefaults(['settings'], {
    staleTime: 1000 * 60 * 60, // 1 hour
});
```

### 3.2 Add SWR Alternative

```typescript
// For real-time data, add SWR
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// Use for live updates
const { data, error } = useSWR('/api/reports/stats', fetcher, {
    refreshInterval: 30000, // Poll every 30s
    revalidateOnFocus: false,
});
```

---

## Phase 4: Performance Monitoring (Week 3)

### 4.1 Add Performance Tracking

**New file:** `lib/metrics.ts`

```typescript
export const trackPerformance = () => {
    if (typeof window === 'undefined') return;
    
    // Core Web Vitals
    new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            console.log(`[PERF] ${entry.name}:`, entry.value);
            
            // Send to analytics
            if (entry.name === 'LCP') {
                // Report to Sentry/Datadog
            }
        }
    }).observe({ entryTypes: ['LCP', 'FID', 'CLS'] });
};

// Track API response times
export const trackApiTime = async (endpoint: string, fn: () => Promise<any>) => {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    
    console.log(`[API] ${endpoint}: ${duration}ms`);
    
    // Alert if > 2 seconds
    if (duration > 2000) {
        console.error(`SLOW API: ${endpoint} took ${duration}ms`);
    }
    
    return result;
};
```

---

## Phase 5: Database Optimizations (Week 3-4)

### 5.1 Connection Pooling

**Add to:** `backend/schools/settings.py`

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST'),
        'PORT': os.getenv('DB_PORT'),
        'CONN_MAX_AGE': 60,  # Connection pooling
        'OPTIONS': {
            'connect_timeout': 10,
        'application_name': 'schools_api',
        'keepalives': 1,
            'keepalives_idle': 60,
            'keepalives_interval': 10,
            'keepalives_count': 5,
        },
    }
}

# Add connection pooler (PgBouncer) for high load
# docker-compose.yml
# pgbouncer:
#   image: pgbouncer/pgbouncer
#   ports:
#     - "6432:5432"
```

### 5.2 Read Replicas

```python
# For queries that don't need write
DATABASES_READ_REPLICA = {
    'ENGINE': 'django.db.backends.postgresql',
    'NAME': os.getenv('REPLICA_DB_NAME'),
    # ... replica settings
}

# Use replica for read-heavy views
class ReadOnlyReplicaRouter:
    def db_for_read(self, model):
        return 'replica'
    
    def db_for_write(self, model):
        return 'default'

DATABASE_ROUTERS = ['schools.read_replica.ReadOnlyReplicaRouter']
```

---

## Implementation Order

| Phase | Task | Time | Impact |
|-------|------|------|-------|
| 1.1 | Add pagination hooks | 2 hrs | High |
| 1.2 | Create VirtualList | 4 hrs | High |
| 1.3 | Update student list | 2 hrs | High |
| 2.1 | Django pagination | 4 hrs | High |
| 2.2 | Add database indexes | 2 hrs | High |
| 2.3 | Add rate limiting | 2 hrs | Medium |
| 3.1 | Redis caching | 4 hrs | Medium |
| 3.2 | SWR for real-time | 2 hrs | Medium |
| 4.1 | Performance monitoring | 2 hrs | Low |
| 5.1 | Connection pooling | 2 hrs | High |
| 5.2 | Read replicas | 4 hrs | High |

---

## Expected Results

| Metric | Before | After |
|--------|--------|-------|
| Student list load | 3-5 sec | <500ms |
| Score entry save | 1-2 sec | <200ms |
| Monthly reports | 30+ sec | <5 sec |
| Concurrent users | ~50 | 500+ |
| Memory usage | 200MB | 150MB |

---

## Dependencies to Add

```bash
npm install @tanstack/react-virtual
npm install @tanstack/query-sync-storage-persister
npm install swr

pip install django-pg-utils
pip install django-redis
pip install django-db-geventpool
```

---

## Monitoring Checklist

- [ ] Add Sentry for error tracking
- [ ] Add DataDog/APM for performance
- [ ] Set up Grafana dashboards
- [ ] Alert on slow API (>2s)
- [ ] Alert on error rate (>1%)
- [ ] Monitor database connections
- [ ] Monitor Redis memory