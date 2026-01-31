// src/types/soap-extended.d.ts
import 'soap';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';

declare module 'soap' {
  export interface IOptions {
    httpAgent?: HttpAgent;
    httpsAgent?: HttpsAgent;
    endpoint?: string; // Optional endpoint override
    wsdl_options?: {
      timeout?: number;
      strict?: boolean;
      [key: string]: any;
    };
  }
}