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

    chunks: Chunks;

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
    distance(from: { x: number; y: number }, to: { x: number; y: number }): number;

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

    getTerrainUnder: (pos: { l: number; x: number; y: number }) => number;
    getTerrainOver: (pos: { l: number; x: number; y: number }) => number;

    /**
     * Set the UI to show this target
     * @param target
     */
    setTarget(target: number | { id: number });

    on(eventName: "drawEnd", cb: (ctx: CanvasRenderingContext2D, cx: number, cy: number) => void);

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

    on(
      eventName: "hit",
      cb: (data: { projId: number; md?: number; actor: nummber; target: number; amount: nubmer; rip: boolean }) => void
    );
    on(eventName: string, cb: (data: unknown) => void);

    emit(eventName: "unstuck");
    emit(eventName: "sortInv");
    emit(eventName: "merge");
    emit(eventName: "setSpawn");
    emit(eventName: "chop", data: { id: number });
    emit(eventName: "placeItem", data: { bagIndex: number; x: number; y: number });
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
     * Your character bag names are: 'bag', 'craftIn', 'abilities', 'abilityBag'.
     * Other objects bag names are: 'storage'.
     * @param bagFrom
     * @param indexFrom
     * @param bagTo
     * @param indexTo
     * @param idFrom can be omitted if transfering from your character
     * @param idTo can be omitted if transfering to your character
     */
    moveItem(bagFrom: string, indexFrom: number, bagTo: string, indexTo: number, idFrom?: number, idTo?: number);

    log: (message: any) => void;
    sendItem: (receiver: number | string, itemIndex: number) => void;
    moveItem: (
      bagFrom: string,
      indexFrom: number,
      bagTo: string,
      indexTo: number,
      idFrom: number,
      idTo: number
    ) => void;
    get: (key: string) => any;
    set: (key: string, value: any) => void;

    getZoneLevel(pos: { l: number; x: number; y: number }): () => number;
    getZoneLevel(): () => number;
  };
}

type Chunk = {}[];

/**
 * Each property is a chunk of 1x16x16 voxels containing data about the terrain.
 *
 * - Keys are the chunks world positions in the format "layer.row.col". Example: "0.0.0", "5.1.0", "-1.3.-2".
 * - Values are 3D arrays of integers.
 *
 * Example: dw.chunks['0.0.0'][0][10][15] would return the terrain in chunk "0.0.0" at row 10 and col 15.
 */
type Chunks = Record<string, Chunk>;

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

  /**
   * Movement speed. World units per second. Mult by 96 to get pixels per second.
   */
  moveSpeed?: number;
};

type Character = BaseEntity & {
  dbId: number;

  level: number;

  /**
   * Active effects on your character
   */
  fx: { [skillName: string]: unknown };
  /** Characters current health */
  hp: number;
  /** Characters maximum health */
  hpMax: number;

  /** Characters current mana */
  mp: number;
  /** Characters maximum mana */
  mpMax: number;

  /**
   * Set if the player is in combat
   */
  combat?: true;

  defaultSkills: {
    woodcutting: DefaultSkill;
    mining: DefaultSkill;
  };

  skills: Array<{
    md: string;
    physDmg: number;
    coldDmg: number;
    elecDmg: number;
    fireDmg: number;
    acidDmg: number;
    crit: number;
    critMult: number;
    range: number;
    cost: number1;
  }>;

  gear: { [key: string]: { md: string; mods: Mods; qual: number; r: number } };

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

  bag: readonly Array<Item>;

  craftIn: readonly Array<Item>;
};

export type Item = {
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
  qual: number;
  /**
   * The modifiers on the item
   */
  mods: Mods;
};

type Mods = {
  [key: string]: number;
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

export type Entity = BaseEntity & {
  owner: boolean;

  ownerDbId: number;

  level: number;

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

  /**
   * 1 is a normal monster.
   * 2+ are bosses.
   */
  r: number;

  /**
   * The target of the monster
   * `dw.character.id` can be used to check if it is targeting you
   */
  targetId: number;

  // mission id when we have accepted the mission as well as runners.
  storage: Array<{
    level: number;
    md: string;
    qual: number;
    r: number;
    missionId: number;
    runners: string[];
  }>;

  hostile: boolean;

    /** Entity current health */
    hp: number;
    /** Entity maximum health */
    hpMax: number;
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
