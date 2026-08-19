/**
 * Normalizes inventory API payloads (array or { data: [] }) and builds id → productName.
 */
export function getInventoryList(inventoryData) {
  if (Array.isArray(inventoryData)) return inventoryData;
  if (Array.isArray(inventoryData?.data)) return inventoryData.data;
  return [];
}

export function buildInventoryMap(inventoryData) {
  return getInventoryList(inventoryData).reduce((acc, product) => {
    if (product?.id != null) acc[product.id] = product.productName;
    return acc;
  }, {});
}
