const DRIVER_PROFILES = [
  {
    id: 'DRV-BLR-01',
    name: 'Ravi Kumar',
    warehouseId: 'WH-NYC',
    warehouseName: 'Bangalore Warehouse'
  },
  {
    id: 'DRV-MDY-02',
    name: 'Megha R',
    warehouseId: 'WH-LA',
    warehouseName: 'Mandya Distribution Center'
  },
  {
    id: 'DRV-KGR-03',
    name: 'Arjun P',
    warehouseId: 'WH-CHI',
    warehouseName: 'Kengeri Hub'
  },
  {
    id: 'DRV-MYS-04',
    name: 'Nikhil S',
    warehouseId: 'WH-ATL',
    warehouseName: 'Mysore Warehouse'
  },
  {
    id: 'DRV-TMK-05',
    name: 'Divya N',
    warehouseId: 'WH-SEA',
    warehouseName: 'Tumkur Hub'
  }
];

function getDriverByWarehouse(warehouseId) {
  return DRIVER_PROFILES.find((driver) => driver.warehouseId === warehouseId) || null;
}

function getDriverById(driverId) {
  return DRIVER_PROFILES.find((driver) => driver.id === driverId) || null;
}

module.exports = {
  DRIVER_PROFILES,
  getDriverByWarehouse,
  getDriverById
};
