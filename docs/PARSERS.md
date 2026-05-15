# By-Import Parsers & Validators Guide

## Table of Contents

- [Parsers Overview](#parsers-overview)
- [CSV Parser](#csv-parser)
- [Excel Parser](#excel-parser)
- [JSON Parser](#json-parser)
- [Validators Overview](#validators-overview)
- [Built-in Validators](#built-in-validators)
- [Custom Validators](#custom-validators)
- [Validation Rules](#validation-rules)
- [Error Handling](#error-handling)
- [Examples](#examples)

## Parsers Overview

The By-Import system supports multiple file formats through a pluggable parser architecture. Each parser converts raw file data into a normalized record format.

### Parser Architecture

```
Raw File
  │
  ├─ Detect Format
  │
  ▼
Parser Selection
  ├─ CSV Parser
  ├─ Excel Parser
  └─ JSON Parser
  │
  ▼
Parse Operation
  │
  ▼
Record Array
[
  { field1: value1, field2: value2, ... },
  { field1: value1, field2: value2, ... },
  ...
]
```

### Parser Interface

All parsers implement this interface:

```typescript
interface Parser {
  parse(fileBuffer: Buffer): Promise<Record<string, unknown>[]>;
  validate(data: Record<string, unknown>[]): ValidationResult;
}
```

## CSV Parser

### Overview

The CSV parser uses the `csv-parser` library with stream-based processing for memory efficiency.

### Configuration

```json
{
  "name": "CSV Parser",
  "type": "csv",
  "configuration": {
    "delimiter": ",",
    "quote": "\"",
    "newline": "\n",
    "skipEmptyLines": true,
    "hasHeader": true
  }
}
```

### Features

- **Stream Processing** - Handle files larger than available memory
- **Custom Delimiters** - Support comma, semicolon, tab, pipe
- **Header Detection** - Auto-detect or specify headers
- **Empty Line Handling** - Skip or preserve empty lines
- **Quote Handling** - Proper escaped field handling

### Usage Example

```typescript
import { parseCSV } from './src/parser/csvParser.js';

// Read file
const fileBuffer = fs.readFileSync('contacts.csv');

// Parse
const records = await parseCSV(fileBuffer);

console.log(records);
// Output:
// [
//   { id: '1', name: 'John Doe', email: 'john@example.com' },
//   { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
// ]
```

### Common Delimiters

| Delimiter | Usage | Example |
|-----------|-------|---------|
| `,` | Standard CSV | `field1,field2,field3` |
| `;` | European CSV | `field1;field2;field3` |
| `\t` | Tab-separated | `field1\tfield2\tfield3` |
| `\|` | Pipe-separated | `field1\|field2\|field3` |

### Handling Special Cases

**File with Headers:**

```csv
name,email,phone
John Doe,john@example.com,123-456-7890
Jane Smith,jane@example.com,098-765-4321
```

```typescript
const config = {
  delimiter: ',',
  hasHeader: true  // First row is headers
};

const records = await parseCSV(fileBuffer);
// Records will use header names as keys
```

**File without Headers:**

```csv
1,John Doe,john@example.com
2,Jane Smith,jane@example.com
```

```typescript
const config = {
  delimiter: ',',
  hasHeader: false,
  headers: ['id', 'name', 'email']  // Specify headers manually
};

const records = await parseCSV(fileBuffer);
// Records will use specified header names
```

**Handling Quoted Fields:**

```csv
name,address,phone
"Doe, John","123 Main St, Apt 4","(555) 123-4567"
```

The CSV parser automatically handles quoted fields with embedded delimiters.

## Excel Parser

### Overview

The Excel parser uses ExcelJS library with support for multiple sheet formats and complex Excel features.

### Configuration

```json
{
  "name": "Excel Parser",
  "type": "excel",
  "configuration": {
    "worksheet": 0,
    "startRow": 1,
    "endRow": null,
    "dateFormat": "YYYY-MM-DD",
    "numberFormat": "0.00"
  }
}
```

### Features

- **Multi-Sheet Support** - Parse specific worksheet
- **Cell Range Selection** - Read specific rows/columns
- **Formula Handling** - Extract calculated values
- **Merged Cells** - Proper handling of merged cell ranges
- **Date/Number Formatting** - Automatic format detection
- **Style Preservation** - Optional style information

### Usage Example

```typescript
import { parseExcel } from './src/parser/excelParser.js';

// Read file
const fileBuffer = fs.readFileSync('sales_data.xlsx');

// Parse
const records = await parseExcel(fileBuffer, {
  worksheet: 0,  // First sheet
  hasHeader: true
});

console.log(records);
// [
//   { product: 'Widget A', price: 19.99, quantity: 100 },
//   { product: 'Widget B', price: 29.99, quantity: 50 }
// ]
```

### Multi-Sheet Handling

```typescript
// Parse specific worksheet by index
const records = await parseExcel(fileBuffer, {
  worksheet: 1  // Parse second sheet
});

// Parse specific worksheet by name
const records = await parseExcel(fileBuffer, {
  worksheetName: 'Sales Data'
});

// Parse all sheets
const records = await parseExcel(fileBuffer, {
  worksheetName: null  // All sheets
});
```

### Cell Range Selection

```typescript
// Parse specific range
const records = await parseExcel(fileBuffer, {
  worksheet: 0,
  startRow: 2,    // Start from row 2 (skip header)
  endRow: 100,    // End at row 100
  startCol: 1,    // Start from column B
  endCol: 5       // End at column E
});
```

## JSON Parser

### Overview

The JSON parser handles JSON and JSONL (JSON Lines) formats with schema validation.

### Configuration

```json
{
  "name": "JSON Parser",
  "type": "json",
  "configuration": {
    "format": "array",
    "rootPath": null,
    "onePerLine": false
  }
}
```

### Formats Supported

**Format: array**

```json
[
  { "id": 1, "name": "Item 1" },
  { "id": 2, "name": "Item 2" }
]
```

**Format: object (single record)**

```json
{
  "id": 1,
  "name": "Item 1",
  "details": {
    "price": 19.99,
    "stock": 100
  }
}
```

**Format: jsonl (JSON Lines)**

```
{"id": 1, "name": "Item 1"}
{"id": 2, "name": "Item 2"}
{"id": 3, "name": "Item 3"}
```

### Usage Examples

**Array Format:**

```typescript
import { parseJSON } from './src/parser/jsonParser.js';

const data = `[
  { "id": 1, "name": "John" },
  { "id": 2, "name": "Jane" }
]`;

const records = await parseJSON(Buffer.from(data), {
  format: 'array'
});
// [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
```

**JSONL Format:**

```typescript
const data = `{"id": 1, "name": "John"}
{"id": 2, "name": "Jane"}
{"id": 3, "name": "Bob"}`;

const records = await parseJSON(Buffer.from(data), {
  format: 'jsonl'
});
// [
//   { id: 1, name: 'John' },
//   { id: 2, name: 'Jane' },
//   { id: 3, name: 'Bob' }
// ]
```

**Nested Root Path:**

```json
{
  "status": "success",
  "data": [
    { "id": 1, "name": "Item 1" },
    { "id": 2, "name": "Item 2" }
  ]
}
```

```typescript
const records = await parseJSON(fileBuffer, {
  format: 'array',
  rootPath: 'data'
});
// [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }]
```

## Validators Overview

The validation system provides flexible, composable validation rules for data quality assurance.

### Validation Architecture

```
Record
  │
  ├─ Field 1 ──┬─ Rule 1 (required)
  │            ├─ Rule 2 (email)
  │            └─ Rule 3 (custom)
  │
  ├─ Field 2 ──┬─ Rule 1 (required)
  │            ├─ Rule 2 (number)
  │            └─ Rule 3 (min value)
  │
  └─ Field 3 ──┬─ Rule 1 (required)
               └─ Rule 2 (date format)

Result: {
  isValid: boolean,
  errors: [{ field, message, type }]
}
```

### DataValidator Class

```typescript
class DataValidator {
  constructor(rules: ValidationRule[]);
  validate(record: Record<string, unknown>): ValidationResult;
  addRule(rule: ValidationRule): void;
  clearRules(): void;
}
```

## Built-in Validators

### 1. Required Validator

Ensures field has a non-empty value.

```json
{
  "field": "email",
  "type": "required",
  "message": "Email is required"
}
```

**Valid Values:** Any non-null, non-undefined, non-empty string

**Invalid Values:** `null`, `undefined`, `""`

**Example:**

```typescript
const validator = new DataValidator([
  {
    field: 'email',
    type: 'required',
    message: 'Email address is required'
  }
]);

validator.validate({ email: 'john@example.com' });  // Valid
validator.validate({ email: null });                 // Invalid
validator.validate({ email: '' });                   // Invalid
```

### 2. Email Validator

Validates email format using regex pattern.

```json
{
  "field": "email",
  "type": "email",
  "message": "Invalid email format"
}
```

**Pattern:** `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

**Valid Examples:**
- `user@example.com`
- `first.last@company.co.uk`
- `user+tag@domain.org`

**Invalid Examples:**
- `invalid.email`
- `@example.com`
- `user@.com`

**Example:**

```typescript
const validator = new DataValidator([
  { field: 'email', type: 'email', message: 'Invalid email' }
]);

validator.validate({ email: 'john@example.com' });      // Valid
validator.validate({ email: 'invalid-email' });         // Invalid
validator.validate({ email: 'john+tag@example.com' });  // Valid
```

### 3. Phone Validator

Validates phone number format.

```json
{
  "field": "phone",
  "type": "phone",
  "message": "Invalid phone format"
}
```

**Pattern:** `/^[\d\s\-\+\(\)]+$/`

**Valid Examples:**
- `123-456-7890`
- `(555) 123-4567`
- `+1 555 123 4567`
- `1234567890`

**Invalid Examples:**
- `abc-def-ghij`
- `123-456`

**Example:**

```typescript
const validator = new DataValidator([
  { field: 'phone', type: 'phone', message: 'Invalid phone' }
]);

validator.validate({ phone: '555-123-4567' });      // Valid
validator.validate({ phone: '(555) 123-4567' });    // Valid
validator.validate({ phone: '123abc4567' });        // Invalid
```

### 4. Number Validator

Validates numeric value.

```json
{
  "field": "price",
  "type": "number",
  "message": "Price must be numeric"
}
```

**Valid Examples:**
- `123`
- `"123"`
- `45.99`
- `"45.99"`

**Invalid Examples:**
- `"abc"`
- `"123abc"`

**Example:**

```typescript
const validator = new DataValidator([
  { field: 'quantity', type: 'number', message: 'Must be numeric' }
]);

validator.validate({ quantity: 100 });      // Valid
validator.validate({ quantity: '100' });    // Valid
validator.validate({ quantity: 'abc' });    // Invalid
```

### 5. Date Validator

Validates date format and parseability.

```json
{
  "field": "birthDate",
  "type": "date",
  "message": "Invalid date format"
}
```

**Accepted Formats:**
- ISO 8601: `2024-05-15`
- `05/15/2024`
- `May 15, 2024`
- Timestamps: `1715767800000`

**Example:**

```typescript
const validator = new DataValidator([
  { field: 'startDate', type: 'date', message: 'Invalid date' }
]);

validator.validate({ startDate: '2024-05-15' });      // Valid
validator.validate({ startDate: '05/15/2024' });      // Valid
validator.validate({ startDate: 'invalid' });         // Invalid
```

## Custom Validators

### Creating Custom Validators

Extend the `DataValidator` class to create custom validation logic:

```typescript
class CustomDataValidator extends DataValidator {
  protected validateField(value: unknown, rule: ValidationRule): string | null {
    // Call parent for standard types
    const parentResult = super.validateField(value, rule);
    if (parentResult) return parentResult;

    // Add custom validation
    if (rule.type === 'custom') {
      return this.validateCustom(value, rule);
    }

    return null;
  }

  private validateCustom(value: unknown, rule: ValidationRule): string | null {
    const customRule = rule.options as Record<string, unknown>;

    switch (customRule.validator) {
      case 'min-length':
        if (String(value).length < (customRule.min as number)) {
          return rule.message;
        }
        break;

      case 'max-length':
        if (String(value).length > (customRule.max as number)) {
          return rule.message;
        }
        break;

      case 'enum':
        if (!Array.isArray(customRule.values)) return null;
        if (!(customRule.values as unknown[]).includes(value)) {
          return rule.message;
        }
        break;

      case 'regex':
        const pattern = new RegExp(customRule.pattern as string);
        if (!pattern.test(String(value))) {
          return rule.message;
        }
        break;
    }

    return null;
  }
}
```

### Custom Validator Examples

**Min/Max Length:**

```typescript
const validator = new CustomDataValidator([
  {
    field: 'username',
    type: 'custom',
    message: 'Username must be 3-20 characters',
    options: {
      validator: 'min-length',
      min: 3,
      max: 20
    }
  }
]);

validator.validate({ username: 'ab' });        // Invalid (too short)
validator.validate({ username: 'john_doe' });  // Valid
validator.validate({ username: 'a'.repeat(21) }); // Invalid (too long)
```

**Enum Validation:**

```typescript
{
  field: 'status',
  type: 'custom',
  message: 'Status must be one of: pending, active, inactive',
  options: {
    validator: 'enum',
    values: ['pending', 'active', 'inactive']
  }
}
```

**Regex Validation:**

```typescript
{
  field: 'zipCode',
  type: 'custom',
  message: 'Invalid ZIP code format',
  options: {
    validator: 'regex',
    pattern: '^\\d{5}(-\\d{4})?$'
  }
}
```

## Validation Rules

### Rule Structure

```typescript
interface ValidationRule {
  field: string;                          // Field name
  type: 'required' | 'email' | 'phone' | 
        'number' | 'date' | 'custom';    // Validator type
  message: string;                        // Error message
  options?: Record<string, unknown>;      // Additional options
}
```

### Rule Priority

Rules are evaluated in order:

```typescript
[
  { field: 'email', type: 'required' },    // 1st check
  { field: 'email', type: 'email' },       // 2nd check
  { field: 'email', type: 'custom' }       // 3rd check
]
```

## Error Handling

### Validation Error Structure

```json
{
  "success": false,
  "errors": [
    {
      "recordIndex": 2,
      "field": "email",
      "message": "Invalid email format",
      "type": "email",
      "value": "invalid.email"
    },
    {
      "recordIndex": 2,
      "field": "phone",
      "message": "Invalid phone format",
      "type": "phone",
      "value": "123"
    }
  ],
  "summary": {
    "totalRecords": 100,
    "validRecords": 98,
    "invalidRecords": 2,
    "errorRate": "2.0%"
  }
}
```

### Error Recovery Strategies

**Skip Invalid Records:**

```typescript
const records = await parser.parse(fileBuffer);
const validator = new DataValidator(rules);

const validRecords = [];
const errors = [];

for (let i = 0; i < records.length; i++) {
  const result = validator.validate(records[i]);
  if (result.isValid) {
    validRecords.push(records[i]);
  } else {
    errors.push({
      recordIndex: i,
      originalData: records[i],
      errors: result.errors
    });
  }
}

// Store valid records
await database.insertRecords(validRecords);

// Log errors for review
await database.logErrors(errors);
```

**Partial Validation (Continue on Error):**

```typescript
const rules = [
  { field: 'email', type: 'required' },
  { field: 'email', type: 'email' }
];

const validator = new DataValidator(rules);
const result = validator.validate(record);

// All validation errors collected
if (!result.isValid) {
  console.log('All validation errors:', result.errors);
  // Process errors together
}
```

## Examples

### Complete Import with Validation

```typescript
import { parseCSV } from './src/parser/csvParser.js';
import { DataValidator } from './src/validators/validator.js';

// Define validation rules
const rules = [
  {
    field: 'email',
    type: 'required',
    message: 'Email is required'
  },
  {
    field: 'email',
    type: 'email',
    message: 'Email must be valid'
  },
  {
    field: 'phone',
    type: 'phone',
    message: 'Phone must be valid format'
  },
  {
    field: 'age',
    type: 'number',
    message: 'Age must be numeric'
  }
];

// Create validator
const validator = new DataValidator(rules);

// Parse file
const fileBuffer = fs.readFileSync('contacts.csv');
const records = await parseCSV(fileBuffer);

// Validate records
const results = {
  valid: [],
  invalid: []
};

for (const record of records) {
  const validation = validator.validate(record);
  if (validation.isValid) {
    results.valid.push(record);
  } else {
    results.invalid.push({
      data: record,
      errors: validation.errors
    });
  }
}

console.log(`Valid: ${results.valid.length}, Invalid: ${results.invalid.length}`);
```

### Multi-Format Import Pipeline

```typescript
import { parseCSV } from './src/parser/csvParser.js';
import { parseExcel } from './src/parser/excelParser.js';
import { parseJSON } from './src/parser/jsonParser.js';

async function importData(fileBuffer: Buffer, fileType: string) {
  let records;

  // Step 1: Parse based on file type
  switch (fileType.toLowerCase()) {
    case 'csv':
      records = await parseCSV(fileBuffer);
      break;
    case 'xlsx':
    case 'xls':
      records = await parseExcel(fileBuffer);
      break;
    case 'json':
      records = await parseJSON(fileBuffer);
      break;
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }

  // Step 2: Validate records
  const validator = new DataValidator(validationRules);
  const validRecords = [];
  const errors = [];

  for (let i = 0; i < records.length; i++) {
    const result = validator.validate(records[i]);
    if (result.isValid) {
      validRecords.push(records[i]);
    } else {
      errors.push({ index: i, record: records[i], errors: result.errors });
    }
  }

  // Step 3: Return results
  return {
    parsed: records.length,
    valid: validRecords.length,
    invalid: errors.length,
    validRecords,
    errors
  };
}

// Usage
const result = await importData(fileBuffer, 'csv');
console.log(`Imported: ${result.valid}/${result.parsed}`);
```
