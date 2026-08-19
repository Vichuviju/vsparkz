const EMAIL_SPLIT_REGEX = /[,\n\r;]+/g;

const toTokenList = (value) => {
  if (value === undefined || value === null || value === "") return [];

  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  return String(value)
    .split(EMAIL_SPLIT_REGEX)
    .map((item) => item.trim())
    .filter(Boolean);
};

export const parseOrganizationEmails = (rawValue) => {
  let values = [];
  let defaultEmail = null;

  if (Array.isArray(rawValue) || typeof rawValue === "string") {
    values = toTokenList(rawValue);
  } else if (rawValue && typeof rawValue === "object") {
    const objectValue = rawValue;
    values = toTokenList(objectValue.values ?? objectValue.emails ?? objectValue.list);
    defaultEmail = String(
      objectValue.defaultEmail ?? objectValue.default ?? objectValue.primaryEmail ?? ""
    ).trim();
  }

  const deduped = [...new Set(values)];
  if (!defaultEmail && deduped.length > 0) {
    defaultEmail = deduped[0];
  }

  if (defaultEmail && deduped.includes(defaultEmail)) {
    const ordered = [defaultEmail, ...deduped.filter((item) => item !== defaultEmail)];
    return { values: ordered, defaultEmail };
  }

  return { values: deduped, defaultEmail: deduped[0] || null };
};

export const buildOrganizationEmailsPayload = (emails, selectedDefaultEmail) => {
  const values = toTokenList(emails);
  const deduped = [...new Set(values)];
  const pickedDefault =
    selectedDefaultEmail && deduped.includes(selectedDefaultEmail)
      ? selectedDefaultEmail
      : deduped[0] || null;

  const orderedValues = pickedDefault
    ? [pickedDefault, ...deduped.filter((item) => item !== pickedDefault)]
    : deduped;

  return {
    defaultEmail: pickedDefault,
    values: orderedValues,
  };
};
