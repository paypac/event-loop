﻿import Types = require('slownode');
export = SlowRoutine;


/** Creates a SlowRoutine instance. May be called with or without 'new'. */
function SlowRoutine(bodyFunc: (state) => void, state: any) {

    var result: Types.SlowRoutine = {
        next: makeResumeMethod('yield', bodyFunc, state),
        throw: makeResumeMethod('throw', bodyFunc, state),
        return: makeResumeMethod('return', bodyFunc, state),
        _body: bodyFunc,
        _state: state
    };
    return result;
}


/** Helper function for creating SlowRoutine's `next`, `throw`, and `return` method bodies. */
function makeResumeMethod(type: string, body: Function, state: any) {
    return (value?: any) => {
        state.incoming = { type, value };
        body(state);
        if (state.outgoing.type === 'throw') {
            throw state.outgoing.value;
        }
        return {
            done: state.outgoing.type === 'return',
            value: state.outgoing.value
        };
    };
}
