declare module 'log4js-json-layout' {
    export default function jsonLayout(config: any): (logEvent: any) => string;
  }
  