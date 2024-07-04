export enum ENV_TYPE {
  DEV = 'DEV',
  STAGE = 'STAGE',
  PROD = 'PROD',
  LOCAL = 'LOCAL',
}

export const DEV_ENV_LIST: string[] = [ENV_TYPE.LOCAL, ENV_TYPE.DEV];
