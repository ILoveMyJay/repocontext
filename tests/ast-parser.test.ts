import { describe, it, expect } from 'vitest';
import { AstParser } from '../src/core/ast-parser.js';

describe('AstParser', () => {
  it('should strip implementation details and retain signatures in TypeScript', () => {
    const code = `
import { Foo } from './foo';

/**
 * Greets a user by name
 */
export function greet(name: string): string {
  const message = "Hello " + name;
  console.log(message);
  return message;
}
    `;

    const outline = AstParser.extractOutline('greet.ts', code, 'typescript');
    expect(outline.skeletonCode).toContain('export function greet(name: string): string');
    expect(outline.skeletonCode).not.toContain('const message =');
    expect(outline.tokenSavingsPercent).toBeGreaterThan(0);
  });

  it('should parse Python class and function signatures', () => {
    const pyCode = `
import os

class MathEngine:
    """Performs math operations"""
    def compute(self, x: int, y: int) -> int:
        z = x * 2 + y * 3
        return z
    `;

    const outline = AstParser.extractOutline('math.py', pyCode, 'python');
    expect(outline.skeletonCode).toContain('class MathEngine:');
    expect(outline.skeletonCode).toContain('def compute(self, x: int, y: int) -> int:');
    expect(outline.skeletonCode).not.toContain('z = x * 2 + y * 3');
  });

  it('should parse Java class, annotations, and method signatures', () => {
    const javaCode = `
package com.example.service;

import java.util.List;

@Service
public class UserService {
    private final UserRepository repository;

    /**
     * Finds user by identifier
     */
    public User findById(Long id) {
        User user = repository.selectOne(id);
        if (user == null) {
            throw new RuntimeException("Not found");
        }
        return user;
    }
}
    `;

    const outline = AstParser.extractOutline('UserService.java', javaCode, 'java');
    expect(outline.skeletonCode).toContain('public class UserService');
    expect(outline.skeletonCode).toContain('public User findById(Long id) { /* ... */ }');
    expect(outline.skeletonCode).not.toContain('User user = repository.selectOne(id)');
    expect(outline.tokenSavingsPercent).toBeGreaterThan(0);
  });

  it('should parse C++ class, struct, and function prototypes', () => {
    const cppCode = `
#include <iostream>
#include <vector>

namespace math {
    class Vector3 {
    public:
        float x, y, z;

        float magnitude() const {
            float sum = x * x + y * y + z * z;
            return sqrt(sum);
        }
    };
}
    `;

    const outline = AstParser.extractOutline('vector.cpp', cppCode, 'cpp');
    expect(outline.skeletonCode).toContain('#include <iostream>');
    expect(outline.skeletonCode).toContain('namespace math {');
    expect(outline.skeletonCode).toContain('class Vector3 {');
    expect(outline.skeletonCode).toContain('float magnitude() const { /* ... */ }');
    expect(outline.skeletonCode).not.toContain('float sum = x * x');
    expect(outline.tokenSavingsPercent).toBeGreaterThan(0);
  });
});
