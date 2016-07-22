import Map from '../wtf-map';
import Replacer from './replacer';
import {isPlainObject, isPlainArray} from '../serializable-types';
import makeReference from '../make-reference';
import * as tranformers from '../transformers/all'; // TODO: bring local...





// TODO: ...
export {Replacer};





// TODO: ...
// TODO: replacer: accept Replacer | Replacer[]
export default function stringify(value: any, replacer?: Replacer, space?: string|number): string {

    // TODO: ...
    let compositeReplacer: Replacer;
    if (!replacer) {
        compositeReplacer = tranformers.replacer;
    }
    else if (typeof replacer === 'function') {
        compositeReplacer = function (this, key, val) {
            let newVal = replacer.call(this, key, val);
            if (Object.is(val, newVal)) newVal = tranformers.replacer.call(this, key, val);
            return newVal;
        }
    }
    else {
        // TODO: JSON replacer may also be an array of string|number... handle this case
        throw new Error(`Not implemented`);
    }

    // TODO: ...
    let visited = new Map<{}, string>();
    let result = test({'':value}, '', value, [], compositeReplacer, visited);
    return result;
}





// TODO: ...
// - top-down traverse
//   - escape reserved chars in object keys
//   - encode cross references
//   - run replacer
function test(obj: {}, key: string, val: {}, path: string[], replacer: Replacer, visited: Map<{}, string>): string {
    let result: string;

    // TODO: explain here, and document this limitation in README...
    if (visited.has(val)) {
        result = visited.get(val);
        if (result !== INCOMPLETE) return result;
        throw new Error(`(KVON) cyclic object graphs are not supported`);
    }

    // Run the value through the replacer function. Detect whether the original value is replaced or left unchanged.
    // TODO: add sanity check to assert that the replacer didn't mutate `obj` or `val`?
    let replacement: {} = replacer.call(obj, key, val);
    let isReplaced = !Object.is(val, replacement);

    // TODO: document the following rule in the README...
    // If the value was replaced, the replacement *must* be a discriminated plain object (DPO)
    if (isReplaced && !(isPlainObject(replacement) && replacement.hasOwnProperty('$'))) {
        throw new Error(`(KVON) replacement value must be a discriminated plain object`);
    }

    // For a primitive value, no further traversal is necessary.
    if (replacement === null) {
        result = 'null';
    }
    else if (typeof replacement === 'boolean') {
        result = replacement ? 'true' : 'false';
    }
    else if (typeof replacement === 'number') {
        result = replacement.toString();
    }
    else if (typeof replacement === 'string') {
        const specials = {'"': '\\"', '\\': '\\\\', '\b': '\\b', '\f': '\\f', '\n': '\\n', '\r': '\\r', '\t': '\\t'};
        result = [...replacement].map(c => specials[c] || c).join('');

        // TODO: escape strings that start with the special ^ character...
        result = '"' + result.replace(/^\^/g, '\\u005e') + '"';
    }

    // TODO: explain... recurse!
    else if (isPlainObject(replacement) || isPlainArray(replacement)) {
        let isArray = Array.isArray(replacement);

        // TODO: ...
        visited.set(val, INCOMPLETE);

        // TODO: ...
        // TODO: honour `space` param from stringify()...
        let items = Object.keys(replacement).map(subkey => {
            let keyText = JSON.stringify(subkey);
            if (!isReplaced && keyText === '"$"') keyText = '"\\u0024"'; // TODO: escape special '$' key
            let valText = test(replacement, subkey, replacement[subkey], path.concat(subkey), replacer, visited); // NB: recursive
            return isArray ? valText : `${keyText}:${valText}`;
        });
        result = `${isArray ? '[' : '{'}${items.join(',')}${isArray ? ']' : '}'}`;

        // TODO: ...
        visited.set(val, makeReference(path));
    }

    // If the replacement value is neither a primitive value nor a plain object, then we have a serialization error.
    // There are two possible causes for such an error:
    // (a) an error in the replacer function. Replacer functions are contracted to either leave the value unchanged,
    //     or otherwise to return a primitive value or plain object. So if the replacer returned a modified value
    //     which is not a primitive or plain object, then the problem lies in the replacer function.
    // (b) a non-serializable input value. If the replacer left the input value unchanged, then the input value
    //     must be unserializable with no replacer case that deals with it. That's a problem with the input value.
    else {
        if (!isReplaced) throw new Error(`(KVON) no known serialization available for value: ${val}`);
        throw new Error(`(KVON) replacer function returned a non-serializable value: ${replacement}`);
    }

    // TODO: ... only need to add non-primitives to map??
    if (!visited.has(val)) {
        visited.set(val, result);
    }

    // Return the replacement value.
    return result;
}





// TODO: ...
const INCOMPLETE = <any> {};
