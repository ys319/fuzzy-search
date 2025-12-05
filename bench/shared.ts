/**
 * Shared dataset generators and utilities for benchmarking
 */

import { faker } from "@faker-js/faker";

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
}

export interface Person {
  id: string;
  name: string;
  email: string;
}

/**
 * Generate product dataset for benchmarking using Faker
 */
export function generateProducts(count: number): Product[] {
  const products: Product[] = [];

  // Set seed for reproducibility
  faker.seed(123);

  for (let i = 0; i < count; i++) {
    products.push({
      id: faker.string.uuid(),
      name: faker.commerce.productName(),
      category: faker.commerce.department(),
      description: faker.commerce.productDescription(),
    });
  }

  return products;
}

/**
 * Generate person dataset for benchmarking using Faker
 */
export function generatePersons(count: number): Person[] {
  const persons: Person[] = [];

  faker.seed(456);

  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    persons.push({
      id: faker.string.uuid(),
      name: `${firstName} ${lastName}`,
      email: faker.internet.email({ firstName, lastName }),
    });
  }

  return persons;
}

/**
 * Generate dataset sizes
 */
export const datasetSizes = {
  small: 100,
  medium: 1_000,
  large: 10_000,
  xlarge: 100_000,
};

/**
 * Helper to create a typo by removing a random character
 */
export function createTypo(text: string): string {
  if (text.length <= 1) return text;
  const index = Math.floor(Math.random() * text.length);
  return text.slice(0, index) + text.slice(index + 1);
}
