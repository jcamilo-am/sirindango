# Events Module Refactoring

## Overview
This document describes the refactoring of the Events module to follow a clean, scalable, and professional architecture pattern. The refactoring unifies DTOs with Zod validation and Swagger documentation, separates response entities, centralizes business logic in helpers, and keeps services/controllers clean and testable.

## Architecture Changes

### 1. Unified DTOs with Zod + Swagger
- **Files**: `dto/create-event.dto.ts`, `dto/update-event.dto.ts`
- **Schemas**: `schemas/create-event.schema.ts`, `schemas/update-event.schema.ts`
- Combined Zod validation with Swagger documentation
- Single source of truth for input validation and API documentation

### 2. Response Entities
- **File**: `entities/event.entity.ts`
- **EventEntity**: Base entity with computed `status` field (replaces database `state`)
- **EventWithSummaryEntity**: Extended entity with sales summary data
- **EventWithAccountingEntity**: Extended entity with detailed accounting information
- Factory methods (`fromPrisma`, `fromEventAndSummary`, etc.) for clean instantiation
- `toPdfDto()` method for PDF generation compatibility

### 3. Centralized Helpers
#### Event Validation Helper (`helpers/event-validation.helper.ts`)
- Static validation methods for business rules
- Date validation, uniqueness checks, deletion constraints
- Centralized error handling with consistent messages

#### Event Stats Helper (`helpers/event-stats.helper.ts`)
- Static calculation methods for event statistics
- Status calculation based on dates
- Sales aggregation and accounting calculations
- Commission calculations for artisans and association

### 4. Clean Service Layer (`events.service.ts`)
- Simplified service methods focused on orchestration
- Delegates validation to helpers
- Delegates calculations to helpers
- Returns entities instead of raw Prisma objects
- Clean error handling

### 5. Clean Controller Layer (`events.controller.ts`)
- Uses new DTOs for validation
- Returns entities for consistent API responses
- Improved Swagger documentation
- PDF generation uses entity transformation

### 6. Comprehensive Tests (`__tests__/events.service.spec.ts`)
- Modernized test structure
- Tests focus on entity structure and status calculation
- Uses `expect.objectContaining` for flexible entity comparisons
- Removed database state expectations (replaced with computed status)

## Key Improvements

### 1. Status vs State
- **Before**: Database `state` field exposed directly
- **After**: Computed `status` field based on current date vs event dates
- More accurate representation of event status in real-time

### 2. Validation Centralization
- **Before**: Validation scattered across service methods
- **After**: Centralized in `EventValidationHelper` with reusable static methods

### 3. Calculation Centralization
- **Before**: Complex calculations mixed with service logic
- **After**: Isolated in `EventStatsHelper` with pure functions

### 4. Entity Structure
- **Before**: Raw Prisma objects with inconsistent structure
- **After**: Clean entities with factory methods and computed fields

### 5. PDF Integration
- **Before**: Direct dependency on old DTO structure
- **After**: Entity transformation method (`toPdfDto()`) for backward compatibility

## Breaking Changes

### API Responses
- Event responses now include `status` instead of `state`
- Status values: `'UPCOMING' | 'ACTIVE' | 'CLOSED'`
- Status is computed in real-time based on dates

### Internal Code
- Removed direct access to `EventState` enum
- All business logic moved to helpers
- Service methods return entities instead of raw objects

## Migration Notes

### For Frontend/API Consumers
- Replace `event.state` with `event.status` in responses
- Status is now dynamically calculated, not stored

### For Backend Developers
- Use helper methods for validations and calculations
- Create entities using factory methods
- Follow the established pattern for new features

## File Structure
```
events/
├── dto/
│   ├── create-event.dto.ts          # Unified Zod + Swagger DTO
│   ├── update-event.dto.ts          # Unified Zod + Swagger DTO
│   └── event-accounting-summary.dto.ts  # Legacy DTO for PDF (preserved for compatibility)
├── schemas/
│   ├── create-event.schema.ts       # Zod validation schemas
│   └── update-event.schema.ts       # Zod validation schemas
├── entities/
│   └── event.entity.ts              # Response entities with factory methods
├── helpers/
│   ├── event-validation.helper.ts   # Business validation logic
│   └── event-stats.helper.ts        # Calculation and statistics logic
├── __tests__/
│   └── events.service.spec.ts       # Comprehensive unit tests
├── events.service.ts                # Clean service layer
├── events.controller.ts             # Clean controller layer
├── events.module.ts                 # Module configuration
└── EVENTS_REFACTORING.md           # This documentation
```

## Usage Examples

### Creating an Event
```typescript
const createData: CreateEventDto = {
  name: 'Feria Artesanal 2025',
  location: 'Plaza Central',
  startDate: new Date('2025-07-01'),
  endDate: new Date('2025-07-03'),
  commissionAssociation: 5,
  commissionSeller: 10,
};

const event = await eventService.create(createData);
// Returns EventEntity with computed status
```

### Getting Event Summary
```typescript
const summary = await eventService.getEventSummary(eventId);
// Returns EventWithSummaryEntity with sales data
```

### Using Helpers
```typescript
// Validation
EventValidationHelper.validateEventDates(startDate, endDate);

// Statistics
const status = EventStatsHelper.getEventStatus(event);
const totals = EventStatsHelper.calculateEventTotals(sales, commission);
```

## Testing
All tests pass and cover:
- Event creation with status calculation
- Event retrieval and listing
- Event updates with validation
- Event closure
- Error handling (not found scenarios)

## Next Steps
1. Apply similar refactoring pattern to remaining modules (sales, auth, users, etc.)
2. Remove any legacy/unused code and types
3. Add integration tests for the new architecture
4. Update API documentation to reflect status changes
