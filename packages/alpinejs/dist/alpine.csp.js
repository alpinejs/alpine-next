import Alpine from "./../src/index";
import {cspCompliantEvaluator} from "./../src/evaluator";
Alpine.setEvaluator(cspCompliantEvaluator);
var csp_default = Alpine;
export {
  csp_default as default
};
