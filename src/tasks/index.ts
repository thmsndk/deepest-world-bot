import { sleep } from "../utility";

// https://en.wikipedia.org/wiki/Pushdown_automaton
export type TaskTuple = [state: string, ...args: any];
export type TaskArray = Array<TaskTuple>;
const stack: TaskArray[] = [];

export const taskRegistry: {
  [taskName: string]: {
    priority?: number;
    run: (...args: any) => Promise<TASK_STATE | void>;
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

export async function process() {
  console.debug("TICK");
  let processTasks = true;
  while (processTasks) {
    try {
      const current = stack.pop();
      if (!current) {
        return;
      }

      // TODO: should subtask be evaluated before the main task is done?
      for (const [taskName, ...args] of current) {
        const task = taskRegistry[taskName];
        if (task) {
          console.debug(taskName);
          // TODO: output processing time.
          const result = await task.run(...args);
          // TODO: if task is not done add it to the stack again, this allows the next run to put more important tasks onto the stack
          // if we are not done killing the targets targeting us, we should continue this task
          switch (result) {
            case TASK_STATE.EVALUATE_NEXT_TICK:
              processTasks = false;
              break;
          }

          await sleep(50);
        } else {
          console.error(taskName, "was not found in taskRegistry");
        }
      }
    } catch (error) {
      console.error("process failed", error);
    }
  }
}
