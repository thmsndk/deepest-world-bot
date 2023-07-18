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
  const savedConfig = localStorage.getItem("config");
  return savedConfig ? JSON.parse(savedConfig) : DEFAULT_CONFIG;
}

function saveConfigToLocalStorage(config: Config): void {
  localStorage.setItem("config", JSON.stringify(config));
}

export const config = createProxy(loadConfigFromLocalStorage());
