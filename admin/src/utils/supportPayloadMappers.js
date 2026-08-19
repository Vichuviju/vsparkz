import { SERVICE_CENTER_TYPE, SERVICE_TYPE } from "@/schemas/support";

const GRN_TYPE_VALUES = new Set([
  SERVICE_TYPE.WARRANTY,
  SERVICE_TYPE.NON_WARRANTY,
  SERVICE_TYPE.AMC,
  SERVICE_TYPE.CHARGEABLE,
]);

const GRN_SERVICE_CENTER_VALUES = new Set([
  SERVICE_CENTER_TYPE.SCS,
  SERVICE_CENTER_TYPE.OEM,
  SERVICE_CENTER_TYPE.OTHERS,
]);

/** Coerce API ids to strings so Radix Select values match SelectItem `value`. */
const toOptionalIdString = (v) => {
  if (v == null || v === "") return "";
  return String(v).trim();
};

/**
 * Unwrap `{ data: grn }` when the outer object is an API envelope, not the GRN row.
 */
const unwrapGrnDetailBody = (d) => {
  if (!d || typeof d !== "object") return d;
  const inner = d.data;
  if (!inner || typeof inner !== "object") return d;
  const outerIsEnvelope =
    d.id == null &&
    d.organizationId == null &&
    d.companyId == null &&
    (inner.id != null || inner.organizationId != null || Array.isArray(inner.items));
  return outerIsEnvelope ? inner : d;
};

/** Unwrap `{ data: amc }` when the outer object is an API envelope. */
const unwrapAmcDetailBody = (d) => {
  if (!d || typeof d !== "object") return d;
  const inner = d.data;
  if (!inner || typeof inner !== "object") return d;
  const outerIsEnvelope =
    d.id == null &&
    d.organizationId == null &&
    d.companyId == null &&
    d.amcType == null &&
    (inner.id != null ||
      inner.organizationId != null ||
      Array.isArray(inner.items) ||
      inner.amcType != null);
  return outerIsEnvelope ? inner : d;
};

const normalizeGrnTypeForForm = (raw) => {
  if (raw == null || raw === "") return "";
  const s = String(raw)
    .trim()
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/\s+/g, "_");
  if (GRN_TYPE_VALUES.has(s)) return s;
  return "";
};

const normalizeGrnServiceCenterForForm = (raw) => {
  if (raw == null || raw === "") return "";
  const s = String(raw).trim().toLowerCase();
  if (GRN_SERVICE_CENTER_VALUES.has(s)) return s;
  if (s === "other") return SERVICE_CENTER_TYPE.OTHERS;
  return "";
};

const AMC_FORM_TYPE_VALUES = new Set([
  SERVICE_TYPE.COMPREHENSIVE,
  SERVICE_TYPE.NON_COMPREHENSIVE,
  SERVICE_TYPE.PREVENTIVE,
]);

const normalizeAmcTypeForForm = (raw) => {
  if (raw == null || raw === "") return "";
  const s = String(raw)
    .trim()
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/\s+/g, "_");
  if (AMC_FORM_TYPE_VALUES.has(s)) return s;
  return "";
};

const normalizeSerialNumbers = (serialNumbers, serialNumber) => {
  if (Array.isArray(serialNumbers) && serialNumbers.length > 0) {
    return serialNumbers.filter(Boolean);
  }
  if (serialNumber) return [serialNumber];
  return [];
};

const parseSerialNumbersText = (text) => {
  if (!text || typeof text !== "string") return [];
  return text
    .split(/[,\\n\\r]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
};

/** Canonical ticket line source with temporary backward compatibility. */
export const getTicketLines = (ticket) => {
  if (!ticket || typeof ticket !== "object") return [];
  if (Array.isArray(ticket.items) && ticket.items.length > 0) return ticket.items;
  if (Array.isArray(ticket.products) && ticket.products.length > 0) return ticket.products;
  return [];
};

const toCustomProduct = (productId, customProduct) => {
  if (String(productId).toLowerCase() !== "other") return undefined;
  return {
    name: customProduct?.name || "",
    hsn: customProduct?.hsn || "",
    partNo: customProduct?.partNo || "",
  };
};

const buildAmcOrGrnItemLine = (line) => {
  // In AMC/GRN line editors, the source of truth is `serialNumbersText` (tag input).
  // Prefer parsed tags over stale `serialNumbers` arrays hydrated from initial API data.
  const fromText = parseSerialNumbersText(line.serialNumbersText || "");
  const serialNumbers = normalizeSerialNumbers(line.serialNumbers, line.serialNumber);
  const finalSerials = fromText.length > 0 ? fromText : serialNumbers;
  const productId = line.productId;
  const quantity = Number(line.quantity || finalSerials.length || 1);
  const customProduct = toCustomProduct(productId, {
    name: line.newProductName,
    hsn: line.newProductHsn,
    partNo: line.newProductPartNo,
  });
  return {
    ...(line.id ? { id: line.id } : {}),
    productId,
    quantity,
    serialNumbers: finalSerials,
    assignedTo: line.assignedTo || undefined,
    status: line.status || undefined,
    dueDate: line.dueDate || undefined,
    statusChangeReason: line.statusChangeReason || undefined,
    assignmentReason: line.assignmentReason || undefined,
    rescheduleReason: line.rescheduleReason || undefined,
    updateReason: line.updateReason || undefined,
    ...(customProduct ? { customProduct } : {}),
  };
};

export const mapAmcFormToRequest = (raw) => {
  const { attachmentFiles: _omitFiles, ...data } = raw || {};

  if (Array.isArray(data.items) && data.items.length > 0) {
    const items = data.items.map(buildAmcOrGrnItemLine);
    const first = items[0];
    return {
      companyId: data.companyId,
      departmentId: data.departmentId,
      contactId: data.contactId,
      type: data.type,
      fromDate: data.fromDate,
      toDate: data.toDate,
      description: data.description,
      items,
      productId: first?.productId,
      serialNumber: first?.serialNumbers?.[0] || "",
      quantity: first?.quantity,
      ...(first?.customProduct ? { customProduct: first.customProduct } : {}),
    };
  }

  const serialNumbers = normalizeSerialNumbers(data.serialNumbers, data.serialNumber);
  const quantity = Number(data.quantity || serialNumbers.length || 1);
  const productId = data.productId;
  const customProduct = toCustomProduct(productId, {
    name: data.newProductName,
    hsn: data.newProductHsn,
    partNo: data.newProductPartNo,
  });

  return {
    companyId: data.companyId,
    departmentId: data.departmentId,
    contactId: data.contactId,
    type: data.type,
    fromDate: data.fromDate,
    toDate: data.toDate,
    description: data.description,
    items: [
      {
        productId,
        quantity,
        serialNumbers,
        ...(customProduct ? { customProduct } : {}),
      },
    ],
    productId,
    serialNumber: serialNumbers[0] || "",
    quantity,
    ...(customProduct ? { customProduct } : {}),
  };
};

/** Default shape for one GRN line in create/edit forms (matches GrnLineItemsEditor). */
export const emptyGrnFormLine = () => ({
  productId: "",
  serialNumber: "",
  serialNumbers: [],
  serialNumbersText: "",
  newProductName: "",
  newProductHsn: "",
  newProductPartNo: "",
});

/**
 * Map one API item line (GRN/AMC shared contract) to line-editor form shape.
 * @param {Record<string, unknown>} item
 */
export const mapSupportApiItemToFormLine = (item) => {
  const serials =
    Array.isArray(item?.serialNumbers) && item.serialNumbers.length > 0
      ? item.serialNumbers.map((x) => String(x).trim()).filter(Boolean)
      : item?.serialNumber
        ? [String(item.serialNumber).trim()].filter(Boolean)
        : [];
  const cp = item?.customProduct || item?.customProductDetails;
  let productId = item?.productId != null ? String(item.productId) : "";
  if (cp && String(productId).toLowerCase() !== "other") {
    productId = "Other";
  }
  if (String(productId).toLowerCase() === "other") {
    productId = "Other";
  }
  return {
    productId,
    serialNumber: serials[0] || "",
    serialNumbers: serials,
    serialNumbersText: serials.join(", "),
    newProductName: cp?.name || "",
    newProductHsn: cp?.hsn || "",
    newProductPartNo: cp?.partNo || cp?.partNumber || "",
  };
};

/**
 * Map GET /service/grn/:id `data` into react-hook-form values for CreateGrnPage-shaped UIs.
 * @param {Record<string, unknown>} d API detail body
 */
export const mapGrnApiDetailToFormValues = (d) => {
  if (!d || typeof d !== "object") return null;
  d = unwrapGrnDetailBody(d);

  const formatDueDate = (v) => {
    if (v == null || v === "") return "";
    const s = String(v);
    if (s.length >= 10 && s[4] === "-") return s.slice(0, 10);
    return s;
  };

  let items = [];
  if (Array.isArray(d.items) && d.items.length > 0) {
    items = d.items.map(mapSupportApiItemToFormLine);
  } else {
    items = [
      mapSupportApiItemToFormLine({
        productId: d.productId,
        serialNumber: d.serialNumber,
        serialNumbers: d.serialNumbers,
        quantity: d.quantity,
        customProduct: d.customProduct || d.customProductDetails,
      }),
    ];
  }

  const usable = items.filter((line) => line.productId || line.serialNumbersText);
  const finalItems = usable.length > 0 ? usable : [emptyGrnFormLine()];

  const companyId = toOptionalIdString(
    d.organizationId ?? d.companyId ?? d.orgId ?? d.organization_id ?? d.company_id
  );
  const departmentId = toOptionalIdString(
    d.departmentId ?? d.department_id
  );
  const contactId = toOptionalIdString(d.contactId ?? d.contact_id);

  return {
    companyId,
    departmentId,
    contactId,
    type: normalizeGrnTypeForForm(d.type),
    serviceCenter: normalizeGrnServiceCenterForForm(d.serviceCenter ?? d.service_center),
    cost: d.cost != null && d.cost !== "" ? Number(d.cost) : 0,
    description: d.description || "",
    dueDate: formatDueDate(d.dueDate),
    ticketId: d.ticketId != null && d.ticketId !== "" ? String(d.ticketId).trim() : "",
    items: finalItems,
    attachmentFiles: [],
  };
};

/**
 * Map GET /service/amc/:id body into react-hook-form values (CreateAmcPage / EditAmcPage shape).
 * @param {Record<string, unknown>} d API detail body (may be wrapped in `{ data }`)
 */
export const mapAmcApiDetailToFormValues = (d) => {
  if (!d || typeof d !== "object") return null;
  d = unwrapAmcDetailBody(d);

  const formatAmcDate = (v) => {
    if (v == null || v === "") return "";
    const s = String(v);
    if (s.length >= 10 && s[4] === "-") return s.slice(0, 10);
    return s;
  };

  let items = [];
  if (Array.isArray(d.items) && d.items.length > 0) {
    items = d.items.map(mapSupportApiItemToFormLine);
  } else {
    items = [
      mapSupportApiItemToFormLine({
        productId: d.productId,
        serialNumber: d.serialNumber,
        serialNumbers: d.serialNumbers,
        quantity: d.quantity,
        customProduct: d.customProduct || d.customProductDetails,
      }),
    ];
  }

  const usable = items.filter((line) => line.productId || line.serialNumbersText);
  const finalItems = usable.length > 0 ? usable : [emptyGrnFormLine()];

  return {
    companyId: toOptionalIdString(
      d.organizationId ?? d.companyId ?? d.orgId ?? d.organization_id ?? d.company_id
    ),
    departmentId: toOptionalIdString(d.departmentId ?? d.department_id),
    contactId: toOptionalIdString(d.contactId ?? d.contact_id),
    type: normalizeAmcTypeForForm(d.amcType ?? d.type),
    fromDate: formatAmcDate(d.amcStartDate ?? d.fromDate),
    toDate: formatAmcDate(d.amcEndDate ?? d.toDate),
    description: d.description || "",
    items: finalItems,
    attachmentFiles: [],
  };
};

export const mapGrnFormToRequest = (raw) => {
  const { attachmentFiles: _omitFiles, ...data } = raw || {};

  if (Array.isArray(data.items) && data.items.length > 0) {
    const items = data.items.map(buildAmcOrGrnItemLine);
    const first = items[0];
    return {
      organizationId: data.companyId,
      departmentId: data.departmentId,
      contactId: data.contactId,
      type: data.type,
      serviceCenter: data.serviceCenter,
      description: data.description,
      cost: data.cost,
      dueDate: data.dueDate,
      status: data.status,
      ticketId: data.ticketId,
      items,
      productId: first?.productId,
      serialNumber: first?.serialNumbers?.[0] || "",
      quantity: first?.quantity,
      ...(first?.customProduct ? { customProduct: first.customProduct } : {}),
    };
  }

  const serialNumbers = normalizeSerialNumbers(data.serialNumbers, data.serialNumber);
  const quantity = Number(data.quantity || serialNumbers.length || 1);
  const productId = data.productId;
  const customProduct = toCustomProduct(productId, {
    name: data.newProductName,
    hsn: data.newProductHsn,
    partNo: data.newProductPartNo,
  });

  return {
    organizationId: data.companyId,
    departmentId: data.departmentId,
    contactId: data.contactId,
    type: data.type,
    serviceCenter: data.serviceCenter,
    description: data.description,
    cost: data.cost,
    dueDate: data.dueDate,
    status: data.status,
    ticketId: data.ticketId,
    items: [
      {
        productId,
        quantity,
        serialNumbers,
        ...(customProduct ? { customProduct } : {}),
      },
    ],
    productId,
    serialNumber: serialNumbers[0] || "",
    quantity,
    ...(customProduct ? { customProduct } : {}),
  };
};

export const mapTicketFormToRequest = (data, ticketType = "support") => {
  const buildLine = (line) => {
    const productId = line.productId;
    const serialNumbers = normalizeSerialNumbers(
      line.serialNumbers,
      line.serialNumber || (typeof line.serialNumbersText === "string" ? parseSerialNumbersText(line.serialNumbersText)[0] : undefined)
    );

    const derivedSerialNumbers =
      Array.isArray(line.serialNumbers) && line.serialNumbers.length > 0
        ? line.serialNumbers.filter(Boolean)
        : parseSerialNumbersText(line.serialNumbersText);

    const finalSerialNumbers = derivedSerialNumbers.length > 0 ? derivedSerialNumbers : serialNumbers;

    const customProduct = toCustomProduct(productId, {
      name: line.newProductName,
      partNo: line.newProductPartNumber,
      hsn: line.newProductHsn,
    });

    return {
      productId,
      quantity: Number(line.quantity || finalSerialNumbers.length || 1),
      serialNumbers: finalSerialNumbers,
      // keep legacy `serialNumber` for older screens / routes
      serialNumber: finalSerialNumbers[0] || "",
      assignedTo: line.assignedTo || undefined,
      status: line.status || undefined,
      dueDate: line.dueDate || undefined,
      ...(customProduct ? { customProduct } : {}),
    };
  };

  const hasMultiProducts = Array.isArray(data.products) && data.products.length > 0;
  const productsLines = hasMultiProducts ? data.products.map(buildLine) : [];

  const legacySerialNumbers = normalizeSerialNumbers(
    data.serialNumbers,
    data.productSerialNumber || data.serialNumber
  );
  const legacyProductId = data.productId;
  const legacyCustomProduct = toCustomProduct(legacyProductId, {
    name: data.newProductName,
    partNo: data.newProductPartNumber,
    hsn: data.newProductHsn,
  });

  const legacyProductLine = {
    productId: legacyProductId,
    quantity: Number(data.quantity || legacySerialNumbers.length || 1),
    serialNumbers: legacySerialNumbers,
    serialNumber: legacySerialNumbers[0] || "",
    assignedTo: data.assignedTo || undefined,
    status: data.lineStatus || undefined,
    dueDate: data.preferredDate || data.dueDate || undefined,
    ...(legacyCustomProduct ? { customProduct: legacyCustomProduct } : {}),
  };

  const items = hasMultiProducts ? productsLines : [legacyProductLine];

  const payload = {
    title: data.title,
    description: data.issueDescription || data.description,
    organizationId: data.companyId,
    departmentId: data.departmentId,
    contactId: data.contactId,
    ticketType,
    priority: data.priority || "low",
    status: data.status,
    typeOfCall: data.typeOfCall,
    dueDate: data.preferredDate || data.dueDate,
    assignedTo: data.assignedTo,
    // Canonical contract for updated tickets module.
    items,
    // Compatibility alias during migration window.
    products: items,
  };

  if (ticketType === "installation") {
    payload.metadata = {
      installationLocation: data.installationLocation,
    };
  } else {
    payload.cost = Number(data.cost || 0);
  }

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== "")
  );
};

/**
 * `PUT /service/tickets/:id` body for status/close flows.
 *
 * **Direct close** (`closureReasonType: "Closed"`):
 * ```json
 * {
 *   "id": "<ticketId>",
 *   "status": "closed",
 *   "closureReasonType": "Closed",
 *   "closureRemark": "<string>"
 * }
 * ```
 *
 * **Close by GRN** (`closureReasonType: "ClosedByGRN"`):
 * GRN-related fields are nested under `grn` (not at the root).
 * ```json
 * {
 *   "id": "<ticketId>",
 *   "status": "closed",
 *   "closureReasonType": "ClosedByGRN",
 *   "closureRemark": "<string>",
 *   "grn": {
 *     "grnProductIds": ["<productId>", "Other"],
 *     "grnTypeOfCall": "onsite | warranty | amc | chargeable",
 *     "cost": 0,
 *     "serviceCenter": "scs | oem | others"
 *   }
 * }
 * ```
 * Optional root passthroughs when present: `linkedGrnId`, `linkedRmaId`, assign/reschedule fields.
 */
export const mapTicketCloseToRequest = (data) => {
  const payload = {
    id: data.id,
    status: data.status,
    assignedTo: data.assignedTo,
    dueDate: data.dueDate,
    statusChangeReason: data.statusChangeReason,
    assignmentReason: data.assignmentReason,
    rescheduleReason: data.rescheduleReason,
  };

  if (String(data.status).toLowerCase() === "closed") {
    payload.closureReasonType = data.closureReasonType;
    payload.closureRemark = data.closureRemark;

    if (data.closureReasonType === "ClosedByGRN") {
      const grnProductIds = Array.isArray(data.grnProductIds)
        ? data.grnProductIds.map(String).filter(Boolean)
        : [];
      const grn = {};
      if (grnProductIds.length > 0) grn.grnProductIds = grnProductIds;
      if (data.grnTypeOfCall) grn.grnTypeOfCall = data.grnTypeOfCall;
      if (data.cost != null && data.cost !== "") {
        grn.cost = Number(data.cost);
      }
      if (data.serviceCenter) grn.serviceCenter = data.serviceCenter;
      if (Object.keys(grn).length > 0) {
        payload.grn = grn;
      }
    }

    if (data.linkedGrnId) payload.linkedGrnId = data.linkedGrnId;
    if (data.linkedRmaId) payload.linkedRmaId = data.linkedRmaId;
  }

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== "")
  );
};

/** Map API ticket lines (`items[]` preferred, `products[]` fallback) into form lines. */
export const ticketProductsToFormLines = (lines = []) => {
  if (!Array.isArray(lines) || lines.length === 0) {
    return [
      {
        productId: "",
        serialNumbersText: "",
        newProductName: "",
        newProductPartNumber: "",
        newProductHsn: "",
        assignedTo: "",
        status: "open",
        dueDate: "",
      },
    ];
  }

  return lines.map((p) => {
    const serials =
      Array.isArray(p.serialNumbers) && p.serialNumbers.length > 0
        ? p.serialNumbers.map(String)
        : p.serialNumber
          ? [String(p.serialNumber)]
          : [];

    let productId = p.productId || "";
    if (!productId && String(p.type || "").toLowerCase() === "other") {
      productId = "Other";
    }
    if (String(productId).toLowerCase() === "other") {
      productId = "Other";
    }

    const cp = p.customProduct || {};

    return {
      productId,
      serialNumbersText: serials.join(", "),
      newProductName: cp.name || (String(productId).toLowerCase() === "other" ? p.name || "" : ""),
      newProductPartNumber: cp.partNo || p.partNumber || "",
      newProductHsn: cp.hsn || p.hsn || "",
      assignedTo: p.assignedTo || "",
      status: p.status || "open",
      dueDate: p.dueDate || "",
    };
  });
};

/** Distinct productId values on a ticket for close-by-GRN selection (canonical "Other"). */
export const getDistinctGrnProductOptions = (products = []) => {
  const out = [];
  const seen = new Set();
  for (const line of products || []) {
    let pid = line?.productId;
    if (!pid && String(line?.type || "").toLowerCase() === "other") {
      pid = "Other";
    }
    if (!pid) continue;
    const canonical = String(pid).toLowerCase() === "other" ? "Other" : pid;
    if (seen.has(canonical)) continue;
    seen.add(canonical);
    out.push({ productId: canonical, line });
  }
  return out;
};

export const getProductDisplayName = (line = {}, fallbackName = "-") => {
  if (line.productId && String(line.productId).toLowerCase() === "other") {
    return (
      line.customProduct?.name ||
      line.customProductDetails?.name ||
      fallbackName
    );
  }
  return line.name || line.productName || fallbackName;
};

/** Labels for GRN list “Products” column: one per line item, else legacy single-product row. */
export const getGrnProductDisplayNames = (row) => {
  if (!row || typeof row !== "object") return [];
  if (Array.isArray(row.items) && row.items.length > 0) {
    return row.items
      .map((it) => {
        const label = getProductDisplayName(it, "").trim();
        return label || null;
      })
      .filter(Boolean);
  }
  const label = getProductDisplayName(
    {
      productId: row.productId,
      customProduct: row.customProductDetails,
      customProductDetails: row.customProductDetails,
      name: row.productName,
      productName: row.productName,
    },
    ""
  ).trim();
  return label ? [label] : [];
};

/** Total units for GRN list Quantity column: sum of line `quantity`, else serial count per line, else 1 per line; legacy row without `items` => 1. */
export const getGrnTotalQuantity = (row) => {
  if (!row || typeof row !== "object") return "—";
  const items = row.items;
  if (!Array.isArray(items) || items.length === 0) return 1;
  return items.reduce((sum, it) => {
    const q = Number(it?.quantity);
    if (Number.isFinite(q) && q >= 0) return sum + q;
    const n = Array.isArray(it?.serialNumbers) ? it.serialNumbers.length : 0;
    return sum + (n > 0 ? n : 1);
  }, 0);
};

/** Serial values for GRN list column: all `items[].serialNumbers` in order, else legacy `serialNumber`. */
export const getGrnSerialDisplayValues = (row) => {
  if (!row || typeof row !== "object") return [];
  const items = row.items;
  if (Array.isArray(items) && items.length > 0) {
    const out = [];
    for (const it of items) {
      const sns = it?.serialNumbers;
      if (!Array.isArray(sns)) continue;
      for (const s of sns) {
        const t = String(s ?? "").trim();
        if (t) out.push(t);
      }
    }
    if (out.length > 0) return out;
  }
  const legacy = row.serialNumber != null ? String(row.serialNumber).trim() : "";
  return legacy ? [legacy] : [];
};

/** RMA list rows use the same `items[]` and header product fields as GRN list rows. */
export const getRmaProductDisplayNames = getGrnProductDisplayNames;
export const getRmaTotalQuantity = getGrnTotalQuantity;
export const getRmaSerialDisplayValues = getGrnSerialDisplayValues;

const unwrapRmaDetailBody = (d) => {
  if (!d || typeof d !== "object") return d;
  const inner = d.data;
  if (!inner || typeof inner !== "object") return d;
  const outerIsEnvelope =
    d.id == null && (inner.id != null || Array.isArray(inner.items));
  return outerIsEnvelope ? inner : d;
};

const formatRmaDueDateForForm = (v) => {
  if (v == null || v === "") return "";
  const s = String(v);
  if (s.length >= 10 && s[4] === "-") return s.slice(0, 10);
  return s;
};

const normalizeRmaLineStatusForForm = (v) => {
  const raw = String(v ?? "").trim().toLowerCase();
  if (!raw) return "open";
  return raw === "in-transit" ? "in_transit" : raw;
};

const normalizeRmaLineStatusForApi = (v) => {
  const raw = String(v ?? "").trim().toLowerCase();
  if (!raw) return "open";
  return raw === "in_transit" ? "in-transit" : raw;
};

const normalizeRmaHeaderStatusForForm = (v) => {
  const raw = String(v ?? "").trim().toLowerCase();
  if (raw === "open" || raw === "partially_closed" || raw === "closed") return raw;
  return "open";
};

/**
 * Map GET /service/rma/:id body into react-hook-form values for {@link RMAEditSchema}.
 */
export const mapRmaApiDetailToFormValues = (d) => {
  if (!d || typeof d !== "object") return null;
  d = unwrapRmaDetailBody(d);

  const items = Array.isArray(d.items) ? d.items : [];
  const lineItems = items
    .filter((row) => row?.id != null && String(row.id).trim() !== "")
    .map((row) => {
      const serials =
        Array.isArray(row.serialNumbers) && row.serialNumbers.length > 0
          ? row.serialNumbers.map((x) => String(x).trim()).filter(Boolean)
          : [];
      const serialsPreview = serials.length ? serials.join(", ") : "—";
      const remarksRaw = row.remarks ?? row.updateReason ?? "";
      return {
        id: String(row.id),
        rmaNo: row.rmaNo != null && String(row.rmaNo).trim() ? String(row.rmaNo).trim() : "",
        dueDate: formatRmaDueDateForForm(row.dueDate ?? d.dueDate),
        status: normalizeRmaLineStatusForForm(row.status),
        remarks: typeof remarksRaw === "string" ? remarksRaw : String(remarksRaw || ""),
        productLabel: getProductDisplayName(row, row.productId || "—"),
        quantity: row.quantity ?? "—",
        serialsPreview,
      };
    });

  return {
    description: d.description || "",
    ticketId: d.ticketId != null && d.ticketId !== "" ? String(d.ticketId).trim() : "",
    grnId: d.grnId != null ? String(d.grnId) : "",
    grnNo: d.grnNo != null ? String(d.grnNo) : "",
    organizationName: d.organizationName || "",
    departmentName: d.departmentName || "",
    contactName: d.contactName || "",
    lineItems,
    headerStatus: normalizeRmaHeaderStatusForForm(d.status),
    attachmentFiles: [],
  };
};

/**
 * Build PUT /service/rma/:id JSON body (no `id`).
 * `initialSnapshot`: `{ lineItems: [{ id, rmaNo, dueDate, status, remarks }] }` from hydrate.
 * Sends line-centric `itemUpdates[]` with changed fields only.
 */
export const mapRmaEditFormToPutBody = (form, initialSnapshot = {}) => {
  const body = {};

  body.description = form.description != null ? String(form.description) : "";

  const snap =
    initialSnapshot && typeof initialSnapshot === "object" && !Array.isArray(initialSnapshot)
      ? initialSnapshot
      : {};
  const initLines = Array.isArray(snap.lineItems) ? snap.lineItems : [];
  const lines = Array.isArray(form.lineItems) ? form.lineItems : [];
  const itemUpdates = [];
  for (const line of lines) {
    const lid = line?.id != null ? String(line.id) : "";
    if (!lid) continue;
    const orig = initLines.find((x) => String(x.id) === lid);
    if (!orig) continue;

    const patch = { id: lid };
    const curRmaNo = String(line.rmaNo ?? "").trim();
    const origRmaNo = String(orig.rmaNo ?? "").trim();
    if (curRmaNo && curRmaNo !== origRmaNo) patch.rmaNo = curRmaNo;

    const curDueDate = String(line.dueDate ?? "").trim();
    const origDueDate = String(orig.dueDate ?? "").trim();
    if (curDueDate && curDueDate !== origDueDate) patch.dueDate = curDueDate;

    const curStatus = normalizeRmaLineStatusForApi(line.status);
    const origStatus = normalizeRmaLineStatusForApi(orig.status);
    if (curStatus !== origStatus) patch.status = curStatus;

    const curRemarks = String(line.remarks ?? "").trim();
    const origRemarks = String(orig.remarks ?? "").trim();
    if (curRemarks !== origRemarks) patch.remarks = curRemarks;

    if (Object.keys(patch).length > 1) itemUpdates.push(patch);
  }
  if (itemUpdates.length > 0) body.itemUpdates = itemUpdates;

  return body;
};

/**
 * Merge staged upload document ids into a RMA PUT body (itemUpdates + commonDocuments).
 * `itemDocumentIdsByRowKey`: rowKey → doc ids from POST .../upload before PUT.
 * `lines`: UI rows with `rowKey` and `id` (RMA line id).
 */
export function mergeRmaDocumentPayloadIntoPutBody(
  putBody,
  { itemDocumentIdsByRowKey = {}, commonDocuments = [], lines = [] }
) {
  const lineByRowKey = Object.fromEntries((lines || []).map((l) => [l.rowKey, l]));
  const patches = new Map();

  const baseUpdates = Array.isArray(putBody?.itemUpdates) ? putBody.itemUpdates : [];
  for (const u of baseUpdates) {
    if (u?.id != null && String(u.id).trim() !== "") {
      patches.set(String(u.id).trim(), { ...u });
    }
  }

  for (const [rowKey, docIds] of Object.entries(itemDocumentIdsByRowKey || {})) {
    const line = lineByRowKey[rowKey];
    const lid = line?.id != null ? String(line.id).trim() : "";
    if (!lid || !Array.isArray(docIds) || docIds.length === 0) continue;
    const cur = patches.get(lid) || { id: lid };
    const merged = Array.from(
      new Set([...(Array.isArray(cur.documentIds) ? cur.documentIds : []).map(String), ...docIds.map(String)])
    );
    cur.documentIds = merged;
    patches.set(lid, cur);
  }

  const next = { ...putBody };
  if (patches.size > 0) {
    next.itemUpdates = Array.from(patches.values());
  } else if (!next.itemUpdates?.length) {
    delete next.itemUpdates;
  }

  if (Array.isArray(commonDocuments) && commonDocuments.length > 0) {
    next.commonDocuments = commonDocuments;
  } else {
    delete next.commonDocuments;
  }

  return next;
}

