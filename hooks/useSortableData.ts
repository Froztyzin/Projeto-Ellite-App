import { useState, useMemo } from 'react';

type SortDirection = 'ascending' | 'descending';

interface SortConfig<T> {
  key: keyof T | string;
  direction: SortDirection;
}

const useSortableData = <T extends object>(items: T[], config: SortConfig<T> | null = null) => {
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(config);

  const sortedItems = useMemo(() => {
    let sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const keys = (sortConfig.key as string).split('.');
        
        const getNestedValue = (obj: any, keyParts: string[]): any => {
            return keyParts.reduce((acc, part) => (acc && acc[part] !== undefined) ? acc[part] : undefined, obj);
        };

        const valA = getNestedValue(a, keys);
        const valB = getNestedValue(b, keys);

        // Handle null or undefined values to avoid errors and sort them to the end
        if (valA == null && valB == null) return 0;
        if (valA == null) return 1;
        if (valB == null) return -1;

        let comparison = 0;
        // Robust comparison for different types
        if (typeof valA === 'string' && typeof valB === 'string') {
            comparison = valA.localeCompare(valB, 'pt-BR', { numeric: true });
        } else {
            if (valA < valB) comparison = -1;
            if (valA > valB) comparison = 1;
        }

        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key: keyof T | string) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return { items: sortedItems, requestSort, sortConfig };
};

export default useSortableData;