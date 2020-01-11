import { assign, defer } from './util';
import { diff, commitRoot } from './diff';
// import options from './options';
import { Fragment } from './element';

export function Component(props) {
	this.props = props;
}
Component.prototype.render = Fragment;

export function getDomSibling(vnode, childIndex) {
	if (childIndex == null) {
		// Use childIndex==null as a signal to resume the search from the vnode's sibling
		return vnode._parent
			? getDomSibling(vnode._parent, vnode._parent._children.indexOf(vnode) + 1)
			: null;
	}

	let sibling;
	for (; childIndex < vnode._children.length; childIndex++) {
		sibling = vnode._children[childIndex];

		if (sibling != null && sibling._dom != null) {
			return sibling._dom;
		}
	}

	return typeof vnode.type === 'function' ? getDomSibling(vnode) : null;
}

function renderComponent(component) {
	let vnode = component._vnode,
		oldDom = vnode._dom,
		parentDom = component._parentDom;

	if (parentDom) {
		let mounts = [];
		let newDom = diff(parentDom, vnode, assign({}, vnode), null, mounts, oldDom == null ? getDomSibling(vnode) : oldDom);
		commitRoot(mounts, vnode);

		if (newDom != oldDom) {
			updateParentDomPointers(vnode);
		}
	}
}

function updateParentDomPointers(vnode) {
	if ((vnode = vnode._parent) != null && vnode._component != null) {
		vnode._dom = vnode._component.base = null;
		for (let i = 0; i < vnode._children.length; i++) {
			let child = vnode._children[i];
			if (child != null && child._dom != null) {
				vnode._dom = vnode._component.base = child._dom;
				break;
			}
		}

		return updateParentDomPointers(vnode);
	}
}

const renderQueue = [];

export function enqueueRender(c) {
	if ((!c._dirty && (c._dirty = true) && renderQueue.push(c) === 1)) {
		defer(scheduleWork);
	}
}

function scheduleWork() {
	let p;
	renderQueue.sort((a, b) => b._vnode._depth - a._vnode._depth);
	// console.log("renderQueue...", renderQueue.length)
	while ((p=renderQueue.pop())) {
		if (p._dirty) renderComponent(p);
	}
}
