const P = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" };
const I = ({ children, size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">{children}</svg>
);
export const IconLearn = (p) => <I {...p}><path {...P} d="M9 18V5l11-2v13" /><circle {...P} cx="6" cy="18" r="3" /><circle {...P} cx="17" cy="16" r="3" /></I>;
export const IconCode = (p) => <I {...p}><path {...P} d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 4l-3 16" /></I>;
export const IconCards = (p) => <I {...p}><rect {...P} x="7" y="3" width="12" height="17" rx="2.5" /><path {...P} d="M4.5 6.5v12A2.5 2.5 0 0 0 7 21h9" /></I>;
export const IconUser = (p) => <I {...p}><circle {...P} cx="12" cy="8" r="4" /><path {...P} d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></I>;
export const IconClose = (p) => <I {...p}><path {...P} d="M6 6l12 12M18 6L6 18" /></I>;
export const IconLock = (p) => <I {...p}><rect {...P} x="5" y="11" width="14" height="10" rx="2.5" /><path {...P} d="M8 11V8a4 4 0 0 1 8 0v3" /></I>;
export const IconCheck = (p) => <I {...p}><path {...P} strokeWidth="3" d="M5 12.5l4.5 4.5L19 7.5" /></I>;
export const IconPlay = (p) => <I {...p}><path fill="currentColor" d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" /></I>;
export const IconStar = (p) => <I {...p}><path fill="currentColor" d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" /></I>;
export const IconCrown = (p) => <I {...p}><path fill="currentColor" d="M3 8l4.5 4L12 4l4.5 8L21 8l-2 11H5z" /></I>;
export const IconBack = (p) => <I {...p}><path {...P} d="M15 5l-7 7 7 7" /></I>;
