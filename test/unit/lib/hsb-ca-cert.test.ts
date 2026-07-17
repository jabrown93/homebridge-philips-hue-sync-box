import { describe, it, expect } from '@jest/globals';
import { X509Certificate } from 'node:crypto';
import { HSB_CA_CERT } from '../../../src/lib/hsb-ca-cert.js';

describe('HSB_CA_CERT', () => {
  it('parses as a valid, self-signed X.509 certificate', () => {
    const cert = new X509Certificate(HSB_CA_CERT);
    expect(cert.issuer).toBe(cert.subject);
    expect(cert.checkIssued(cert)).toBe(true);
  });

  it('identifies Philips Hue as the issuer of the Sync Box root CA', () => {
    const cert = new X509Certificate(HSB_CA_CERT);
    expect(cert.subject).toContain('O=Philips Hue');
    expect(cert.subject).toContain('CN=root-hsb');
  });

  it('is marked as a CA certificate', () => {
    const cert = new X509Certificate(HSB_CA_CERT);
    expect(cert.ca).toBe(true);
  });

  it('is currently valid', () => {
    const cert = new X509Certificate(HSB_CA_CERT);
    const now = Date.now();
    expect(new Date(cert.validFrom).getTime()).toBeLessThan(now);
    expect(new Date(cert.validTo).getTime()).toBeGreaterThan(now);
  });
});
