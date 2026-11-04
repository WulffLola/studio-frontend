export const isSelectableStudio = (studio: any) => {
  const isReady = studio?.is_ready === true;
  const isActive = studio?.is_active === true;
  const isNotDeleted =
    studio?.deleted === null ||
    studio?.deleted === undefined ||
    studio?.deleted === "";

  return isReady && isActive && isNotDeleted;
};

// Deja afuera los registros dados de baja (soft delete). Si se pasa keepId,
// se conserva ese registro aunque esté borrado (para no perder el valor actual al editar).
export const alive = <T extends { id?: any; deleted?: any }>(list: T[] | null | undefined, keepId?: any): T[] =>
  (Array.isArray(list) ? list : []).filter(
    (item) => !item?.deleted || (keepId !== undefined && keepId !== null && String(item.id) === String(keepId)),
  );
