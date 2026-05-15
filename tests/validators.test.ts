import { describe, it, expect, beforeEach } from 'vitest';
import { DataValidator } from '../src/validators/validator.js';
import { ValidationRule } from '../src/types/index.js';

describe('DataValidator', () => {
  describe('Required validation', () => {
    it('should pass validation for non-empty fields', () => {
      const rules: ValidationRule[] = [
        {
          field: 'name',
          type: 'required',
          message: 'Name is required',
        },
      ];

      const validator = new DataValidator(rules);
      const result = validator.validate({ name: 'John' });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for null field', () => {
      const rules: ValidationRule[] = [
        {
          field: 'name',
          type: 'required',
          message: 'Name is required',
        },
      ];

      const validator = new DataValidator(rules);
      const result = validator.validate({ name: null });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name is required');
    });

    it('should fail validation for undefined field', () => {
      const rules: ValidationRule[] = [
        {
          field: 'name',
          type: 'required',
          message: 'Name is required',
        },
      ];

      const validator = new DataValidator(rules);
      const result = validator.validate({});

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name is required');
    });

    it('should fail validation for empty string', () => {
      const rules: ValidationRule[] = [
        {
          field: 'name',
          type: 'required',
          message: 'Name is required',
        },
      ];

      const validator = new DataValidator(rules);
      const result = validator.validate({ name: '' });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name is required');
    });
  });

  describe('Email validation', () => {
    it('should pass validation for valid email', () => {
      const rules: ValidationRule[] = [
        {
          field: 'email',
          type: 'email',
          message: 'Invalid email format',
        },
      ];

      const validator = new DataValidator(rules);
      const result = validator.validate({ email: 'john@example.com' });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for invalid email', () => {
      const rules: ValidationRule[] = [
        {
          field: 'email',
          type: 'email',
          message: 'Invalid email format',
        },
      ];

      const validator = new DataValidator(rules);
      const result = validator.validate({ email: 'invalid-email' });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('should pass for missing email (optional by default)', () => {
      const rules: ValidationRule[] = [
        {
          field: 'email',
          type: 'email',
          message: 'Invalid email format',
        },
      ];

      const validator = new DataValidator(rules);
      const result = validator.validate({});

      expect(result.isValid).toBe(true);
    });
  });

  describe('Number validation', () => {
    it('should pass validation for numeric string', () => {
      const rules: ValidationRule[] = [
        {
          field: 'age',
          type: 'number',
          message: 'Age must be a number',
        },
      ];

      const validator = new DataValidator(rules);
      const result = validator.validate({ age: '30' });

      expect(result.isValid).toBe(true);
    });

    it('should pass validation for number', () => {
      const rules: ValidationRule[] = [
        {
          field: 'age',
          type: 'number',
          message: 'Age must be a number',
        },
      ];

      const validator = new DataValidator(rules);
      const result = validator.validate({ age: 30 });

      expect(result.isValid).toBe(true);
    });

    it('should fail validation for non-numeric value', () => {
      const rules: ValidationRule[] = [
        {
          field: 'age',
          type: 'number',
          message: 'Age must be a number',
        },
      ];

      const validator = new DataValidator(rules);
      const result = validator.validate({ age: 'thirty' });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Age must be a number');
    });
  });

  describe('Date validation', () => {
    it('should pass validation for valid date string', () => {
      const rules: ValidationRule[] = [
        {
          field: 'startDate',
          type: 'date',
          message: 'Invalid date format',
        },
      ];

      const validator = new DataValidator(rules);
      const result = validator.validate({ startDate: '2024-05-15' });

      expect(result.isValid).toBe(true);
    });

    it('should pass validation for Date object', () => {
      const rules: ValidationRule[] = [
        {
          field: 'startDate',
          type: 'date',
          message: 'Invalid date format',
        },
      ];

      const validator = new DataValidator(rules);
      const result = validator.validate({ startDate: new Date() });

      expect(result.isValid).toBe(true);
    });

    it('should fail validation for invalid date', () => {
      const rules: ValidationRule[] = [
        {
          field: 'startDate',
          type: 'date',
          message: 'Invalid date format',
        },
      ];

      const validator = new DataValidator(rules);
      const result = validator.validate({ startDate: 'not-a-date' });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid date format');
    });
  });

  describe('Phone validation', () => {
    it('should pass validation for valid phone numbers', () => {
      const rules: ValidationRule[] = [
        {
          field: 'phone',
          type: 'phone',
          message: 'Invalid phone format',
        },
      ];

      const validator = new DataValidator(rules);
      const testCases = [
        { phone: '123-456-7890' },
        { phone: '+1 (555) 123-4567' },
        { phone: '5551234567' },
      ];

      testCases.forEach((testCase) => {
        const result = validator.validate(testCase);
        expect(result.isValid).toBe(true);
      });
    });

    it('should fail validation for invalid phone numbers', () => {
      const rules: ValidationRule[] = [
        {
          field: 'phone',
          type: 'phone',
          message: 'Invalid phone format',
        },
      ];

      const validator = new DataValidator(rules);
      const result = validator.validate({ phone: 'not-a-phone' });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid phone format');
    });
  });

  describe('Multiple rules validation', () => {
    it('should validate multiple rules at once', () => {
      const rules: ValidationRule[] = [
        {
          field: 'name',
          type: 'required',
          message: 'Name is required',
        },
        {
          field: 'email',
          type: 'required',
          message: 'Email is required',
        },
        {
          field: 'email',
          type: 'email',
          message: 'Invalid email format',
        },
      ];

      const validator = new DataValidator(rules);
      const result = validator.validate({
        name: 'John',
        email: 'john@example.com',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should collect all validation errors', () => {
      const rules: ValidationRule[] = [
        {
          field: 'name',
          type: 'required',
          message: 'Name is required',
        },
        {
          field: 'email',
          type: 'required',
          message: 'Email is required',
        },
        {
          field: 'age',
          type: 'number',
          message: 'Age must be a number',
        },
      ];

      const validator = new DataValidator(rules);
      const result = validator.validate({
        age: 'invalid',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContain('Name is required');
      expect(result.errors).toContain('Email is required');
      expect(result.errors).toContain('Age must be a number');
    });
  });

  describe('Rule management', () => {
    it('should add rules dynamically', () => {
      const rules: ValidationRule[] = [
        {
          field: 'name',
          type: 'required',
          message: 'Name is required',
        },
      ];

      const validator = new DataValidator(rules);

      validator.addRule({
        field: 'email',
        type: 'required',
        message: 'Email is required',
      });

      const result = validator.validate({ name: 'John' });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email is required');
    });

    it('should clear all rules', () => {
      const rules: ValidationRule[] = [
        {
          field: 'name',
          type: 'required',
          message: 'Name is required',
        },
      ];

      const validator = new DataValidator(rules);
      validator.clearRules();

      const result = validator.validate({});

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
