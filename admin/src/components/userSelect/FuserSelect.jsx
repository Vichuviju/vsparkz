import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, X } from "lucide-react";
import { useGetAllUsersListQuery } from "@/services/user/user.api";

// FUserSelect.jsx
export const FUserSelect =({
  value,
  onChange,
  placeholder = "Select user",
}) => {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [open, setOpen] = useState(false);

  const { data, isFetching } = useGetAllUsersListQuery(
    { search, limit: 6 },
    { skip: search.length < 2 }
  );

  const users = data?.data?.users || [];

  const handleSelect = (user) => {
    setSelectedUser(user);
    setOpen(false);
    setSearch("");
    onChange?.(user.id, user); // ✅ only callback
  };

  const handleClear = () => {
    setSelectedUser(null);
    setSearch("");
    onChange?.(null, null);
  };

  return (
    <div className="relative">
      <Input
        value={
          selectedUser
            ? `${selectedUser.firstName} ${selectedUser.lastName}`
            : search
        }
        placeholder={placeholder}
        onChange={(e) => {
          setSearch(e.target.value);
          setSelectedUser(null);
          setOpen(true);
        }}
      />

      {open && !selectedUser && (
        <div className="absolute z-50 w-full bg-white border rounded shadow">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => handleSelect(user)}
              className="block w-full px-3 py-2 text-left hover:bg-muted"
            >
              {user.firstName} {user.lastName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

