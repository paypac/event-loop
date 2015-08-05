/// <reference path="../knex/knex.d.ts" />
/// <reference path="../bluebird/bluebird.d.ts" />
/// <reference path="../node/node.d.ts" />

declare module "slownode" {
	import Knex = require("knex");

	export const enum PromiseState {
		Pending,
		Fulfilled,
		Rejected
	}

	export interface SlowNodeStatic {
		configuration: Config;
		connection: Knex;
		flushCallback: NodeJS.Timer;

		start(config: Config): Promise<boolean>;
		stop(): Promise<boolean>;

		setTimeout(func: () => any, delayMs: number, options?: SlowFunctionOptions): Promise<number>;
		setImmediate(func: () => any, options?: SlowFunctionOptions): Promise<number>;
		setInterval(funct: () => any, delayMs: number, options?: SlowFunctionOptions): Promise<number>;

		Promise: any;
		Event: any;
	}

	export interface SlowPromise {
		id?: number;
		funcId: string;
		state: PromiseState;
		onFulfill: number;
		onReject: number;
		value: any;
	}
	
	export interface SlowThenable {
		then: (onFulfill?: SlowPromise, onReject?: SlowPromise) => Promise<{ fulfill: number, reject: number }>;
		slowPromise: SlowPromise;
		isReady: Promise<number>;
	}

	export interface SlowEventEmitter {

	}

	export interface SlowEventLoop {
		add(functionId: string, options: SlowFunctionOptions, ...args: any[]): any;
		getNext(): Promise<Schema.EventLoop>;
		run(task?: Schema.EventLoop): Promise<boolean>
		remove(functionId: string): any;
	}

	export interface SlowFunction {
		id?: string;
		body: (...args: any[]) => any;
		options: SlowFunctionOptions;
	}

	export interface SlowFunctionOptions {
		dependencies?: Array<Dependency>
		runAt?: number;
		callOnce?: number;
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

	export interface Config {
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