/** The distribution vendors React 16.0.0 / ReactDOM 16.0.1 locally. No CDN calls. */
export const React = globalThis.React;
// React 16.0 supports returning arrays but predates the named Fragment API.
if (!React.Fragment)
    React.Fragment = function Fragment({ children }) { return children || null; };
export const ReactDOM = globalThis.ReactDOM;
export default React;
