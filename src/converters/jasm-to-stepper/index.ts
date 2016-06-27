import {createGlobal, isGlobal} from '../../global-object/global-object';
import InstructionSet from '../../types/instruction-set';
import Jasm from '../../types/jasm';
import KVON from '../../formats/kvon/index'; // TODO: explicit index, so it works with AMD too
import {parse} from './jasm-parser';
import Register from '../../types/register';
import RegisterSet from '../../types/register-set';
import Stepper from '../../types/stepper';





// TODO: ...
export default function jasmToStepper(jasm: Jasm): Stepper {
    let globalObject = createGlobal();
    let stepper = new StepperImpl(jasm, globalObject, tempPark);
    return stepper;
}





// TODO: ...
export class StepperImpl implements Stepper {


    // TODO: ...
    constructor(jasm: Jasm, globalObject?: {}, park?: (state: any) => Promise<void>) {
        park = park || (async () => {});
        this.jasm = jasm;
        let virtualMachine = this._virtualMachine = makeVirtualMachine(park);
        let registers = this.registers = <any> virtualMachine;
        registers.ENV.value = globalObject || {};
        this.next = makeNextFunction(jasm, virtualMachine);
    }


    // TODO: doc... unhandled exceptions in the script will be thrown here...
    // TODO: what if step() is called again after jasm finished/errored? Expected behaviour? Undefined behaviour for now...
    next: () => IteratorResult<Promise<void>>;


    // TODO: doc... does this need to otherwise work like step(), return a value, etc? I think not, but think about it...
    throw(err: any): IteratorResult<Promise<void>> {
        let reg: Register = {name: 'temp', value: err}; // TODO: this creates a non-existent register. Better way? Is this reliable?
        this._virtualMachine.THROW(reg); // TODO: this executes an instruction that is not in the JASM program. What happens to PC, etc??
        // TODO: ^ will throw back at caller if JASM program doesn't handle it
        // TODO: is JASM program *does* handle it, what should we return from here?
        // TODO: temp just for now...
        return { done: false, value: Promise.resolve() };
    }


    // TODO: ...
    jasm: Jasm;


    // TODO: ...
    registers: RegisterSet & {[name: string]: Register};


    // TODO: ...
    private _virtualMachine: InstructionSet & RegisterSet;
}





// TODO: implement properly...
async function tempPark(state: any) {
    let s = KVON.stringify(state, replacer, 4);
    console.log(`PARK: ${s}`);
// TODO: temp testing...
let o = KVON.parse(s, reviver);
console.log(`UNPARK:`);
console.log(o);


    // TODO: temp testing...
    // - support special storage of Promise that rejects with 'EpochRestartError' on revival (or ExtinctionError?, UnrevivableError?, RevivalError?)
    function replacer(key: string, val: any) {
        if (isGlobal(val)) {
            let keys = Object.keys(val);
            return { $type: 'Global', props: keys.reduce((props, key) => (props[key] = val[key], props), {}) };
        }
        if (val && typeof val.then === 'function') {
            return { $type: 'Promise', value: ['???'] };
        }
        return val;
    }
    function reviver(key: string, val: any) {
        if (!val || Object.getPrototypeOf(val) !== Object.prototype || ! val.$type) return val;
        if (val.$type === 'Global') {
            let g = createGlobal();
            Object.keys(val.props).forEach(key => g[key] = val.props[key]);
            return g;
        }
        else if (val.$type === 'Promise') {
            return Promise.resolve(42);
        }
        return val;
    }
}






// TODO: ...
function makeNextFunction(jasm: Jasm, virtualMachine: InstructionSet & RegisterSet): () => IteratorResult<Promise<void>> {

    let ast = parse(jasm);

    // TODO: Associate each label with it's one-based line number...
    let labels = ast.code.reduce((labels, line, i) => {
        if (line.type === 'label') labels[line.name] = i + 1;
        return labels;
    }, {});

    // TODO: ...
    let codeLines = ast.code.map(line => {
        switch (line.type) {
            case 'blank':
                return `// ${line.comment}`;
            case 'label':
                return `// ${line.name}:`;
            case 'instruction':
                return `${line.opcode.toUpperCase()}(${line.arguments.map(arg => {
                    switch (arg.type) {
                        case 'register':
                            return arg.name;
                        case 'label':
                            return labels[arg.name];
                        case 'const':
                            return JSON.stringify(arg.value);
                        default:
                            // NB: Runtime exhaustiveness check. We can only get here if argument types were added to other code but not here.
                            throw new Error(`Unhandled JASM instruction argument type`);
                    }
                })})`;
            default:
                // NB: Runtime exhaustiveness check. We can only get here if lines types were added to other code but not here.
                throw new Error(`Unhandled JASM code line type`);
        }
    });

    // TODO: re-format lines as switch cases...
    let lines: string[] = [];
    let prevIsCommentLine = false;
    codeLines.forEach((line, i) => {
        let isCommentLine = line.startsWith('//');
        let result = '';
        if (isCommentLine) {
            if (!prevIsCommentLine) lines.push('');
            result += `            ${line}`;
        }
        else {
            result += `case ${`${i+1}:    `.slice(0, 6)} p = ${line};`;
            result += ' '.repeat(Math.max(0, 74 - result.length)) + 'break;';
        }
        lines.push(result);
        prevIsCommentLine = isCommentLine;
    });

    // TODO: Eval up the step() function...
    // TODO: what if an THROW/AWAIT op rejects? It's not handled properly in the current VM code...
    let makeCode = new Function('vm', `
        with (vm) return (() => {
            let p;
            switch (PC.value++) {
                ${lines.map(line => `${' '.repeat(16)}${line}`).join('\n').slice(16)}
            }
            let done = PC.value > ${codeLines.length}; // If done, must have seen STOP instruction
            let result = { done, value: done ? void 0 : Promise.resolve(p) };
            return result;
        })`);
    let result: () => IteratorResult<Promise<void>> = makeCode(virtualMachine);

    // TODO: temp testing... remove...
    console.log(result.toString())
    return result;
}





// TODO: ...
function makeVirtualMachine(park: (state: any) => Promise<void>): InstructionSet & RegisterSet {
    let virtualMachine: InstructionSet & RegisterSet = <any> {};
    makeRegisters(virtualMachine);
    makeInstructions(virtualMachine, virtualMachine.PC, park);
    return virtualMachine;
}




// TODO: ...
function makeInstructions(target: InstructionSet, pc: Register, park: (state: any) => Promise<void>) {
    let instructions: InstructionSet = {

// TODO: convert all to method shorthand - too risky with return value otherwise, in case a Promise shows up (eg in CALL)...

        // Load/store
        // TODO: properly handle use before assignment for block-scoped vars, prevent re-assignment of consts, etc
        LOAD:   (tgt, obj, key) => { tgt.value = obj.value[key.value]; },
        STORE:  (obj, key, src) => { obj.value[key.value] = src.value; },

        // Arithmetic/logic
        ADD:    (tgt, lhs, rhs) => { tgt.value = lhs.value + rhs.value; },
        SUB:    (tgt, lhs, rhs) => { tgt.value = lhs.value - rhs.value; },
        MUL:    (tgt, lhs, rhs) => { tgt.value = lhs.value * rhs.value; },
        DIV:    (tgt, lhs, rhs) => { tgt.value = lhs.value / rhs.value; },
        NEG:    (tgt, arg) => { tgt.value = -arg.value; },
        NOT:    (tgt, arg) => { tgt.value = !arg.value; },

        // Relational
        EQ:     (tgt, lhs, rhs) => { tgt.value = lhs.value === rhs.value; },
        GE:     (tgt, lhs, rhs) => { tgt.value = lhs.value >= rhs.value; },
        GT:     (tgt, lhs, rhs) => { tgt.value = lhs.value > rhs.value; },
        LE:     (tgt, lhs, rhs) => { tgt.value = lhs.value <= rhs.value; },
        LT:     (tgt, lhs, rhs) => { tgt.value = lhs.value < rhs.value; },
        NE:     (tgt, lhs, rhs) => { tgt.value = lhs.value !== rhs.value; },

        // Control
        B:      (line: number) => { pc.value = line; },
        BF:     (line: number, arg) => { arg.value ? null : pc.value = line; },
        BT:     (line: number, arg) => { arg.value ? pc.value = line : null; },
        CALL:   (tgt, func, thís, args) => { tgt.value = func.value.apply(thís.value, args.value); },
        THROW:  (err) => Promise.reject(err.value), // TODO: temporary soln... how to really implement this?
        AWAIT:  async (tgt, arg) => tgt.value = await arg.value,
        STOP:   () => { pc.value = Infinity; },

        // Data
        STRING: (tgt, val) => { tgt.value = val; },
        NUMBER: (tgt, val) => { tgt.value = val; },
        REGEXP: (tgt, pattern, flags) => { tgt.value = new RegExp(pattern, flags); },
        ARRAY:  (tgt) => { tgt.value = []; },
        OBJECT: (tgt) => { tgt.value = {}; },
        TRUE:   (tgt) => { tgt.value = true; },
        FALSE:  (tgt) => { tgt.value = false; },
        NULL:   (tgt) => { tgt.value = null; },
        UNDEFD:   (tgt) => { tgt.value = void 0; },

        // Meta
        PARK:   (...regs) => park(regs.reduce((state, reg) => (state[reg.name] = reg.value, state), {}))
    };

    // TODO: copy to target...
    Object.keys(instructions).forEach(key => {
        target[key] = instructions[key];
    });
}





// TODO: ...
function makeRegisters(target: RegisterSet) {

    let registers: RegisterSet = {
        // TODO: add ERR register for exception in flight? (can only be one)
        PC:     {name: 'PC', value: 1},
        ENV:    {name: 'ENV', value: void 0},
        $0:     {name: '$0', value: void 0},
        $1:     {name: '$1', value: void 0},
        $2:     {name: '$2', value: void 0},
        $3:     {name: '$3', value: void 0},
        $4:     {name: '$4', value: void 0},
        $5:     {name: '$5', value: void 0},
        $6:     {name: '$6', value: void 0},
        $7:     {name: '$7', value: void 0}
    };

    // TODO: copy to target...
    Object.keys(registers).forEach(key => {
        target[key] = registers[key];
    });
}
