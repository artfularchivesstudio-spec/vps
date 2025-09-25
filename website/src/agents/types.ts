export interface Task {
  /** Type of task; orchestrator routes based on this 🧭 */
  type: string;
  /** Data needed for the task; pack your bags 🎒 */
  payload?: unknown;
}

export interface TaskResult {
  /** Whether the task succeeded 🎯 */
  success: boolean;
  /** Data returned from the agent; may include jokes 🤡 */
  data?: unknown;
}
