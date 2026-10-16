export const ANOMALY_POINTS = [
  {
    id: 'VAR-CYC-04B',
    name: 'BOB CYCLONIC SYSTEM',
    type: 'Cyclonic Vortex',
    severity: 'SEVERE',
    color: '#8b2b2b',
    coords: [88.4, 14.7], // Bay of Bengal
    efi: 0.94,
    resolution: '12km → 5km',
    trajectory: [
      [88.4, 14.7],
      [86.8, 16.5],
      [85.2, 18.2],
      [84.0, 19.8]
    ]
  },
  {
    id: 'VAR-DEP-02A',
    name: 'ARABIAN CONVECTIVE SHEAR',
    type: 'Deep Depression',
    severity: 'MODERATE',
    color: '#92521e',
    coords: [66.5, 18.4], // Arabian Sea
    efi: 0.81,
    resolution: '12km → 5km',
    trajectory: [
      [66.5, 18.4],
      [64.2, 19.6],
      [61.8, 20.9]
    ]
  },
  {
    id: 'VAR-THERM-01S',
    name: 'EQUATORIAL SST ANOMALY',
    type: 'Extreme Thermal Spike',
    severity: 'LOW',
    color: '#4a6fa5',
    coords: [78.2, -7.5], // Southern Indian Ocean
    efi: 0.67,
    resolution: '12km → 5km',
    trajectory: [
      [78.2, -7.5],
      [76.8, -8.2],
      [74.5, -9.0]
    ]
  }
];
