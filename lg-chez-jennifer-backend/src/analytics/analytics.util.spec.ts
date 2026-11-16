import { describe, expect, it } from 'vitest';
import { classifyDevice, classifySource, cleanPath, isBot } from './analytics.util.js';

const OWN = ['chezjeynnifer.online'];
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148';

describe('classifySource', () => {
  it('paramètre de campagne en priorité', () => {
    expect(classifySource({ src: 'insta', ref: 'https://google.com/' })).toBe('Instagram');
    expect(classifySource({ src: 'affiche-plage' })).toBe('Affiche-plage');
  });
  it('référent', () => {
    expect(classifySource({ ref: 'https://l.instagram.com/?u=x' })).toBe('Instagram');
    expect(classifySource({ ref: 'https://m.facebook.com/' })).toBe('Facebook');
    expect(classifySource({ ref: 'https://www.google.com/' })).toBe('Google');
    expect(classifySource({ ref: 'https://exemple.ci/page' })).toBe('exemple.ci');
  });
  it('navigation interne : pas une entrée', () => {
    expect(classifySource({ ref: 'https://www.chezjeynnifer.online/evenements', ownHosts: OWN })).toBeNull();
  });
  it("sans référent : appli d'origine ou accès direct", () => {
    expect(classifySource({ ua: `${IPHONE} Instagram 300.0` })).toBe('Instagram');
    expect(classifySource({ ua: `${IPHONE} [FBAN/FBIOS;FBAV/400]` })).toBe('Facebook');
    expect(classifySource({ ua: IPHONE })).toBe('Direct');
  });
});

describe('appareil, robots, chemins', () => {
  it('appareil', () => {
    expect(classifyDevice(IPHONE)).toBe('mobile');
    expect(classifyDevice('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)')).toBe('tablet');
    expect(classifyDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Chrome/130')).toBe('desktop');
  });
  it('robots', () => {
    expect(isBot('facebookexternalhit/1.1')).toBe(true);
    expect(isBot('Mozilla/5.0 HeadlessChrome/130')).toBe(true);
    expect(isBot(IPHONE)).toBe(false);
  });
  it('chemins', () => {
    expect(cleanPath('/beach-party?src=insta#faq')).toBe('/beach-party');
    expect(cleanPath('/evenements/')).toBe('/evenements');
    expect(cleanPath('/')).toBe('/');
    expect(cleanPath('/admin/commandes')).toBeNull();
    expect(cleanPath('/reserver/confirmation/5366deb7-88d9')).toBe('/reserver/confirmation');
    expect(cleanPath('https://x.com')).toBeNull();
  });
});
