# Weather Data Caching Implementation

## Overview

This implementation provides a robust local caching system for weather data in the React Native frontend application. The cache uses AsyncStorage to store weather data locally, reducing API calls and improving user experience.

## Features

### 🚀 Core Functionality
- **Local Data Storage**: Uses AsyncStorage for persistent local caching
- **Location-Based Caching**: Caches data based on latitude/longitude coordinates
- **TTL (Time To Live)**: Automatic expiry of cached data (default: 30 minutes)
- **Smart Location Matching**: Matches nearby locations within ~1km radius
- **Fallback Support**: Falls back to cached data if API fails

### 📱 User Experience
- **Fast Initial Load**: Shows cached data immediately when available
- **Refresh Control**: Manual refresh button forces fresh API calls
- **Background Updates**: Cache stats update when screen is focused
- **Cache Management**: Built-in tools for clearing and cleaning cache

### 🛡️ Reliability
- **Error Handling**: Graceful degradation when cache operations fail
- **Data Validation**: Validates cache entries before returning data
- **Automatic Cleanup**: Removes expired entries automatically

## Architecture

### Files Structure
```
frontend/
├── services/
│   ├── cacheService.ts         # Core caching logic
│   ├── weatherService.ts       # Weather API with cache integration
│   └── weatherService.ts       # Updated with cache methods
├── app/features/
│   └── weather.tsx            # UI with cache status and controls
└── utils/
    └── cacheTestUtils.ts      # Testing utilities
```

### Cache Key Format
```
weather_cache_{latitude}_{longitude}_{cropType}
```
Example: `weather_cache_13.08_80.27_rice`

## API Reference

### CacheService

#### `setWeatherData(key, data, ttl?)`
Stores weather data in cache with optional TTL.

#### `getWeatherData(key)`
Retrieves weather data from cache if valid and not expired.

#### `hasValidWeatherData(key)`
Checks if valid (non-expired) data exists for a location.

#### `clearAllWeatherCache()`
Removes all cached weather data.

#### `cleanExpiredEntries()`
Removes only expired cache entries.

#### `getCacheStats()`
Returns statistics about cached entries.

### WeatherService (Updated)

#### `getWeatherData(request, forceRefresh?)`
- `forceRefresh: false` - Uses cache if available, fetches if needed
- `forceRefresh: true` - Always fetches fresh data from API

#### `hasCachedWeatherData(location, cropType?)`
Checks if cached data exists for a specific location.

#### `clearLocationCache(location, cropType?)`
Clears cache for a specific location.

#### Cache Management Methods
- `clearAllCache()`
- `getCacheStats()`
- `cleanExpiredCache()`

## Usage Examples

### Basic Usage in Component
```typescript
// Initial load - uses cache if available
const data = await weatherService.getWeatherData({
  latitude: 13.0827,
  longitude: 80.2707,
  crop_type: 'rice'
});

// Force refresh - always fetches fresh data
const freshData = await weatherService.getWeatherData({
  latitude: 13.0827,
  longitude: 80.2707,
  crop_type: 'rice'
}, true);
```

### Cache Management
```typescript
// Check if cached data exists
const hasCached = await weatherService.hasCachedWeatherData(location);

// Get cache statistics
const stats = await weatherService.getCacheStats();
console.log(`Total: ${stats.totalEntries}, Valid: ${stats.validEntries}`);

// Clear all cache
await weatherService.clearAllCache();

// Clean expired entries only
const cleanedCount = await weatherService.cleanExpiredCache();
```

## Configuration

### Cache Settings
```typescript
// In cacheService.ts
private readonly DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes
private readonly LOCATION_THRESHOLD = 0.01; // ~1km radius
```

### Customization
- **TTL**: Change `DEFAULT_TTL` for different expiry times
- **Location Precision**: Adjust `LOCATION_THRESHOLD` for location matching
- **Cache Prefix**: Modify `CACHE_PREFIX` to avoid conflicts

## User Interface

### Cache Status Card
The weather screen now includes a cache status section showing:
- Total cached entries
- Valid (non-expired) entries  
- Expired entries
- Clear Cache and Clean Expired buttons

### Behavior Changes
1. **App Launch**: Fetches data on first launch, shows cached data on subsequent launches
2. **Screen Focus**: Updates cache stats only, doesn't fetch new data
3. **Refresh Button**: Forces fresh API call and updates cache
4. **Background**: Cache works even when app is backgrounded

## Performance Benefits

### Reduced API Calls
- First visit: API call + cache storage
- Return visits: Instant cache retrieval
- Manual refresh: Fresh API call + cache update

### Improved User Experience
- Faster load times with cached data
- Offline capability (cached data available)
- Reduced data usage
- Better error resilience

## Testing

### Test Utilities
Use `cacheTestUtils.ts` for testing cache functionality:

```typescript
import { testCacheOperations, testCacheExpiry, testLocationMatching } from '../utils/cacheTestUtils';

// Test basic cache operations
await testCacheOperations();

// Test cache expiry
await testCacheExpiry();

// Test location matching
await testLocationMatching();
```

### Manual Testing
1. Open weather screen (should fetch and cache data)
2. Navigate away and return (should show cached data)
3. Click refresh (should fetch fresh data)
4. Check cache stats in the cache status card
5. Test clear cache and clean expired buttons

## Error Handling

### Cache Failures
- Cache read/write failures are logged but don't break the app
- Falls back to API calls if cache is unavailable
- Graceful degradation for all cache operations

### API Failures
- Falls back to cached data if API fails
- Shows appropriate error messages
- Maintains user experience with stale but valid data

## Future Enhancements

### Potential Improvements
1. **Background Sync**: Update cache in background periodically
2. **Selective Refresh**: Refresh only specific data types
3. **Data Compression**: Compress cached data to save space
4. **Cache Priorities**: Implement cache eviction based on usage
5. **Sync Indicators**: Show when data is from cache vs fresh

### Monitoring
- Add analytics for cache hit/miss ratios
- Monitor cache performance and size
- Track user behavior with cached data

## Troubleshooting

### Common Issues

#### Cache Not Working
1. Check AsyncStorage permissions
2. Verify cache key generation
3. Check for JSON serialization errors

#### Stale Data
1. Verify TTL settings
2. Check system clock
3. Force refresh to get fresh data

#### Performance Issues
1. Monitor cache size
2. Run cache cleanup regularly
3. Consider reducing TTL

### Debug Information
Enable console logs to see cache operations:
- Cache hits/misses
- Storage operations
- Cleanup activities
- Error conditions

## Security Considerations

### Data Protection
- Weather data is not sensitive but follows best practices
- No user personal data is cached
- Cache is local to device only
- Automatic cleanup prevents data accumulation

### Privacy
- Location data is only used for cache keys
- No data is transmitted to third parties
- Cache is cleared when app is uninstalled
