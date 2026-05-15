import { ValidationRule } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class DataValidator {
  private rules: ValidationRule[];

  constructor(rules: ValidationRule[]) {
    this.rules = rules;
  }

  validate(record: Record<string, unknown>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    for (const rule of this.rules) {
      const value = record[rule.field];
      const error = this.validateField(value, rule);

      if (error) {
        errors.push(error);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validateField(value: unknown, rule: ValidationRule): string | null {
    switch (rule.type) {
      case 'required':
        if (value === null || value === undefined || value === '') {
          return rule.message;
        }
        break;

      case 'email':
        if (
          value &&
          !String(value).match(
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          )
        ) {
          return rule.message;
        }
        break;

      case 'number':
        if (value !== null && isNaN(Number(value))) {
          return rule.message;
        }
        break;

      case 'date':
        if (value && isNaN(Date.parse(String(value)))) {
          return rule.message;
        }
        break;

      case 'phone':
        if (
          value &&
          !String(value).match(/^[\d\s\-\+\(\)]+$/)
        ) {
          return rule.message;
        }
        break;
    }

    return null;
  }

  addRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  clearRules(): void {
    this.rules = [];
  }
}
