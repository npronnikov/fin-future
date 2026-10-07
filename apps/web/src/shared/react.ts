/** The distribution vendors React 16.0.0 / ReactDOM 16.0.1 locally. No CDN calls. */
export const React: any = (globalThis as any).React;
// React 16.0 supports returning arrays but predates the named Fragment API.
if (!React.Fragment)
    React.Fragment = function Fragment({ children }: any) { return children || null; };
export const ReactDOM: any = (globalThis as any).ReactDOM;
export default React;
declare global {
    namespace JSX {
        interface Element {
        }
        interface IntrinsicElements {
            [name: string]: any;
        }
        interface ElementChildrenAttribute {
            children: {};
        }
        interface IntrinsicAttributes {
            key?: string | number;
        }
    }
}
