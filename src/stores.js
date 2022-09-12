import { writable } from 'svelte/store';

export const user = writable("guest");
export const wsiurl = writable("");
export const wsiport = writable("6900");
export const appport = writable("6455");
export const deepdive = writable("DD_22_07_15");

export const sv = writable(undefined);

export const group = writable("nbig-dsmall");
export const groups = writable([]);

export const slidename = writable("TCGA-A2-A04W-01Z-00-DX1.F7E7B945-2ADC-4741-8FCE-ACEA657DB9C7");
export const slidenames = writable([]);

export const layers = writable([]);
export const scores = writable({});

export const regions = writable({});
export const positions = writable({});
export const tags = writable({});
export const alltags = writable([]);
