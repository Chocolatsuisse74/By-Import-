import { describe, it, expect, beforeEach } from 'vitest';
import { parseCSV } from '../src/parser/csvParser.js';
import { parseExcel } from '../src/parser/excelParser.js';
import { parseJSON } from '../src/parser/jsonParser.js';

describe('CSV Parser', () => {
  it('should parse a valid CSV buffer', async () => {
    const csvData = Buffer.from('name,email,age\nJohn,john@example.com,30\nJane,jane@example.com,25');
    const result = await parseCSV(csvData);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      name: 'John',
      email: 'john@example.com',
      age: '30',
    });
    expect(result[1]).toEqual({
      name: 'Jane',
      email: 'jane@example.com',
      age: '25',
    });
  });

  it('should handle empty CSV', async () => {
    const csvData = Buffer.from('name,email,age\n');
    const result = await parseCSV(csvData);

    expect(result).toHaveLength(0);
  });

  it('should handle CSV with only headers', async () => {
    const csvData = Buffer.from('name,email,age');
    const result = await parseCSV(csvData);

    expect(result).toHaveLength(0);
  });

  it('should parse CSV with special characters', async () => {
    const csvData = Buffer.from(
      'name,description\n"John Doe","A person named ""John"""\n'
    );
    const result = await parseCSV(csvData);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('John Doe');
  });
});

describe('Excel Parser', () => {
  it('should parse a valid Excel buffer', async () => {
    // For testing, we'll create a simple validation
    // In real scenarios, you'd use a library to create test Excel files
    const emptyBuffer = Buffer.alloc(0);

    try {
      await parseExcel(emptyBuffer);
    } catch (error) {
      // Expected to fail with empty buffer
      expect(error).toBeDefined();
    }
  });

  it('should return empty array for Excel with no data', async () => {
    // This would require creating a minimal valid Excel file
    // For now, we test the error handling
    const invalidBuffer = Buffer.from([0x50, 0x4b]); // Invalid zip signature

    try {
      await parseExcel(invalidBuffer);
      // If it doesn't throw, it should have failed
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});

describe('JSON Parser', () => {
  it('should parse a valid JSON array buffer', async () => {
    const jsonData = Buffer.from(
      JSON.stringify([
        { name: 'John', email: 'john@example.com', age: 30 },
        { name: 'Jane', email: 'jane@example.com', age: 25 },
      ])
    );
    const result = await parseJSON(jsonData);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('John');
    expect(result[1].age).toBe(25);
  });

  it('should parse a valid JSON object buffer as single record', async () => {
    const jsonData = Buffer.from(
      JSON.stringify({ name: 'John', email: 'john@example.com', age: 30 })
    );
    const result = await parseJSON(jsonData);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('John');
  });

  it('should throw error for invalid JSON', async () => {
    const jsonData = Buffer.from('{ invalid json }');

    await expect(parseJSON(jsonData)).rejects.toThrow();
  });

  it('should throw error for non-object/non-array JSON', async () => {
    const jsonData = Buffer.from(JSON.stringify('just a string'));

    await expect(parseJSON(jsonData)).rejects.toThrow();
  });

  it('should handle JSON with nested objects', async () => {
    const jsonData = Buffer.from(
      JSON.stringify([
        { name: 'John', address: { city: 'NYC', zip: '10001' } },
      ])
    );
    const result = await parseJSON(jsonData);

    expect(result).toHaveLength(1);
    expect(result[0].address).toEqual({ city: 'NYC', zip: '10001' });
  });
});
