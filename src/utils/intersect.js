
window.Element.prototype._x_intersect = function ({ enter = () => {}, leave = () => {} } = {}) {
    let observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.intersectionRatio > 0) {
                enter()
            } else {
                leave()
            }
        });
    });

    observer.observe(this);

    return observer
}
