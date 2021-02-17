import { evaluate } from "../evaluator";

export default (el, { expression }) => evaluate(el, expression, {}, false)
