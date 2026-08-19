import { useEffect, useState } from "react";
import Select from "react-select";
import { useLazyGetUsersDropdownQuery } from "@/services/user/user.api";

export const UserSearchSelect = ({
  value,
  onChange,
  placeholder = "Select reporting manager",
}) => {
  const [trigger, { data = [], isFetching }] =
    useLazyGetUsersDropdownQuery();

  const [options, setOptions] = useState([]);

  // fetch when typing
  const handleInputChange = (inputValue) => {
    if (inputValue?.length > 1) {
      trigger(inputValue);
    }
  };

  useEffect(() => {
    if (Array.isArray(data) && data.length > 0) {
      setOptions(data.data || data); // handle API format
    }
  }, [data]);

  return (
    <Select
      options={options}
      isLoading={isFetching}
      onInputChange={handleInputChange}
      value={options.find((u) => u.id === value) || null}
      getOptionLabel={(o) =>
        `${o.first_name || o.firstName || ""} ${o.last_name || o.lastName || ""}`.trim()
      }
      getOptionValue={(o) => o.id}
      onChange={(opt) => onChange(opt ? opt.id : null)}
      isClearable
      placeholder={placeholder}
    />
  );
}
