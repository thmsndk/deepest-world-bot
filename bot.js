dw.debug = 1;
setInterval(() => {
  const targetingMe = dw.findClosestMonster(
    (entity) => entity.targetId === dw.character.id
  );

  if (dw.character.hp / dw.character.hpMax < 0.25 && !targetingMe) {
    console.log(
      dw.character.hp / dw.character.hpMax,
      dw.character.hp,
      dw.character.hpMax
    );
    return;
  }

  const closestEntity = dw.entities
    .filter(
      (entity) =>
        (entity.md === "greenGoo" && entity.level === 1) ||
        entity.md === "maple"
    )
    .map((entity) => ({
      entity,
      distance: dw.distance(dw.character, entity),
    }))
    .filter(
      (x) => x.entity && ((x.entity.tree && x.distance <= 1) || !x.entity.tree)
    )
    .sort((a, b) => a.distance - b.distance);

  const target = targetingMe ?? closestEntity[0]?.entity;

  if (!target) {
    console.log("no target");
    return;
  }

  const distancetoTarget = dw.distance(dw.character, target);

  if (target.tree) {
    const inRange = distancetoTarget <= 0.5; /* Attack */
    if (!inRange) {
      dw.move(target.x, target.y);
    }

    if (dw.isSkillReady("chop") && inRange) {
      dw.emit("chop", { id: target.id });
    }
  } else {
    const inAttackRange =
      distancetoTarget <= dw.character.skills[0].range; /* Attack */
    if (!inAttackRange) {
      dw.move(target.x, target.y);
    }

    if (dw.isSkillReady(0) && inAttackRange) {
      dw.useSkill(0, target);
    }
  }
}, 100);
