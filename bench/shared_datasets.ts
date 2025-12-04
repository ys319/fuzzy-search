/**
 * Shared dataset generators and utilities for benchmarking
 */

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
 * Generate product dataset for benchmarking
 */
export function generateProducts(count: number): Product[] {
  const categories = [
    "Electronics",
    "Clothing",
    "Food",
    "Books",
    "Toys",
    "Sports",
  ];
  const brands = ["Apple", "Samsung", "Sony", "Nike", "Adidas", "Canon"];
  const products: Product[] = [];

  for (let i = 0; i < count; i++) {
    const category = categories[i % categories.length];
    const brand = brands[i % brands.length];
    products.push({
      id: `PROD-${String(i).padStart(6, "0")}`,
      name: `${brand} Product ${i}`,
      category,
      description:
        `High-quality ${category.toLowerCase()} product from ${brand}`,
    });
  }

  return products;
}

/**
 * Generate person dataset for benchmarking
 */
export function generatePersons(count: number): Person[] {
  const firstNames = [
    "John",
    "Jane",
    "Michael",
    "Sarah",
    "David",
    "Emily",
    "Robert",
    "Lisa",
  ];
  const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
  ];
  const persons: Person[] = [];

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const name = `${firstName} ${lastName}`;
    persons.push({
      id: `USER-${String(i).padStart(6, "0")}`,
      name,
      email:
        `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
    });
  }

  return persons;
}

/**
 * Generate fixed-length codes for benchmarking
 */
export function generateCodes(count: number): Array<{ code: string }> {
  const codes: Array<{ code: string }> = [];
  for (let i = 0; i < count; i++) {
    const code = `CODE${String(i).padStart(6, "0")}`;
    codes.push({ code });
  }
  return codes;
}

/**
 * Query patterns for different test scenarios
 */
export const queryPatterns = {
  // Exact match queries
  exact: {
    product: "Apple Product 0",
    person: "John Smith",
    code: "CODE000000",
  },

  // Single character typo
  typo1char: {
    product: "Aple Product 0", // Missing 'p'
    person: "Jon Smith", // Missing 'h'
    code: "CODE00000", // Missing last '0'
  },

  // Transposition (adjacent swap)
  transposition: {
    product: "Aplpe Product 0", // pl <-> lp
    person: "Jonh Smith", // hn <-> nh
    code: "CDOE000000", // OD <-> DO
  },

  // Partial match / substring
  partial: {
    product: "Apple",
    person: "John",
    code: "CODE",
  },

  // Prefix match
  prefix: {
    product: "App",
    person: "Jo",
    code: "COD",
  },

  // Multiple typos
  typo2char: {
    product: "Aple Prodct 0",
    person: "Jon Smth",
    code: "CODE00000",
  },
};

/**
 * Dataset size configurations
 */
export const datasetSizes = {
  small: 100,
  medium: 1_000,
  large: 10_000,
  xlarge: 100_000,
};
