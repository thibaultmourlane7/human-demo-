/**
 * HUMAN BÂTIMENT — Capacitor configuration (Sprint 12).
 * Capacitor plugins and native projects will be added AFTER package lock
 * generation and environment review. Do not use server.url (remote webview).
 */
const config = {
 appId:'fr.human.batiment',
 appName:'HUMAN Bâtiment',
 webDir:'dist',
 bundledWebRuntime:false,
 server:{androidScheme:'https'},
 ios:{contentInset:'automatic'},
};
export default config;
