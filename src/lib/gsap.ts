// GSAP with ScrollTrigger, registered once for every script on the page.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Phones resize the viewport as the address bar shows and hides; don't
// recalculate every scroll position each time that happens.
ScrollTrigger.config({ ignoreMobileResize: true });

// Web fonts change the height of text, so measure again once they're in
document.fonts?.ready.then(() => ScrollTrigger.refresh());

export { gsap, ScrollTrigger };
