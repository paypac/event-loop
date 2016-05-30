'use strict';
import EpochOptions from './options';
import Interpreter from '../jasm/interpreter';
import transpile from '../js-to-jasm/transpile';





// TODO: ... rename? Era, Aeon?
export default class Epoch {


    // TODO: ... use factory function?
    constructor(options: EpochOptions) {

        // TODO: create new optionsobject with all defaults set where not value was given
        let opts = this._options = <EpochOptions> {
            lib_d_ts: options.lib_d_ts || null,     // TODO
            dirname: options.dirname || null,       // TODO
            onError: options.onError || null,       // TODO
            globalFactory: options.globalFactory || (() => ({})),
            step: options.step || (jasm => jasm.step()),
            shouldSave: options.shouldSave || null, // TODO
            replacer: options.replacer || null,     // TODO
            reviver: options.reviver || null        // TODO
        };

        // TODO: load and resume in-flight scripts from options.dirname...
    }


    // TODO: ... rename?
    eval(script: string): Promise<void> {
        let jasm = transpile(script);
        let globalObject = this._options.globalFactory();
        let interpreter = new Interpreter(jasm, globalObject);
        let step = this._options.step;

        // TODO: do we need to keep a reference to the script/jasm/interpreter/progress after this? Why? Why not?
        let completed = (async () => {

            // TODO: run to completion...
            try {
                while (!(await step(interpreter))) {/* no-op */}
            }
            catch (err) {
                console.log(`An error occurred: ${err}`); // TODO: temp testing...
                throw err;
            }
        })();
        return completed;
    }


    private _options: EpochOptions;
}
