var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var assert = require('assert');
var SteppableObject = require('../functions/steppableObject');
var SlowClosure = require('../functions/slowClosure');
var storage = require('../storage/storage');
/** A SlowAsyncFunctionActivation is a SteppableObject with additional properties. */
var SlowAsyncFunctionActivation = (function (_super) {
    __extends(SlowAsyncFunctionActivation, _super);
    /** Create a new SlowAsyncFunctionActivation instance. */
    function SlowAsyncFunctionActivation(asyncFunction, resolve, reject, args) {
        _super.call(this, asyncFunction.stateMachine);
        this.$slow = {
            type: 30 /* SlowAsyncFunctionActivation */,
            asyncFunction: null,
            state: null,
            awaiting: null,
            resumeNext: null,
            resumeError: null,
            resolve: null,
            reject: null
        };
        this.state = this.$slow.state = { local: { arguments: args } };
        this.$slow.asyncFunction = asyncFunction;
        this.$slow.resolve = resolve;
        this.$slow.reject = reject;
        var safa = this;
        this.$slow.resumeNext = new SlowClosure({ safa: safa }, function (value) { safa.runToCompletion(null, value); }),
            this.$slow.resumeError = new SlowClosure({ safa: safa }, function (error) { safa.runToCompletion(error); }),
            storage.created(this);
    }
    /**
     * Runs the SlowAsyncFunctionActivation instance to completion. First, the activation (which
     * must be currently suspended) is resumed, either passing the given `next` value into it, or
     * throwing the given `error` value into it. If neither `error` or `next` is given, it is
     * resumed with 'undefined' as its next value.
     * If the activation returns or throws, then the activation's promise is settled accordingly.
     * If the activation yields, then it goes back into a suspended state. The yielded value must
     * be an awaitable value. A recursive call to runToCompletion() is scheduled for when the
     * awaitable value is settled. Thus an asynchronous 'loop' is executed until the activation
     * either returns or throws.
     * @param safa the SlowAsyncFunctionActivation instance
     * @param type 'next'|'error'
     * @param value the next or error value to pass in to the activation
     */
    SlowAsyncFunctionActivation.prototype.runToCompletion = function (error, next) {
        // Resume the underlying Steppable by either throwing into it or calling next(), depending on args.
        try {
            var yielded = error ? this.throw(error) : this.next(next);
        }
        // The Steppable threw. Finalize and reject the SlowAsyncFunctionActivation.
        catch (ex) {
            var s = this.$slow;
            s.reject(ex);
            // Synchronise with the persistent object graph.
            storage.deleted(s.resolve).deleted(s.reject).deleted(s.resumeNext).deleted(s.resumeError).deleted(this);
            return;
        }
        // The Steppable returned. Finalize and resolve the SlowAsyncFunctionActivation.
        if (yielded.done) {
            var s = this.$slow;
            s.resolve(yielded.value);
            // Synchronise with the persistent object graph.
            storage.deleted(s.resolve).deleted(s.reject).deleted(s.resumeNext).deleted(s.resumeError).deleted(this);
            return;
        }
        // The Steppable yielded. Ensure the yielded value is awaitable.
        // TODO: review awaitability checks, supported values/types, and error handling
        var awaiting = this.$slow.awaiting = yielded.value;
        assert(awaiting && typeof awaiting.then === 'function', 'await: expected argument to be a Promise');
        // Attach fulfilled/rejected handlers to the awaitable, which resume the steppable.
        awaiting.then(this.$slow.resumeNext, this.$slow.resumeError);
        // Synchronise with the persistent object graph.
        storage.updated(this);
        // TL;DR: Now is a good time to ensure that the persistent object graph has been flushed to storage.
        // At this point, we know an asynchronous operation has just got underway, i.e., the operation
        // whose outcome is represented by the awaitable. Therefore a yield to the event loop is most
        // likely imminent. We want to be sure that the persistent object graph has been safely flushed
        // to storage, so that if the process dies between now and when the awaitable is settled, then when
        // it restarts we can pick up where we left off by reloading the persisted state.
        storage.saveChanges();
    };
    return SlowAsyncFunctionActivation;
})(SteppableObject);
// Tell storage how to create a SlowAsyncFunctionActivation instance.
storage.registerSlowObjectFactory(30 /* SlowAsyncFunctionActivation */, function ($slow) {
    // NB: The rehydration approach used here depends on two implementation details:
    // (1) the safa constructor doesn't care about the passed values for resolve/reject/args,
    //     so these can be fixed up after construction (by re-assigning the $slow property).
    // (2) the given $slow already has a valid `asyncFunction` property because that will
    //     always appear in the storage log before any activations using it.
    var safa = new SlowAsyncFunctionActivation($slow.asyncFunction, null, null, null);
    safa.$slow = $slow;
    safa.state = safa.$slow.state;
    return safa;
});
module.exports = SlowAsyncFunctionActivation;
//# sourceMappingURL=slowAsyncFunctionActivation.js.map