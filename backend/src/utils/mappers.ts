// Mapeia uma única linha de snake_case para camelCase
export const toCamelCase = <T>(obj: any): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(v => toCamelCase(v)) as any;
  }
  return Object.keys(obj).reduce((acc: any, key: string) => {
    const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
    acc[camelKey] = toCamelCase(obj[key]);
    return acc;
  }, {});
};

// Mapeia uma única linha de camelCase para snake_case
export const toSnakeCase = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(v => toSnakeCase(v));
    }
    return Object.keys(obj).reduce((acc: any, key: string) => {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        acc[snakeKey] = toSnakeCase(obj[key]);
        return acc;
    }, {});
};