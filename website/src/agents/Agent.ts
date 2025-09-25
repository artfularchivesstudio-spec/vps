import { Task, TaskResult } from './types';

/**
 * Base interface for every agent in our creative circus 🎪
 */
export interface Agent {
  /** Unique agent name for roll call 📣 */
  name: string;
  /** Handle a task and return results; hopefully with flair ✨ */
  performTask(task: Task): Promise<TaskResult>;
}
