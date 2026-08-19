import moment from "moment";

export const formatDateTime = () => {
  return moment().format("DD-MM-YYYY - hh-mmA");
};