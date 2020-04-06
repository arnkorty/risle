import { EMPTY_OBJ, EMPTY_ARR } from './constants';
import { commitRoot, diff } from './diff';
import { createElement, Fragment } from './element';
// import options from './options';

export function render(vnode, parentDom, replaceNode) {
  // if (options._root) options._root(vnode, parentDom);

  // let isHydrating = replaceNode === IS_HYDRATE;
  let oldVNode =  replaceNode && replaceNode._children || parentDom._children;
  vnode = createElement(Fragment, null, [vnode]);

  let mounts = [];
  diff(
    parentDom,
    (replaceNode || parentDom)._children = vnode,
    oldVNode || EMPTY_OBJ,
    replaceNode
      ? [replaceNode]
      : oldVNode
        ? null
        : EMPTY_ARR.slice.call(parentDom.childNodes),
    mounts,
    replaceNode || EMPTY_OBJ,
  );
  commitRoot(mounts, vnode);
}
