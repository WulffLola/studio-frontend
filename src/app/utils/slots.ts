const asNumber = (value: unknown) => {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

export const isSlotFull = (slot: any, activeAppointments?: number) => {
    if (!slot) return true;

    const availability = asNumber(slot.availability);
    const capacity = asNumber(slot.capacity ?? slot.room?.capacity);
    const statusId = asNumber(slot.status_id ?? slot.status?.id);
    const statusName = String(slot.status_name ?? slot.status?.name ?? slot.status ?? "")
        .trim()
        .toLocaleLowerCase("es");

    if (statusId === 2 || statusName.includes("lleno") || statusName.includes("completo")) {
        return true;
    }

    if (availability !== null && availability <= 0) return true;
    if (capacity !== null && capacity <= 0) return true;

    return (
        capacity !== null &&
        activeAppointments !== undefined &&
        activeAppointments >= capacity
    );
};

export const isSlotCapacityError = (message: unknown) =>
    /cupo.*(?:lleno|completo)|(?:lleno|completo).*cupo|sin (?:cupo|disponibilidad)|no hay disponibilidad/i.test(
        String(message ?? "")
    );
