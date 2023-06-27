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
      from: { l: number; x: number; y: number },
      to: { l: number; x: number; y: number }
    ): number;

    /**
     * Moves towards x,y in a straight line
     * @param x 
     * @param y 
     */
    move(x:number, y:number):void;

    /**
     * Returns the terrain at the given position
     * 0 = Air / Walkable
     * 1 = Wall?
     * @param pos 
     */
    getTerrainAt(pos: { l: number; x: number; y: number }):number;
  };
}

type Character = {
  /**
   * Active effects on your character
   */
  fx: { [skillName: string]: unknown };
  /** Characters current health */
  hp: number;
  /** Characters maximum health */
  hpMax: number;
};

type Entity = {
  /**
   * Is it a monster?
   */
  ai?: 1;
  /**
   * Is the entity a tree?
   */
  tree?: 1;
  /**
   * The level of the entity
   */
  l: number;
};

type Entities = Array<Entity>;

type Monster = {
  /**
   * The target of the monster
   * `dw.character.id` can be used to check if it is targeting you
   */
  targetId: number;
};
