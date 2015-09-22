﻿import _ = require('lodash');
import SlowType = require('./slowType');
import makeCallableClass = require('./util/makeCallableClass');
import isRelocatableFunction = require('./util/isRelocatableFunction');
import storage = require('./storage/storage');
export = SlowClosure;


/**
 * Creates a SlowClosure instance. It may be called with or without `new`.
 * A slow closure combines a function and a referencing environment. Calling
 * a slow closure causes its function to be executed with its environment
 * bindings added to its scope chain.
 */
var SlowClosure: {

    /** Creates a new SlowClosure instance. */
    new(env: { [name: string]: any; }, fn: Function): SlowClosure;

    /** Creates a new SlowClosure instance. */
    (env: { [name: string]: any; }, fn: Function): SlowClosure;
}
interface SlowClosure {

    /** Calling the SlowClosure executes the function passed to the constructor in the environment passed to the constructor. */
    (...args): any;

    /** Holds the full state of the instance in serializable form. An equivalent instance may be 'rehydrated' from this data. */
    $slow: {
        type: SlowType;
        id?: string;
        functionSource: string;
        environment: { [name: string]: any; };
    }

    /** PRIVATE property holding the function that is executed when the closure instance is invoked. */
    function: Function;
}


// Create a constructor function whose instances (a) are callable and (b) work with instanceof.
SlowClosure = <any> makeCallableClass({

    // Creates a new SlowClosure instance.
    constructor: function (env: { [name: string]: any; }, fn: Function|string) {

        // Ensure `fn` is relocatable with the exception of names in `env`.
        if (!isRelocatableFunction(fn, _.keys(env))) {
            throw new Error(`SlowClosure: function is not relocatable: ${fn}`);
        }

        // TODO: this won't work in strict mode. Will need to do it another way eventually (ie via eval)...
        // TODO: use 'vm' module
        var functionSource = fn.toString();
        eval(`with (env) fn = ${fn.toString()};`);

        this.function = fn;
        this.$slow = {
            type: SlowType.SlowClosure,
            functionSource,
            environment: env
        };

        // Synchronise with the persistent object graph.
        storage.created(this);
    },

    // Calling the SlowClosure executes the function passed to the constructor in the environment passed to the constructor.
    call: function (...args: any[]) {
        return this.function.apply(void 0, args);
    },

    // Ensure calls to apply() leave the `this` binding unchanged.
    bindThis: true
});


// Tell storage how to create a SlowPromiseReject instance.
storage.registerSlowObjectFactory(SlowType.SlowClosure, ($slow: any) => {
    var closure = new SlowClosure($slow.environment, $slow.functionSource);
    return closure;
});
