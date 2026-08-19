const isPlainObject = value => value && typeof value === 'object' && !Array.isArray(value);

const callTypeToPayloadType = value => {
  if (!value) return 'chargeable';
  if (value === 'warranty') return 'warranty';
  if (value === 'amc') return 'amc';
  return 'chargeable';
};

const getSelection = (selections, serialNumber, fallbackSerialInfo) => {
  const current = selections?.[serialNumber];
  const fallbackDepartment = fallbackSerialInfo?.department?.selectedId || '';
  const fallbackContact = fallbackSerialInfo?.contact?.selectedId || '';

  return {
    departmentId: current?.departmentId ?? fallbackDepartment,
    contactId: current?.contactId ?? fallbackContact,
  };
};

const getProductAggregationKey = line => {
  const productId = String(line?.productId || '').trim();
  if (productId) return `product::${productId}`;
  return `custom::${String(line?.productName || '').trim()}::${String(line?.hsn || '').trim()}::${String(line?.partNo || '').trim()}`;
};

const productToTicketItem = line => {
  const productId = line?.productId || '';
  const item = {
    productId: productId || 'other',
    quantity: 0,
    serialNumbers: [],
    status: 'open',
  };

  if (!productId) {
    item.customProduct = {
      name: line?.productName || 'Unknown Product',
      hsn: line?.hsn || '',
      partNo: line?.partNo || '',
    };
  }

  return item;
};

export const buildSplitTicketPayloadsV2 = ({
  lookupData,
  selections = {},
  commonFields = {},
  ticketType = 'support',
} = {}) => {
  const validSerials = lookupData?.validSerials || [];
  if (!Array.isArray(validSerials) || validSerials.length === 0) return [];

  const grouped = new Map();

  validSerials.forEach(serialInfo => {
    const serialNumber = serialInfo?.serialNumber || '';
    const organizationId = serialInfo?.organization?.id || '';
    if (!organizationId) return;

    const selected = getSelection(selections, serialNumber, serialInfo);

    (serialInfo?.productLines || []).forEach(line => {
      const callType = callTypeToPayloadType(line?.callType);
      const key = `${organizationId}::${callType}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          organizationId,
          departmentId: selected.departmentId || '',
          contactId: selected.contactId || '',
          callType,
          items: [],
          descriptionParts: [],
        });
      }

      const bucket = grouped.get(key);
      if (!bucket.departmentId && selected.departmentId) bucket.departmentId = selected.departmentId;
      if (!bucket.contactId && selected.contactId) bucket.contactId = selected.contactId;

      const productKey = getProductAggregationKey(line);
      let item = bucket.items.find(entry => entry._groupKey === productKey);
      if (!item) {
        item = {
          ...productToTicketItem(line),
          _groupKey: productKey,
        };
        bucket.items.push(item);
      }

      const serialNumberValue = String(line?.serialNumber || serialNumber || '').trim();
      if (serialNumberValue && !item.serialNumbers.includes(serialNumberValue)) {
        item.serialNumbers.push(serialNumberValue);
      }
      item.quantity = item.serialNumbers.length || 1;
    });
  });

  return Array.from(grouped.values())
    .filter(group => group.organizationId && group.items.length > 0)
    .map(group => {
      const payload = {
        organizationId: group.organizationId,
        departmentId: group.departmentId || undefined,
        contactId: group.contactId || undefined,
        ticketType,
        priority: commonFields.priority || 'medium',
        typeOfCall: group.callType,
        description:
          commonFields.description ||
          `Support ticket created via Auto-fetch: ${group.items
            .map(item => {
              const name = item.customProduct?.name || 'Product';
              const serials = Array.isArray(item.serialNumbers) ? item.serialNumbers.filter(Boolean) : [];
              if (serials.length === 0) return name;
              return `${name} (${serials.join(', ')})`;
            })
            .join(', ')}`.slice(0, 1000),
        items: group.items.map(({ _groupKey, ...item }) => item),
      };

      if (isPlainObject(commonFields.metadata)) {
        payload.metadata = commonFields.metadata;
      }
      if (commonFields.assignedTo) payload.assignedTo = commonFields.assignedTo;
      if (commonFields.dueDate) payload.dueDate = commonFields.dueDate;

      return payload;
    });
};
