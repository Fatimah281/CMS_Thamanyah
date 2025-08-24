# Unique ID Generation Guide for Programs

## Overview
This document explains how unique IDs are automatically generated for new programs in the CMS system.

## How It Works

### 1. Backend ID Generation (NestJS)

#### Counter System
- **Location**: `src/modules/programs/programs.service.ts`
- **Method**: `private async nextId(counter: string): Promise<number>`
- **Database**: Uses `_counters` collection in Firestore

#### Process Flow
```typescript
// 1. When creating a new program
const id = await this.nextId('programs');

// 2. The nextId method:
private async nextId(counter: string): Promise<number> {
  const ref = this.db.collection('_counters').doc(counter);
  return this.db.runTransaction(async tx => {
    const s = await tx.get(ref);
    const v = s.exists ? (s.data()!.value as number) : 0;
    const n = v + 1;
    tx.set(ref, { value: n });
    return n;
  });
}
```

#### What Happens:
1. **Atomic Transaction**: Uses Firestore transaction to ensure thread-safe ID generation
2. **Counter Increment**: Gets current counter value and increments by 1
3. **Database Update**: Updates the counter in the `_counters` collection
4. **ID Assignment**: Returns the new unique ID to the program

### 2. Frontend Integration

#### Program Creation Flow
```typescript
// 1. User fills form in program-form component
// 2. Form data is sent to backend via ProgramService
await this.programService.createProgram(formData).toPromise();

// 3. Backend generates ID and saves program
// 4. Frontend receives program with generated ID
```

#### Type Safety
- **Model**: `frontend/projects/shared/src/lib/models/program.model.ts`
- **ID Field**: `id: string` (required, not optional)
- **Validation**: TypeScript enforces ID requirement

## Database Structure

### Counters Collection
```
_collection: _counters
  _document: programs
    value: 5  // Current counter value
```

### Programs Collection
```
_collection: programs
  _document: "1"
    id: 1
    title: "Program Title"
    // ... other fields
  _document: "2" 
    id: 2
    title: "Another Program"
    // ... other fields
```

## Ensuring ID Generation

### 1. Backend Validation
The `create` method in `ProgramsService` always calls `nextId('programs')` before saving:

```typescript
async create(createDto: CreateProgramDto, uid: string, userRole: string): Promise<ProgramResponseDto> {
  // ... validation ...
  
  const id = await this.nextId('programs'); // ✅ Always generates ID
  
  const data = {
    id, // ✅ ID is always included
    // ... other fields ...
  };
  
  await this.col('programs').doc(String(id)).set(data as any);
  // ... rest of method ...
}
```

### 2. Frontend Validation
The Program interface enforces ID requirement:

```typescript
export interface Program {
  id: string; // ✅ Required, not optional
  // ... other fields ...
}
```

### 3. Error Handling
If ID generation fails:
- Transaction rolls back automatically
- Error is thrown to frontend
- User gets error message
- No incomplete data is saved

## Testing ID Generation

### 1. Create New Program
```bash
# Via frontend form
# Navigate to /programs/new and create a program

# Via API
curl -X POST http://localhost:3000/api/v1/programs \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Program",
    "description": "Test Description",
    "categoryId": 1,
    "languageId": 1,
    "duration": 30,
    "publishDate": "2024-01-25"
  }'
```

### 2. Verify ID Generation
```bash
# Check the latest program
curl http://localhost:3000/api/v1/programs?page=1&limit=1

# Check counter value
# Look in Firebase Console > _counters collection
```

### 3. Monitor Counter
```bash
# Run the fix script to see current state
npm run fix:program-ids
```

## Troubleshooting

### Issue: Duplicate IDs
**Cause**: Concurrent creation requests
**Solution**: Firestore transactions prevent this automatically

### Issue: Missing IDs
**Cause**: Legacy data or manual insertion
**Solution**: Run `npm run fix:program-ids`

### Issue: Counter Reset
**Cause**: Manual counter deletion
**Solution**: Reinitialize with `npm run init:firestore`

## Best Practices

### 1. Always Use the Service
- ✅ Use `ProgramsService.create()` for new programs
- ❌ Don't manually insert programs without IDs

### 2. Validate Data
- ✅ Check that returned programs have IDs
- ❌ Don't assume IDs exist

### 3. Handle Errors
- ✅ Catch and handle ID generation errors
- ❌ Don't ignore transaction failures

### 4. Monitor Counters
- ✅ Regularly check counter values
- ❌ Don't let counters get out of sync

## Future Enhancements

### 1. UUID Support
Could add UUID generation as alternative:
```typescript
import { v4 as uuidv4 } from 'uuid';
const uuid = uuidv4();
```

### 2. Custom ID Format
Could support custom ID formats:
```typescript
const customId = `PROG-${year}-${counter}`;
```

### 3. ID Validation
Could add ID format validation:
```typescript
if (!/^\d+$/.test(id.toString())) {
  throw new Error('Invalid ID format');
}
```

## Summary

✅ **Current System**: Automatically generates unique numeric IDs for all new programs
✅ **Thread Safe**: Uses Firestore transactions to prevent duplicates  
✅ **Type Safe**: TypeScript enforces ID requirement
✅ **Error Handling**: Proper error handling and rollback
✅ **Monitoring**: Scripts available to check and fix issues

The system is robust and ensures every new program gets a unique ID automatically!
