// https://en.wikipedia.org/wiki/Pushdown_automaton
export type TaskTuple = [state: string, ...args: any];
export type TaskArray = Array<TaskTuple>;
const stack: TaskArray[] = [];

export const taskRegistry: {
  [taskName: string]: {
    priority?: number;
    run: (...args: any) => TASK_STATE | void;
  };
} = {};

// we need to push tasks onto the stack.
// and it should be the highest priority that gets pushed onto the stack

// scan for enemies during tree farming? push emergency task?

export function addTask(...tasks: TaskArray) {
  // TODO: do we need a unique key for the task, so we don't add the same task to the stack again? e.g farm tree-id
  stack.push(tasks);
}

export enum TASK_STATE {
  DONE = 0,
  EVALUATE_NEXT_TICK = 1,
}

export function process() {
  let processTasks = true;
  while (processTasks) {
    const current = stack.pop();
    if (!current) {
      return;
    }

    // TODO: should subtask be evaluated before the main task is done?
    for (const [taskName, ...args] of current) {
      const task = taskRegistry[taskName];
      if (task) {
        // TODO: output processing time.
        const result = task.run(...args);
        // TODO: if task is not done add it to the stack again, this allows the next run to put more important tasks onto the stack
        // if we are not done killing the targets targeting us, we should continue this task
        switch (result) {
          case TASK_STATE.EVALUATE_NEXT_TICK:
            processTasks = false;
            break;
        }
      } else {
        console.error(taskName, "was not found in taskRegistry");
      }
    }
  }
}
