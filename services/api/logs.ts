import { logs } from './database';
import { simulateDelay } from './database';

export const getLogs = () => {
    // Return a sorted copy to ensure chronological order
    const sortedLogs = [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return simulateDelay(sortedLogs);
};
