'use strict';
import Reviver from './reviver';
import Serializable, {isSerializablePrimitive, isSerializableObject} from './serializable';





// TODO: ...
export default function postParse(value: Serializable, reviver: Reviver): any {

    // TODO: ...
    let result = traverse(<any> {'':value}, '', value);
    return result;

    // TODO: ...
    function traverse(obj: Serializable, key: string|number, val: Serializable): any {

        // TODO: ...
        if (isSerializablePrimitive(val)) {
            return val;
        }

        // TODO: ...
        if (val.hasOwnProperty('$type')) {

        }


    }
}
