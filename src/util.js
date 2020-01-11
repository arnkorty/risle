export function assign(obj, ...args) {
	return Object.assign(obj, ...args)
}

export function removeNode(node) {
	let parentNode = node.parentNode;
	if (parentNode) parentNode.removeChild(node);
}

export function isFn(fn) {
	return typeof fn === 'function'
}

export function isChanged(a, b) {
	return !a || b.some((item, index) => item !== a[index])
}

export const defer = (fn, cb) => {
	return Promise.resolve().then(() => fn()).then(value =>  cb ? cb(value) : value)
}
// typeof Promise=='function' ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout;
