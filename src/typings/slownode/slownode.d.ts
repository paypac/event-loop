/// <reference path="../knex/knex.d.ts" />
/// <reference path="../bluebird/bluebird.d.ts" />
/// <reference path="../node/node.d.ts" />


declare module "slownode" {

    interface SlowRoutineFunction {
        new(bodyFunction: Function, options?: SlowRoutineOptions): (...args) => SlowRoutine;
        (bodyFunction: Function, options?: SlowRoutineOptions): (...args) => SlowRoutine;
    }

    interface SlowRoutineOptions {
        yieldIdentifier?: string;
        constIdentifier?: string;
    }

    interface SlowRoutine {
        next(value?: any): { done: boolean; value: any; };
        throw(value?: any): { done: boolean; value: any; };
        return(value?: any): { done: boolean; value: any; };
        _body: (state) => void;
        _state: any;
    }

    export var SlowRoutineFunction: SlowRoutineFunction;





    // TODO: temp testing...
    var async: SlowAsyncFunction;
    interface SlowAsyncFunction {
        <TReturn>(fn: () => TReturn): { __sfid: string; (): Promise<TReturn>; }
        <TReturn, T0>(fn: (a: T0) => TReturn): { __sfid: string; (a: T0): Promise<TReturn>; }
        <TReturn, T0, T1>(fn: (a: T0, b: T1) => TReturn): { __sfid: string; (a: T0, b: T1): Promise<TReturn>; }
        <TReturn, T0, T1, T2>(fn: (a: T0, b: T1, c: T2) => TReturn): { __sfid: string; (a: T0, b: T1, c: T2): Promise<TReturn>; }
        <TReturn, T0, T1, T2, T3>(fn: (a: T0, b: T1, c: T2, d: T3) => TReturn): { __sfid: string; (a: T0, b: T1, c: T2, d: T3): Promise<TReturn>; }
        <TReturn>(fn: (...args) => TReturn): { __sfid: string; (...args): Promise<TReturn>; }
    }
}


// The await and __const pseudo-keywords are global.
declare var await: {
    <T>(arg: Promise<T>): T;
};
declare var __const: <T>(init: T) => T;


declare module "slownode-prev" {

    export var ready: Promise<void>;

    // TODO: temp testing...
    export function Callback(functionId: string, ...args: any[]): Promise<any>;
    //export var DEBUG: boolean;
    export var errors: {
        FunctionExists: string;
        NoHandler: string;
        InvalidDatabaseName: string;
        MustBeNumber: string;
        InvalidPollDelay: string;
        NotInfinity: string;
        InvalidConnection: string;
        DatabaseInvalid: string;
        MustBeFunction: string;
        MustBeString: string;
        UnableToDeserialise: string;
        DidNotParseAsFunction: string;
        DatabaseInitFailed: string;
        TimedFuncsMustHaveOptions: string;
    }


    import Knex = require("knex");

    export function start(config: SlowConfig): Promise<void>;
    export function stop(): Promise<void>;

    export function setTimeout(func: () => any, delayMs: number, options ?: SlowOptions): Promise<number>;
    export function setImmediate(func: () => any, options ?: SlowOptions): Promise<number>;
    export function setInterval(funct: () => any, delayMs: number, options ?: SlowOptions): Promise<number>;

    export function SlowFunction(id: string, callback: (...args: any[]) => any, options ?: SlowOptions): Promise<string>;
    export var EventEmitter: {
        addListener(event: string, listener: (...args: any[]) => any, options?: SlowOptions): Promise<boolean>,
        on(event: string, listener: (...args: any[]) => any, options?: SlowOptions): Promise<boolean>,
        once(event: string, listener: (...args: any[]) => any, options?: SlowOptions): Promise<boolean>,
        removeListener(event: string): Promise<boolean>,
        removeListeners(event: string): Promise<boolean>,
        listeners(event: string): Promise<Schema.EventListener[]>,
        emit(event: string, ...args: any[]): Promise<boolean>
    };

    export interface SlowPromise {
        id?: number;
        funcId: string;
        state: PromiseState;
        onFulfill: number;
        onReject: number;
        value: any;
    }
    
    export const enum PromiseState {
        Pending,
        Fulfilled,
        Rejected
    }

    export interface SlowThenable {
        then: (onFulfill?: SlowPromise, onReject?: SlowPromise) => Promise<{ fulfill: number, reject: number }>;
        slowPromise: SlowPromise;
        isReady: Promise<number>;
    }

    export interface SlowFunction {
        id?: string;
        body: (...args: any[]) => any;
        options: SlowOptions;
    }

    export interface SlowOptions {
        dependencies?: Array<Dependency>
        runAt?: number;
        runOnce?: number;
        intervalMs?: number;
        retryCount?: number;
        retryIntervalMs?: number;
        arguments?: {};
    }

    export interface Dependency {
        reference?: string;
        value?: any;
        as: string;
    }

    export interface SlowConfig {
        pollIntervalMs?: number;
    }


    export module Schema {

        export interface Function {
            id?: string;
            body: string;
            dependencies: string;
            isPromise?: number;
            intervalMs?: number;
            retryCount?: number;
            retryIntervalMs?: number;
            callOnce?: number;
        }

        export interface EventLoop {
            id?: number;
            funcId: string;
            runAt?: number;
            runAtReadable?: string;
            arguments?: string;
        }

        export interface EventListener {
            id?: number;
            topic: string;
            funcId: string;
        }

        export interface Promise {
            id?: number;
            funcId: string;
            state?: number;
            onFulfull?: number;
            onReject?: number;
            value: string;
        }
    }
}
