var toStorable = require("./toStorable");
var errors = require("../../errors");
function addTimed(slowFunction) {
    if (!slowFunction.options)
        throw new Error(errors.TimedFuncsMustHaveOptions);
    var storableFn = toStorable(slowFunction);
    // TODO...
}
exports.default = addTimed;
//# sourceMappingURL=addTimed.js.map