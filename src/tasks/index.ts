// https://en.wikipedia.org/wiki/Pushdown_automaton
export type TaskTuple = [state: string, ...args: any];
export type TaskArray = Array<TaskTuple>;
const stack: TaskArray[] = [];

export const taskRegistry: {
  [taskName: string]: {
    priority?: number;
    run: (...args: any) => number | void;
  };
} = {};

// we need to push tasks onto the stack.
// and it should be the highest priority that gets pushed onto the stack

// scan for enemies during tree farming? push emergency task?

export function addTask(...tasks: TaskArray) {
  // TODO: do we need a unique key for the task, so we don't add the same task to the stack again? e.g farm tree-id
  stack.push(tasks);
}

export function process() {
  const current = stack.pop();
  if (!current) {
    return;
  }

  for (const [taskName, ...args] of current) {
    const task = taskRegistry[taskName];
    if (task) {
      task.run(...args);
      // TODO: if task is not done add it to the stack again, this allows the next run to put more important tasks onto the stack
    } else {
      console.error(taskName, "was not found in taskRegistry");
    }
  }
}
