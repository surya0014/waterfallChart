/**
 *  SVG Helpers
 */

import { addClass } from "./dom";

export interface StringToStringOrNumberMap { [key: string]: string | number; }
export type DomAttributeMap = StringToStringOrNumberMap;
export type CssStyleMap = StringToStringOrNumberMap;

/** Namespace for SVG Elements */
const svgNamespaceUri = "http://www.w3.org/2000/svg";

function entries(obj: StringToStringOrNumberMap): Array<[string, string]> {
  const entries: Array<[string, string]> = [];
  for (const k of Object.keys(obj)) {
    entries.push([k, String((obj[k]))]);
  }
  return entries;
}

function safeSetAttribute(el: SVGElement, key: string, s: string) {
  if (!(key in el)) {
    console.warn(new Error(`Trying to set non-existing attribute ${key} = ${s} on a <${el.tagName.toLowerCase()}>.`));
  }
  el.setAttributeNS(null, key, s);
}

interface StylableSVGElement extends SVGElement {
  readonly style: CSSStyleDeclaration;
}

function safeSetStyle(el: StylableSVGElement, key: string, s: string) {
  if (key in el.style) {
    el.style[key] = s;
  } else {
    console.warn(new Error(`Trying to set non-existing style ${key} = ${s} on a <${el.tagName.toLowerCase()}>.`));
  }
}

interface SvgElementOptions {
  attributes?: DomAttributeMap;
  css?: CssStyleMap;
  text?: string;
  className?: string;
}

function newElement<T extends StylableSVGElement>(tagName: string,
                                                  {
                                                    attributes = {},
    css = {},
    text = "",
    className = "",
                                                  }: SvgElementOptions = {}): T {
  const element = document.createElementNS(svgNamespaceUri, tagName) as T;
  if (className) {
    addClass(element, className);
  }
  if (text) {
    element.textContent = text;
  }
  entries(css).forEach(([key, value]) => safeSetStyle(element, key, value));
  entries(attributes).forEach(([key, value]) => safeSetAttribute(element, key, value));

  return element;
}

export function newSvg(className: string, attributes: DomAttributeMap, css: CssStyleMap = {}): SVGSVGElement {
  return newElement<SVGSVGElement>("svg", { className, attributes, css });
}

export function newG(className: string, attributes: DomAttributeMap = {}, css: CssStyleMap = {}): SVGGElement {
  return newElement<SVGGElement>("g", { className, attributes, css });
}

export function newClipPath(id: string): SVGClipPathElement {
  const attributes = { id };
  return newElement<SVGClipPathElement>("clipPath", { attributes });
}

export function newForeignObject(attributes: DomAttributeMap) {
  return newElement<SVGForeignObjectElement>("foreignObject", { attributes });
}

export function newA(className: string): SVGAElement {
  return newElement<SVGAElement>("a", { className });
}

export function newRect(attributes: DomAttributeMap,
                        className: string = "",
                        css: CssStyleMap = {}) {
  return newElement<SVGRectElement>("rect", { attributes, className, css });
}

export function newLine(attributes: DomAttributeMap,
                        className: string = "") {
  return newElement<SVGLineElement>("line", { className, attributes });
}

export function newTitle(text: string) {
  const title = document.createElementNS(svgNamespaceUri, "title");
  title.setAttribute("text", text);
  return title;
}

export function newTextEl(text: string,
                          attributes: DomAttributeMap = {},
                          css: CssStyleMap = {}) {
  return newElement<SVGTextElement>("text", { text, attributes, css });
}

export function newPath(d: string) {
  const path = document.createElementNS(svgNamespaceUri, "path");
  path.setAttribute("d", d);
  return path;
}

/** temp SVG element for size measurements  */
const getTestSVGEl = (() => {
  /** Reference to Temp SVG element for size measurements */
  let svgTestEl: SVGSVGElement;
  let removeSvgTestElTimeout;

  return () => {
    // lazy init svgTestEl
    if (svgTestEl === undefined) {
      const attributes = {
        "className": "water-fall-chart temp",
        "width": "9999px",
      };
      const css = {
        "left": "0px",
        "position": "absolute",
        "top": "0px",
        "visibility": "hidden",
        "z-index": "99999",
      };
      svgTestEl = newSvg("water-fall-chart temp", attributes, css);
    }

    // needs access to body to measure size
    // TODO: refactor for server side use
    if (svgTestEl.parentElement === undefined) {
      window.document.body.appendChild(svgTestEl);
    }

    // debounced time-deleayed cleanup, so the element can be re-used in tight loops
    clearTimeout(removeSvgTestElTimeout);
    removeSvgTestElTimeout = setTimeout(() => {
      svgTestEl.parentNode.removeChild(svgTestEl);
    }, 500);

    return svgTestEl;
  };
})();

/**
 * Measure the width of a SVGTextElement in px
 * @param  {SVGTextElement} textNode
 * @param  {boolean=false} skipClone - do not clone `textNode` and use original
 * @returns number
 */
export function getNodeTextWidth(textNode: SVGTextElement, skipClone: boolean = false): number {
  const tmp = getTestSVGEl();
  let tmpTextNode: SVGTextElement;
  let shadow;
  if (skipClone) {
    shadow = textNode.style.textShadow;
    tmpTextNode = textNode;
  } else {
    tmpTextNode = textNode.cloneNode(true) as SVGTextElement;
    tmpTextNode.setAttribute("x", "0");
    tmpTextNode.setAttribute("y", "0");
  }
  // make sure to turn of shadow for performance
  tmpTextNode.style.textShadow = "0";
  tmp.appendChild(tmpTextNode);
  window.document.body.appendChild(tmp);
  const width = tmpTextNode.getBBox().width;
  if (skipClone && shadow !== undefined) {
    textNode.style.textShadow = shadow;
  }
  return width;
}
