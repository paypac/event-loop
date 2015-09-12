var makeCallableClass = require('../util/makeCallableClass');
var storage = require('../storage/storage');
/**
 * Create a SlowPromiseRejectFunction callable instance.
 * It may be called to reject the given promise with a reason.
 */
var SlowPromiseRejectFunction = makeCallableClass({
    // TODO: doc...
    constructor: function (promise) {
        // Add slow metadata to the resolve function.
        this._slow = { type: 12 /* SlowPromiseRejectFunction */, promise: promise };
        // Synchronise with the persistent object graph.
        storage.created(this);
    },
    // TODO: doc...
    call: function (reason) {
        // As per spec, do nothing if promise's fate is already resolved.
        var promise = this._slow.promise;
        if (promise._slow.isFateResolved)
            return;
        // Indicate the promise's fate is now resolved.
        promise._slow.isFateResolved = true;
        // Synchronise with the persistent object graph.
        storage.updated(promise);
        // Finally, reject the promise using its own private _reject method.
        promise._reject(reason);
    }
});
module.exports = SlowPromiseRejectFunction;
//// TODO: register slow object type with storage (for rehydration logic)
//storage.registerType({
//    type: SlowType.SlowPromiseRejectFunction,
//    dehydrate: (p: types.SlowPromise.RejectFunction, recurse: (obj) => any) => {
//        if (!p || !p._slow || p._slow.type !== SlowType.SlowPromiseRejectFunction) return;
//        var jsonSafeObject = _.mapValues(p._slow, propValue => recurse(propValue));
//        return jsonSafeObject;
//    },
//    rehydrate: jsonSafeObject => {
//        return create(jsonSafeObject.promise, false);
//    }
//});
//# sourceMappingURL=rejectFunction.js.map