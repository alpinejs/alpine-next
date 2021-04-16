import { skipDuringClone } from "../clone";
import { directive } from "../directives";
import { evaluate } from "../evaluator";

directive('init', skipDuringClone((el, { expression }) => evaluate(el, expression, {}, false)))
