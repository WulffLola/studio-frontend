export const isSelectableStudio = (studio: any) => {
  const isReady = studio?.is_ready === true;
  const isNotDeleted =
    studio?.deleted === null ||
    studio?.deleted === undefined ||
    studio?.deleted === "";

  return isReady && isNotDeleted;
};
