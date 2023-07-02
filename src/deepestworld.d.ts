/**
 *
 */

export {};
declare global {
  const dw: {
    /**
     * Output debug information in the console.
     * 0 = disable
     * 1 = enable
     */
    debug: number;

    /** An even shorter reference to your character */
    c: Character;
    /** A shorthand for your character */
    char: Character;
    /** Your character */
    character: Character;

    entities: Entities;

    findClosestMonster(cb: (entity: Monster) => void);

    /**
     * Checks if a skill is ready
     * @param skill Either an index from `dw.character.skills` or the skill name
     */
    isSkillReady(skill: number | string): boolean;

    /**
     * Use skill
     * @param skill Either an index from `dw.character.skills` or the skill name
     */
    useSkill(skill: number | string, target: { id: number }): void;

    /**
     * Returns the distance between from and to
     * @param from
     * @param to
     */
    distance(
      from: { x: number; y: number },
      to: { x: number; y: number }
    ): number;

    /**
     * Moves towards x,y in a straight line
     * @param x
     * @param y
     */
    move(x: number, y: number): void;

    /**
     * Returns the terrain at the given position
     * 0 = Air / Walkable
     * 1 = Wall?
     * @param pos
     */
    getTerrainAt(pos: { l: number; x: number; y: number }): number;

    /**
     * Set the UI to show this target
     * @param target
     */
    setTarget(target: number | { id: number });

    on(
      eventName: "diff",
      cb: (
        data: Array<{
          died: boolean;
          force: boolean;
          id: number;
          l: number;
          x: number;
          y: number;
          xp: number;
        }>
      ) => void
    );
    on(eventName: string, cb: (data: unknown) => void);

    emit(eventName: "chop", data: { id: number });
    emit(
      eventName: "placeItem",
      data: { bagIndex: number; x: number; y: number }
    );
    emit(eventName: string, data: unknown);

    /**
     * Enters the acceptyed mission
     */
    enterMission(): void;
    /**
     *
     * @param id id of mission board
     * @param index slot of mission in board to accept
     */
    acceptMission(id: number, index: number): void;
    abandonMission(): void;

    /**
     * Your character bag names are: 'bag', 'crafting', 'abilities', 'abilityBag'.
     * Other objects bag names are: 'storage'.
     * @param bagFrom
     * @param indexFrom
     * @param bagTo
     * @param indexTo
     * @param idFrom
     * @param idTo can be omitted if transfering to your character
     */
    moveItem(bagFrom:string, indexFrom:number, bagTo:string, indexTo:number, idFrom:number, idTo?:number);
  };
}

type BaseEntity = {
  id: number;
  /**
   * The level of the map
   */
  l: number;
  /**
   * Latest known position x position from the server
   */
  x: number;
  /**
   * Latest known position y position from the server
   */
  y: number;
};

type Character = BaseEntity & {
  /**
   * Active effects on your character
   */
  fx: { [skillName: string]: unknown };
  /** Characters current health */
  hp: number;
  /** Characters maximum health */
  hpMax: number;

  /**
   * Set if the player is in combat
   */
  combat?: true;

  defaultSkills: {
    woodcutting: DefaultSkill;
    mining: DefaultSkill;
  };

  spawn: { l: number; x: number; y: number };

  mission: {
    item: {
      md: string;
      r: number;
      qual: number;
      level: number;
      ownerDbId: number;
      runners: string[];
      missionId: number;
    };
    /**
     * Percentage progress e.g. 6.0990909%
     */
    progress: number;
    /**
     * When the timeout happens
     */
    timeoutAt: number;
  };

  bag: Array<{
    md: string;
    n?: number;
    /**
     * The rarity
     * 0 = white
     * 1 = green
     * 2 = blue
     * 3 = purple
     */
    r: number;
    /**
     * The item level / quality
     */
    qual: number
    /**
     * The modifiers on the item
     */
    mods: {
      [key: string]: number;
    };
  }>;
};

type DefaultSkill = {
  physDmg: number;
  coldDmg: number;
  elecDmg: number;
  fireDmg: number;
  acidDmg: number;
  crit: number;
  critMult: number;
  range: number;
  cost: null;
};

type Entity = BaseEntity & {
  md: string;
  /**
   * Is it a monster?
   */
  ai?: boolean;
  /**
   * Is the entity a tree?
   */
  tree?: boolean;
  /**
   * Is the entity an ore?
   */
  ore?: boolean;
  /**
   * Is the entity a station?
   */
  station?: boolean;

  // mission id when we have accepted the mission as well as runners.
  storage: Array<{
    level: number;
    md: string;
    qual: number;
    r: number;
    missionId: number;
    runners: string[];
  }>;
};

type Entities = Array<Entity>;

type Monster = BaseEntity & {
  ai: boolean;
  /**
   * The target of the monster
   * `dw.character.id` can be used to check if it is targeting you
   */
  targetId: number;
};
