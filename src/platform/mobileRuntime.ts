/**
 * UI-only, no privileged native action. Works in web/PWA before Capacitor
 * is installed. A native upload/share bridge will be added after private
 * Supabase Storage policies are reviewed and deployed.
 */
type CapacitorLike={isNativePlatform?:()=>boolean;getPlatform?:()=>string};
export type Runtime='web'|'android'|'ios';
export function detectHumanRuntime(capacitor?:CapacitorLike):Runtime{
 if(capacitor?.isNativePlatform?.()===true){
   const platform=capacitor.getPlatform?.();
   if(platform==='android'||platform==='ios')return platform;
 }
 return 'web';
}
export function getHumanRuntime():Runtime{
 if(typeof window==='undefined')return 'web';
 const withBridge=window as typeof window & {Capacitor?:CapacitorLike};
 return detectHumanRuntime(withBridge.Capacitor);
}
/** Photos are selected with normal browser APIs until native plugins are reviewed. */
export const nativeFeatures=Object.freeze({
 confidentialOfflineStorage:false,
 pushNotifications:false,
 backgroundPayments:false,
 nativePhotoPlugin:false,
 nativeDeepLinkLogin:false,
});
