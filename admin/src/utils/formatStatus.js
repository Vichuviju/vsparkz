export const formatPoStatus = (status) => {
  const map = {
    new: "New",
    pending_approval: "Pending Approval",
    approved: "Approved",
    rejected: "Rejected",
    sent: "Sent",
    partial_grn: "Partial GRN",
    closed: "Closed",
  };

  return map[status] || status;
};

export const formatGrnStatus = (status) => {
  const map = {
    new: "New",
    pending_approval: "Pending Approval",
    approved: "Approved",
    rejected: "Rejected",
    closed: "Closed",
  };

  return map[status] || status;
};
