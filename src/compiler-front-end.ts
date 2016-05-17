'use strict';
import {transform} from './babel';
import {Node} from "babel-types";             // Elided (used only for types)
import {Visitor} from "babel-traverse";    // Elided (used only for types)
import Task from './task';





// TODO: ... doc... Options param?
export function parse(code: string): Node {

    // TODO: Get the AST...
    let plugins = [
        'transform-es2015-destructuring',
        augmentNodesWithScopeInfo
    ];
    let ast = transform(code, {plugins}).ast;
    return ast;
}





// TODO: augment nodes with scope info...
declare module 'babel-types' {
    interface Node {
        scope?: ScopeInfo;
    }
}





// TODO: improve this struct...
export type ScopeInfo = {[name: string]: 'var'|'let'|'const'|'hoisted'|'param'|'module'};





// TODO: doc... define a babel plugin that collects all scope info
let augmentNodesWithScopeInfo = () => ({
    visitor: <Visitor> {
        // Collect info for all block-scopes that have their own bindings.
        // TODO: What introduces a new name?
        // - var decl (var, let, const)
        // - func decl (hoisted)
        // - class decl (not hoisted)
        // - import decl (hoisted)
        // - func expr. scope of name is only *inside* the func body
        // - class expr. scope of name is only *inside* the class body
        // - catch clause. scope of name is only the catch clause body
        Block(path) {
            if (path.scope.block !== path.node) return;
            let idNames = Object.keys(path.scope.bindings);
            let idKinds = idNames.map(name => path.scope.bindings[name].kind);
            let scope = idNames.reduce((ids, name, i) => (ids[name] = idKinds[i], ids), {});
            path.node.scope = scope;
        }
    }
});
