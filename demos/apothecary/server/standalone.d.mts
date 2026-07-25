// Hand-written declaration so TS tests can import the zero-dependency JS server.
import type { Server } from 'node:http';

export declare function createStandaloneServer(env?: Record<string, string | undefined>): Server;
