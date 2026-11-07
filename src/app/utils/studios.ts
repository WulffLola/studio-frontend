export const isSelectableStudio = (studio: any) => {
  const isReady = studio?.is_ready === true;
  const isActive = studio?.is_active === true;
  const isNotDeleted =
    studio?.deleted === null ||
    studio?.deleted === undefined ||
    studio?.deleted === "";

  return isReady && isActive && isNotDeleted;
};
