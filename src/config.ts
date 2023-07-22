export type Config = {
  [key: string]: boolean | number;
};

const DEFAULT_CONFIG: Config = {};

function createProxy(config: Config): Config {
  return new Proxy(config, {
    set: (target, key, value) => {
      target[key as string] = value;
      saveConfigToLocalStorage(target);
      console.log(`${key.toString()} => ${value}`);
      return true;
    },
  });
}

function loadConfigFromLocalStorage(): Config {
  const savedConfig = dw.get("config") as Config;
  return savedConfig ?? DEFAULT_CONFIG;
}

function saveConfigToLocalStorage(config: Config): void {
  dw.set("config", config);
}

export const config = createProxy(loadConfigFromLocalStorage());
