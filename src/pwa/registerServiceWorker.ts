/**
 * GitHub Pages uses Vite base "./". We do not cache user content.
 * Register after page load to avoid slowing the current session.
 */
export function registerHumanPwa(): void {
 if(import.meta.env.DEV || !('serviceWorker' in navigator))return;
 const url=new URL(import.meta.env.BASE_URL+'sw.js',document.baseURI);
 window.addEventListener('load',()=>{
   void navigator.serviceWorker.register(url.href,{scope:import.meta.env.BASE_URL})
     .catch((error:unknown)=>console.warn('HUMAN PWA unavailable',error));
 },{once:true});
}
