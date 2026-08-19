export const handleBackendErrors = (err, setError, toast) => {
  console.log("FULL ERROR:", err); 
  const apiError = err?.data;

  if (apiError?.code?.includes("VALIDATION")) {
    apiError.errors?.forEach((e) => {
      const fieldName = e.field || e.path?.join(".");

      setError(fieldName, {
        type: "server",
        message: e.message,
      });
    });

    return true;
  }

  toast.error(apiError?.message || "Something went wrong");
  return false;
};