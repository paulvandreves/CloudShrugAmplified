# Demo Mode with LocalStorage API

## Overview

The application now includes a fully functional demo mode that uses LocalStorage to create a mock API. Users can interact with alarms and investigations without signing up, and all changes persist across page refreshes.

## Features

### ✅ Full Functionality in Demo Mode

- **View Alarms**: Browse 4 sample CloudWatch alarms with different states
- **Investigate Alarms**: Click any alarm to view details
- **Create Investigations**: Add investigation notes and update status
- **Update Alarm Status**: Change investigation status (Pending → Acknowledged → Investigating → Resolved)
- **View Timeline**: See all investigations for each alarm
- **Persistent Storage**: All changes saved to LocalStorage
- **Reset Option**: Reset demo data to initial state

### 🎯 No Sign Up Required

Users can fully explore the application without creating an account. The demo mode provides a complete experience of the alarm investigation workflow.

## How It Works

### LocalStorage API (`app/lib/demoStorage.ts`)

The demo storage module provides a mock API that mimics the real Amplify Data API:

```typescript
// Alarm operations
demoAlarms.list()           // Get all alarms
demoAlarms.get(id)          // Get specific alarm
demoAlarms.update(id, data) // Update alarm

// Investigation operations
demoInvestigations.list(alarmId?)  // Get investigations (optionally filtered by alarm)
demoInvestigations.create(data)    // Create new investigation
demoInvestigations.get(id)         // Get specific investigation

// Organization operations
demoOrganization.get()      // Get demo organization
```

### Data Structure

Demo data is stored in LocalStorage with these keys:
- `demo_alarms`: Array of alarm objects
- `demo_investigations`: Array of investigation objects
- `demo_organization`: Organization object

### Initial Demo Data

When demo mode is first activated, the system initializes with:
- 4 sample alarms (different states: ALARM, OK, etc.)
- 2 sample investigations (showing resolved and acknowledged examples)
- 1 demo organization

## Usage

### Entering Demo Mode

1. Click "View Demo" on the welcome screen
2. Demo data loads automatically from LocalStorage
3. If no demo data exists, it's initialized with sample data

### Using Demo Mode

1. **Browse Alarms**: View the alarm list on the main page
2. **Investigate**: Click any alarm card to open investigation modal
3. **Add Investigation**:
   - Select status (Pending, Acknowledged, Investigating, Resolved)
   - Add notes about findings
   - Click "Save Investigation"
4. **View Timeline**: See all investigations for the alarm
5. **Update Status**: Change alarm investigation status

### Resetting Demo Data

Click "Reset Demo" in the demo banner to:
- Clear all investigations
- Reset alarms to initial state
- Restore sample data

### Exiting Demo Mode

Click "Sign In" to:
- Exit demo mode
- Show login/signup form
- Clear demo state from memory (LocalStorage data remains)

## Implementation Details

### Component Updates

**`app/page.tsx`**:
- Uses `demoAlarms.list()` to load alarms in demo mode
- Passes `demoMode` prop to `AlarmInvestigation` component
- Refreshes alarm list when investigations are saved

**`app/components/AlarmInvestigation.tsx`**:
- Accepts `demoMode` prop
- Uses `demoInvestigations` API when in demo mode
- Uses real Amplify API when authenticated
- Allows saving investigations without authentication in demo mode

### Data Flow

```
User Action (Demo Mode)
    ↓
AlarmInvestigation Component
    ↓
demoInvestigations.create() / demoAlarms.update()
    ↓
LocalStorage (persistent)
    ↓
Component re-renders with updated data
```

## Benefits

1. **No Backend Required**: Demo mode works without AWS Amplify deployment
2. **Full Experience**: Users can test all features
3. **Persistent**: Changes survive page refreshes
4. **Isolated**: Demo data doesn't interfere with real data
5. **Easy Reset**: Users can start fresh anytime

## Technical Notes

### LocalStorage Limitations

- **Storage Size**: Limited to ~5-10MB (plenty for demo data)
- **Browser Only**: Only works in browser (not SSR)
- **Same Origin**: Data is domain-specific
- **No Sync**: Data doesn't sync across devices

### Type Safety

The demo storage API maintains type safety by:
- Using the same TypeScript types as the real API
- Type casting for demo-specific fields
- Maintaining schema compatibility

### Migration Path

When users sign up:
1. Demo data remains in LocalStorage
2. Real data loads from DynamoDB
3. No data loss or conflict
4. Users can reference demo data if needed

## Future Enhancements

Potential improvements:
- Export demo investigations as JSON
- Import sample alarm data
- Share demo investigations via URL
- Demo mode analytics
- Multiple demo scenarios

## Code Examples

### Creating an Investigation in Demo Mode

```typescript
// In AlarmInvestigation component
if (demoMode) {
  demoInvestigations.create({
    alarmId: alarm.id,
    userId: "demo-user",
    userEmail: "demo@example.com",
    status: "INVESTIGATING",
    notes: "Checking logs...",
    timestamp: new Date().toISOString(),
  });
}
```

### Updating Alarm Status

```typescript
// Update alarm investigation status
const updated = demoAlarms.update(alarm.id, {
  investigationStatus: "INVESTIGATING",
});
```

### Loading Demo Data

```typescript
// Initialize and load
initializeDemoData();
const alarms = demoAlarms.list();
const investigations = demoInvestigations.list(alarmId);
```

## Testing

To test demo mode:

1. Open app without signing in
2. Click "View Demo"
3. Create investigations on different alarms
4. Refresh page - data should persist
5. Reset demo - data should restore to initial state
6. Exit demo and sign in - real data should load

## Troubleshooting

### Demo Data Not Persisting

- Check browser LocalStorage is enabled
- Verify no browser extensions blocking storage
- Check console for errors

### Can't Create Investigations

- Ensure demo mode is active
- Check LocalStorage has space
- Verify `demoMode` prop is passed correctly

### Reset Not Working

- Clear browser cache
- Manually clear LocalStorage keys
- Refresh page after reset

