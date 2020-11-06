
export default function (el) {
    return (event, detail = {}) => {
        el.dispatchEvent(new CustomEvent(event, {
            detail,
            bubbles: true,
        }))
    }
}
