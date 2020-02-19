import { EMPTY_OBJ, EMPTY_ARR } from './constants';
import { Component, enqueueRender, getDomSibling } from './component';
import { Fragment, coerceToVNode } from './element';
import { USE_EFFECT, USE_LAYOUT_EFFECT} from './constants'
import { assign, removeNode, defer } from './util';
import { setCurrentVNode } from './hooks'

export function diff(parentDom, newVNode, oldVNode,  excessDomChildren, mounts, oldDom) {
	let tmp, newType = newVNode.type;

	if (newVNode.constructor !== undefined) return null;

	try {
		if (typeof newType==='function') {
			let c;
			let newProps = newVNode.props;

			if (oldVNode._component) {
				c = newVNode._component = oldVNode._component;
			}
			else {
					newVNode._component = c = new Component(newProps);
					c.fn = newType;

				c.props = newProps;
			}

			c.props = newProps;

			setCurrentVNode(newVNode)

			c._dirty = false;
			c._vnode = newVNode;
			c._parentDom = parentDom;

			tmp = c.fn(c.props);
			newVNode._children = toChildArray(tmp);

			diffChildren(parentDom, newVNode, oldVNode, excessDomChildren, mounts, oldDom);

			c.base = newVNode._dom;

			didMounted(c._vnode)
		}
		else {
			newVNode._dom = diffElementNodes(oldVNode._dom, newVNode, oldVNode, excessDomChildren, mounts);
		}
	}
	catch (e) {
		catchError(e, newVNode, oldVNode);
	}

	return newVNode._dom;
}

const didMounted = (vnode) => {
	const component = vnode._component
	if (component && component.hooks) {
		component.hooks.forEach((hook) => {
			if (hook && hook[0]) {
				if (hook[1] === USE_EFFECT) {
					defer(() => {
						const cb = hook[0]
						hook[0] = null
						cb()
					}, (value) => hook[3] = value)
				} else if (hook[1] === USE_LAYOUT_EFFECT) {
					hook[3] = hook[0]()
					hook[0] = null
				}
			}
		})
	}
}

export function commitRoot(mounts, root) {
	let c;
	while ((c = mounts.pop())) {
		try {
		}
		catch (e) {
			catchError(e, c._vnode);
		}
	}
}

function diffElementNodes(dom, newVNode, oldVNode,  excessDomChildren, mounts) {
	let i;
	let oldProps = oldVNode.props;
	let newProps = newVNode.props;

	if (dom==null && excessDomChildren!=null) {
		for (i=0; i<excessDomChildren.length; i++) {
			const child = excessDomChildren[i];

			if (child!=null && (newVNode.type===null ? child.nodeType===3 : child.localName===newVNode.type)) {
				dom = child;
				excessDomChildren[i] = null;
				break;
			}
		}
	}

	if (dom==null) {
		if (newVNode.type===null) {
			return document.createTextNode(newProps);
		}
		dom = document.createElement(newVNode.type);

		excessDomChildren = null;
	}
	if (newVNode.type===null) {
		if (excessDomChildren!=null) excessDomChildren[excessDomChildren.indexOf(dom)] = null;
		if (oldProps !== newProps) {
			dom.data = newProps;
		}
	}
	else if (newVNode!==oldVNode) {
		if (excessDomChildren!=null) {
			excessDomChildren = EMPTY_ARR.slice.call(dom.childNodes);
		}

		oldProps = oldVNode.props || EMPTY_OBJ;

		let oldHtml = oldProps.dangerouslySetInnerHTML;
		let newHtml = newProps.dangerouslySetInnerHTML;
		if (oldProps === EMPTY_OBJ) {
			oldProps = {};
			for (let i=0; i<dom.attributes.length; i++) {
				oldProps[dom.attributes[i].name] = dom.attributes[i].value;
			}
		}

		if (newHtml || oldHtml) {
			if (!newHtml || !oldHtml || newHtml.__html!=oldHtml.__html) {
				dom.innerHTML = newHtml && newHtml.__html || '';
			}
		}

		updateProps(dom, newProps, oldProps);

		newVNode._children = newVNode.props.children;

		if (!newHtml) {
			diffChildren(dom, newVNode, oldVNode,  excessDomChildren, mounts, EMPTY_OBJ);
		}
	}

	return dom;
}

export function applyRef(ref, value, vnode) {
	try {
		if (typeof ref=='function') ref(value);
		else ref.current = value;
	}
	catch (e) {
		catchError(e, vnode);
	}
}

export function unmount(vnode, parentVNode, skipRemove) {
	let r;
	if (r = vnode.ref) {
		applyRef(r, null, parentVNode);
	}

	let dom;
	if (!skipRemove && typeof vnode.type !== 'function') {
		skipRemove = (dom = vnode._dom)!=null;
	}

	vnode._dom = vnode._lastDomChild = null;

	if ((r = vnode._component)!=null) {
		if (r.hooks) {
			r.hooks.forEach((hook) => {
				if (hook && typeof hook[3] === 'function') {
					if (hook[1] === USE_EFFECT) {
						defer(hook[3])
					} else if (hook[1] === USE_LAYOUT_EFFECT) {
						hook[3]()
					}
				}
			})
		}
		r.base = r._parentDom = null;
	}

	if (r = vnode._children) {
		for (let i = 0; i < r.length; i++) {
			if (r[i]) unmount(r[i], parentVNode, skipRemove);
		}
	}

	if (dom!=null) removeNode(dom);
}

const catchError = function (error, vnode, oldVNode) {

	let component;

	for (; vnode = vnode._parent;) {
		if ((component = vnode._component) && !component._processingException) {
			try {
				return enqueueRender(component._pendingError = component);
			}
			catch (e) {
				error = e;
			}
		}
	}

	throw error;
};

export function diffChildren(parentDom, newParentVNode, oldParentVNode,  excessDomChildren, mounts, oldDom) {
	let i = 0, j, oldVNode, newDom, sibDom, firstChildDom, refs;

	let oldChildren = (oldParentVNode && oldParentVNode._children) || EMPTY_ARR;

	let oldChildrenLength = oldChildren.length;

	if (oldDom == EMPTY_OBJ) {
		if (excessDomChildren != null) {
			oldDom = excessDomChildren[0];
		}
		else if (oldChildrenLength) {
			oldDom = getDomSibling(oldParentVNode, 0);
		}
		else {
			oldDom = null;
		}
	}

	newParentVNode._children = toChildArray(newParentVNode._children, childVNode => {

		if (childVNode!=null) {
			childVNode._parent = newParentVNode;
			childVNode._depth = newParentVNode._depth + 1;

			oldVNode = oldChildren[i];

			if (oldVNode===null || (oldVNode && childVNode.key == oldVNode.key && childVNode.type === oldVNode.type)) {
				oldChildren[i] = undefined;
			}
			else {
				for (j=0; j<oldChildrenLength; j++) {
					oldVNode = oldChildren[j];
					if (oldVNode && childVNode.key == oldVNode.key && childVNode.type === oldVNode.type) {
						oldChildren[j] = undefined;
						break;
					}
					oldVNode = null;
				}
			}

			oldVNode = oldVNode || EMPTY_OBJ;

			newDom = diff(parentDom, childVNode, oldVNode,  excessDomChildren, mounts, oldDom);

			if ((j = childVNode.ref) && oldVNode.ref != j) {
				(refs || (refs=[])).push(j, childVNode._component || newDom, childVNode);
			}

			if (newDom!=null) {
				if (firstChildDom == null) {
					firstChildDom = newDom;
				}

				if (childVNode._lastDomChild != null) {
					newDom = childVNode._lastDomChild;

					childVNode._lastDomChild = null;
				}
				else if (excessDomChildren==oldVNode || newDom!=oldDom || newDom.parentNode==null) {
					outer: if (oldDom==null || oldDom.parentNode!==parentDom) {
						parentDom.appendChild(newDom);
					}
					else {
						for (sibDom=oldDom, j=0; (sibDom=sibDom.nextSibling) && j<oldChildrenLength; j+=2) {
							if (sibDom==newDom) {
								break outer;
							}
						}
						parentDom.insertBefore(newDom, oldDom);
					}

					if (newParentVNode.type == 'option') {
						parentDom.value = '';
					}
				}

				oldDom = newDom.nextSibling;

				if (typeof newParentVNode.type == 'function') {
					newParentVNode._lastDomChild = newDom;
				}
			}
		}

		i++;
		return childVNode;
	});

	newParentVNode._dom = firstChildDom;

	if (excessDomChildren!=null && typeof newParentVNode.type !== 'function') for (i=excessDomChildren.length; i--; ) if (excessDomChildren[i]!=null) removeNode(excessDomChildren[i]);

	for (i=oldChildrenLength; i--; ) if (oldChildren[i]!=null) unmount(oldChildren[i], oldChildren[i]);
	if (refs) {
		for (i = 0; i < refs.length; i++) {
			applyRef(refs[i], refs[++i], refs[++i]);
		}
	}
}

export function toChildArray(children, callback, flattened) {
	if (flattened == null) flattened = [];

	if (children==null || typeof children === 'boolean') {
		if (callback) flattened.push(callback(null));
	} else if (Array.isArray(children)) {
		for (let i=0; i < children.length; i++) {
			toChildArray(children[i], callback, flattened);
		}
	} else {
		flattened.push(callback ? callback(coerceToVNode(children)) : children);
	}

	return flattened;
}

export function updateProps(dom, newProps, oldProps) {
	for (let name in assign({}, oldProps, newProps )) {
    let oldValue = oldProps[name]
    let newValue = newProps[name]

    if (oldValue == newValue || name === 'children') {
    } else if (name === 'style' && (oldValue || newValue)) {
      for (const k in assign({}, oldValue, newValue )) {
        if (!(oldValue && newValue && oldValue[k] === newValue[k])) {
          dom[name][k] = (newValue && newValue[k]) || ''
        }
      }
    } else if (name[0] === 'o' && name[1] === 'n') {
      name = name.slice(2).toLowerCase()
      if (oldValue) dom.removeEventListener(name, oldValue)
      dom.addEventListener(name, newValue)
    } else if (name in dom && !(dom instanceof SVGElement)) {
      dom[name] = newValue == null ? '' : newValue
    } else if (newValue == null || newValue === false) {
      dom.removeAttribute(name)
    } else {
      dom.setAttribute(name, newValue)
    }
  }
}
