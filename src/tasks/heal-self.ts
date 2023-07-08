import { TASK_STATE, TaskTuple, taskRegistry } from ".";
const TASK_NAME = "heal-self";

export function selfHeal(): TaskTuple {
  return [TASK_NAME];
}

taskRegistry[TASK_NAME] = {
  run: async () => {
    const healthPercentage = dw.character.hp / dw.character.hpMax;
    const isLowHealth = healthPercentage < 0.25;

    if (healthPercentage < 0.75 /*&& !dw.character.gcd*/) {
      // dw.c.fx contains debuff/effect

      if (dw.isSkillReady(4) /* slowheal1 */ && !dw.character.fx["slowheal1"]) {
        console.log(
          "low health, slowheal1",
          healthPercentage,
          dw.character.hp,
          dw.character.hpMax
        );
        dw.useSkill(4, dw.character);
        //   dw.useSkill(3, { id: dw.character.id });
        //   dw.emit("skill", { md: "heal", i: 3, id: dw.character.id });
        return TASK_STATE.DONE;
      }

      if (
        healthPercentage < 0.5 &&
        dw.isSkillReady(3) /* heal */ &&
        !dw.character.fx["heal"]
      ) {
        console.log(
          "low health, heal",
          healthPercentage,
          dw.character.hp,
          dw.character.hpMax
        );
        dw.useSkill(3, dw.character);
        //   dw.useSkill(3, { id: dw.character.id });
        //   dw.emit("skill", { md: "heal", i: 3, id: dw.character.id });
        return TASK_STATE.DONE;
      }

      if (
        healthPercentage < 0.15 &&
        dw.isSkillReady(2) /* fastheal1 */ &&
        !dw.character.fx["fastheal1"]
      ) {
        console.log(
          "low health, fastheal1",
          healthPercentage,
          dw.character.hp,
          dw.character.hpMax
        );
        dw.useSkill(2, dw.character);
        // dw.useSkill(2, { i:2, id: dw.character.id });
        //   dw.emit("skill", { md: "fastheal1", i: 2, id: dw.character.id });
        return TASK_STATE.DONE;
      }
    }
    return TASK_STATE.DONE;
  },
};
