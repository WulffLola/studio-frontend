"use client";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { useAuthStore } from "./auth";

// Helper headers
const getHeaders = () => {
  const { tokens } = useAuthStore.getState();
  return {
    Authorization: `Bearer ${tokens?.access ?? ""}`,
    "Content-Type": "application/json",
  };
};

// Helper: el backend devuelve "studio": <id numérico>
const studioIdOf = (r: any): string | null => {
  const cand = r?.studio;
  const n = Number(cand);
  return Number.isFinite(n) ? String(n) : null;
};

// ===================== THUNKS =====================

// 1. appointments
export const getAppointments = createAsyncThunk(
  "studio/getAppointments",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_APPOINTMENTS}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

export const getActions = createAsyncThunk("studio/getActions", async () => {
  const res = await axios.get(
    `${process.env.NEXT_PUBLIC_URL_BACKEND_ACTIONS}`,
    { headers: getHeaders() },
  );
  return res.data;
});

// 2. available-slots
export const getAvailableSlots = createAsyncThunk(
  "studio/getAvailableSlots",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_AVAILABLE_SLOTS}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

// 3. average-age
export const getAverageAge = createAsyncThunk(
  "studio/getAverageAge",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_AVERAGE_AGE}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

// 4. average-age-by-hour
export const getAverageAgeByHour = createAsyncThunk(
  "studio/getAverageAgeByHour",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_AVERAGE_AGE_BY_HOUR}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

// 5. cancellation-rate
export const getCancellationRate = createAsyncThunk(
  "studio/getCancellationRate",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_CANCELLATION_RATE}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

// 6. cash_journal
export const getCashJournal = createAsyncThunk(
  "studio/getCashJournal",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_CASH_JOURNAL}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

// 7. cash_journal_today
export const getCashJournalToday = createAsyncThunk(
  "studio/getCashJournalToday",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_CASH_JOURNAL_TODAY}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

// 8. clients-by-month
export const getClientsByMonth = createAsyncThunk(
  "studio/getClientsByMonth",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_CLIENTS_BY_MONTH}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

// 9. clients-by-plan
export const getClientsByPlan = createAsyncThunk(
  "studio/getClientsByPlan",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_CLIENTS_BY_PLAN}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

// 10. deleted-people
export const getDeletedPeople = createAsyncThunk(
  "studio/getDeletedPeople",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_DELETED_PEOPLE}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

// 11. expense-type
export const getExpenseType = createAsyncThunk(
  "studio/getExpenseType",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_EXPENSES_TYPE}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

// 12. expenses
export const getExpenses = createAsyncThunk("studio/getExpenses", async () => {
  const res = await axios.get(
    `${process.env.NEXT_PUBLIC_URL_BACKEND_EXPENSES}`,
    { headers: getHeaders() },
  );
  return res.data;
});

// 13. expenses_by_range
export const getExpensesByRange = createAsyncThunk(
  "studio/getExpensesByRange",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_EXPENSES_BY_RANGE}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

// 14. expenses_today_teachers
export const getExpensesTodayTeachers = createAsyncThunk(
  "studio/getExpensesTodayTeachers",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_TOTAL_EXPENSES_TODAY_TEACHERS}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

// 15. extra-hours
export const getExtraHours = createAsyncThunk(
  "studio/getExtraHours",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_EXTRA_HOURS}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

// 16. generate-slots
export const getGenerateSlots = createAsyncThunk(
  "studio/getGenerateSlots",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_GENERATE_SLOTS}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

// 17. hour_view
export const getHolidays = createAsyncThunk("studio/getHolidays", async () => {
  const res = await axios.get(
    `${process.env.NEXT_PUBLIC_URL_BACKEND_HOLIDAYS}`,
    { headers: getHeaders() },
  );
  return res.data;
});

// 17. hour_view
export const getHourView = createAsyncThunk("studio/getHourView", async () => {
  const res = await axios.get(
    `${process.env.NEXT_PUBLIC_URL_BACKEND_HOUR_VIEW}`,
    { headers: getHeaders() },
  );
  return res.data;
});

// 18. login
export const getLogin = createAsyncThunk("studio/getLogin", async () => {
  const res = await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_LOGIN}`, {
    headers: getHeaders(),
  });
  return res.data;
});

// 19. margen-bruto
export const getMargenBruto = createAsyncThunk(
  "studio/getMargenBruto",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_MARGEN_BRUTO}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

// 20. margen-neto
export const getMargenNeto = createAsyncThunk(
  "studio/getMargenNeto",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_MARGEN_NETO}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

// 21. most-profitable-plan
export const getMostProfitablePlan = createAsyncThunk(
  "studio/getMostProfitablePlan",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_MOST_PROFITABLE_PLAN}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

// 22. payment-amount
export const getPaymentAmount = createAsyncThunk(
  "studio/getPaymentAmount",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_PAYMENT_AMOUNT}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

// 23. payment-status-current-month
export const getPaymentsStatusCurrentMonth = createAsyncThunk(
  "studio/getPaymentsStatusCurrentMonth",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_PAYMENTS_STATUS_CURRENT_MONTH}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

// 24. payments
export const getPayments = createAsyncThunk("studio/getPayments", async () => {
  const res = await axios.get(
    `${process.env.NEXT_PUBLIC_URL_BACKEND_PAYMENTS}`,
    { headers: getHeaders() },
  );
  return res.data;
});

// 25. payments-by-day-range
export const getPaymentsByDayRange = createAsyncThunk(
  "studio/getPaymentsByDayRange",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_PAYMENTS_BY_DAY_RANGE}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

// 26. payments-last-month
export const getPaymentsLastMonth = createAsyncThunk(
  "studio/getPaymentsLastMonth",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_PAYMENTS_LAST_MONTH}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

// //payment-status-current-month
// export const getPaymentStatusCurrentMonth = createAsyncThunk(
// 'studio/getPaymentStatusCurrentMonth',
// async () => {
// const res = await axios.get(
// `${process.env.NEXT_PUBLIC_URL_BACKEND_PAYMENTS_STATUS_CURRENT_MONTH}`,
// { headers: getHeaders() }
// );
// return res.data;
// }
// );

// 27. payments-today
export const getPaymentsToday = createAsyncThunk(
  "studio/getPaymentsToday",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_PAYMENTS_TODAY}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

// 28. peak-hours
export const getPeakHours = createAsyncThunk("studio/getPeakHours", async () => {
  const res = await axios.get(
    `${process.env.NEXT_PUBLIC_URL_BACKEND_PEAK_HOURS}`,
    { headers: getHeaders() },
  );
  return res.data;
});

// 29. people
export const getPeoples = createAsyncThunk("studio/getPeoples", async () => {
  const res = await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_PEOPLE}`, {
    headers: getHeaders(),
  });
  return res.data;
});

// 30. plan
export const getPlans = createAsyncThunk("studio/getPlans", async () => {
  const res = await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_PLAN}`, {
    headers: getHeaders(),
  });
  return res.data;
});

// 31. retention-rate
export const getRetentionRate = createAsyncThunk(
  "studio/getRetentionRate",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_RETENTION_RATE}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

// Rooms
export const getRooms = createAsyncThunk("studio/getRooms", async () => {
  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_ROOMS}`,
      {
        headers: getHeaders(),
      },
    );
    return res.data;
  } catch (error) {
    throw error;
  }
});

// 32. slots
export const getSlots = createAsyncThunk("studio/getSlots", async () => {
  const res = await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_SLOTS}`, {
    headers: getHeaders(),
  });
  return res.data;
});

// 33. status-clients
export const getStatusClients = createAsyncThunk(
  "studio/getStatusClients",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_STATUS_CLIENTS}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

// Studios
export const getStudios = createAsyncThunk("studio/getStudios", async () => {
  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_STUDIOS}`,
      {
        headers: getHeaders(),
      },
    );
    return res.data;
  } catch (error) {
    throw error;
  }
});

// 34. teacher-extra-hours
export const getTeacherExtraHours = createAsyncThunk(
  "studio/getTeacherExtraHours",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_TEACHER_EXTRA_HOURS}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

export const getTeacherHours = createAsyncThunk(
  "studio/getTeacherHours",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_TEACHERS_HOURS}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

// 35. teacher_cash_journal_today
export const getTeacherCashJournalToday = createAsyncThunk(
  "studio/getTeacherCashJournalToday",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_TEACHER_CASH_JOURNAL_TODAY}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

// 36. teachers
export const getTeachers = createAsyncThunk("studio/getTeachers", async () => {
  const res = await axios.get(
    `${process.env.NEXT_PUBLIC_URL_BACKEND_TEACHERS}`,
    { headers: getHeaders() },
  );
  return res.data;
});

// 37. teachers-turn
export const getTeachersTurn = createAsyncThunk(
  "studio/getTeachersTurn",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_TEACHERS_TURN}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

export const getTypePlans = createAsyncThunk("studio/getTypePlans", async () => {
  const res = await axios.get(
    `${process.env.NEXT_PUBLIC_URL_BACKEND_TYPE_PLANS}`,
    { headers: getHeaders() },
  );
  return res.data;
});

// 38. total-expenses
export const getTotalExpenses = createAsyncThunk(
  "studio/getTotalExpenses",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_TOTAL_EXPENSES}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

// 39. total-expenses-by-type
export const getTotalExpensesByType = createAsyncThunk(
  "studio/getTotalExpensesByType",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_TOTAL_EXPENSES_BY_TYPE}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

// 40. user-type
export const getUserType = createAsyncThunk("studio/getUserType", async () => {
  const res = await axios.get(
    `${process.env.NEXT_PUBLIC_URL_BACKEND_USERS_TYPE}`,
    { headers: getHeaders() },
  );
  return res.data;
});

// 41. users
export const getUsers = createAsyncThunk("studio/getUsers", async () => {
  const res = await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_USERS}`, {
    headers: getHeaders(),
  });
  return res.data;
});

// 42. waiting-list
export const getWaitingList = createAsyncThunk(
  "studio/getWaitingList",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_WAITING_LIST}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

// 44. notes
export const getNotes = createAsyncThunk("studio/getNotes", async () => {
  const res = await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_NOTES}`, {
    headers: getHeaders(),
  });
  return res.data;
});

// 45. RECIPES
export const getRecipes = createAsyncThunk("studio/getRecipes", async () => {
  const res = await axios.get(
    `${process.env.NEXT_PUBLIC_URL_BACKEND_RECIPES}`,
    { headers: getHeaders() },
  );
  return res.data;
});

// 46. HomePhrase
export const getHomePhrase = createAsyncThunk(
  "studio/getHomePhrase",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_HOME_PHRASE}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

//47. Discounts
export const getDiscounts = createAsyncThunk("studio/getDiscounts", async () => {
  const res = await axios.get(
    `${process.env.NEXT_PUBLIC_URL_BACKEND_COMBO_PLAN_DISCOUNT}`,
    { headers: getHeaders() },
  );

  return res.data;
});

//48. ActivitySubType
export const getActivitySubType = createAsyncThunk(
  "studio/getActivitySubType",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_ACTIVITY_SUB_TYPE}`,
      { headers: getHeaders() },
    );

    return res.data;
  },
);

//49. PlanSubType
export const getPlanSubType = createAsyncThunk(
  "studio/getPlanSubType",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_PLAN_SUB_TYPE}`,
      { headers: getHeaders() },
    );

    return res.data;
  },
);

//50. ActivityType
export const getActivityType = createAsyncThunk(
  "studio/getActivityType",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_ACTIVITY_TYPE}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);


//51. Posts
export const getPosts = createAsyncThunk(
  "studio/getPosts",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_HOME_POSTS}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

//52. Sworn Statements
export const getSwornStatements = createAsyncThunk(
  "studio/getSwornStatements",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_SWORN_STATEMENT}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

//53.Overdue payments
export const getOverduePayments = createAsyncThunk(
  "studio/getOverduePayments",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_OVERDUE_PAYMENTS}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

//52.Overdue payments
export const getSlotTemplates = createAsyncThunk(
  "studio/getSlotTemplates",
  async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_SLOT_TEMPLATES}`,
      { headers: getHeaders() },
    );
    return res.data;
  },
);

//53.Calendar
const addMonthsClamped = (date: Date, months: number) => {
  const year = date.getFullYear();
  const month = date.getMonth() + months;
  const lastDayOfTargetMonth = new Date(year, month + 1, 0).getDate();

  return new Date(
    year,
    month,
    Math.min(date.getDate(), lastDayOfTargetMonth),
  );
};

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const getCalendar = createAsyncThunk(
  "studio/getCalendar",
  async () => {
    const today = new Date();

    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_URL_BACKEND_CALENDAR}`,
      {
        headers: getHeaders(),
        params: {
          date_from: formatLocalDate(addMonthsClamped(today, -1)),
          date_to: formatLocalDate(addMonthsClamped(today, 1)),
        },
      },
    );
    return res.data;
  },
);



// ===================== STATE =====================

interface StudioState {
  loading: boolean;
  loadingCalendar: boolean;
  error: any;
  activityType: any;
  activitySubType: any;
  appointments: any;
  actions: any;
  availableSlots: any;
  averageAge: any;
  averageAgeByHour: any;
  calendar: any;
  cancellationRate: any;
  cashJournal: any;
  cashJournalToday: any;
  clientsByMonth: any;
  clientsByPlan: any;
  discounts: any;
  deletedPeople: any;
  swornStatements: any;
  expenseType: any;
  expenses: any;
  expensesByRange: any;
  expensesTodayTeachers: any;
  extraHours: any;
  generateSlots: any;
  holidays: any;
  homePhrase: any;
  hourView: any;
  login: any;
  margenBruto: any;
  margenNeto: any;
  mostProfitablePlan: any;
  amounts: any;
  notes: any;
  recipes: any;
  overduePayments: any;
  paymentsStatusCurrentMonth: any;
  payments: any;
  paymentsByDayRange: any;
  paymentsLastMonth: any;
  paymentsToday: any;
  peakHours: any;
  peoples: any;
/*   personLastPlan: any;
 */  plans: any;
  plansSubType: any;
  posts: any;
  retentionRate: any;
  rooms: any;
  roomsByStudio: Record<string, any[]>;
  roomsLoadingByStudio: Record<string, boolean>;
  roomsErrorByStudio: Record<string, string | null>;
  slots: any;
  slotTemplates: any;
  statusClients: any;
  studios: any;
  teacherExtraHours: any;
  teacherCashJournalToday: any;
  teachers: any;
  teachersTurn: any;
  teacherHours: any;
  typePlans: any;
  totalExpenses: any;
  totalExpensesByType: any;
  userType: any;
  users: any;
  waitingList: any;
}

const initialState: StudioState = {
  loading: false,
  loadingCalendar: false,
  error: null,
  activityType: [],
  activitySubType: [],
  appointments: [],
  actions: [],
  availableSlots: [],
  averageAge: [],
  averageAgeByHour: [],
  calendar: [],
  cancellationRate: [],
  cashJournal: [],
  cashJournalToday: [],
  clientsByMonth: [],
  clientsByPlan: [],
  deletedPeople: [],
  swornStatements: [],
  discounts: [],
  expenseType: [],
  expenses: [],
  expensesByRange: [],
  expensesTodayTeachers: [],
  extraHours: [],
  generateSlots: [],
  holidays: [],
  homePhrase: [],
  hourView: [],
  login: [],
  margenBruto: [],
  margenNeto: [],
  mostProfitablePlan: [],
  notes: [],
  recipes: [],
  amounts: [],
  overduePayments: [],
  paymentsStatusCurrentMonth: [],
  payments: [],
  paymentsByDayRange: [],
  paymentsLastMonth: [],
  paymentsToday: [],
  peakHours: [],
  peoples: [],
/*   personLastPlan: [],
 */  plans: [],
  plansSubType: [],
  posts: [],
  retentionRate: [],
  rooms: [],
  roomsByStudio: {},
  roomsLoadingByStudio: {},
  roomsErrorByStudio: {},
  slots: [],
  slotTemplates: [],
  statusClients: [],
  studios: [],
  teacherExtraHours: [],
  teacherCashJournalToday: [],
  teachers: [],
  teachersTurn: [],
  teacherHours: [],
  typePlans: [],
  totalExpenses: [],
  totalExpensesByType: [],
  userType: [],
  users: [],
  waitingList: [],
};

// ===================== SLICE =====================

const studioSlice = createSlice({
  name: "studio",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // getAppointments -> appointments
    builder.addCase(getAppointments.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getAppointments.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.appointments = payload ?? [];
    });
    builder.addCase(getAppointments.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.appointments = [];
    });

    builder.addCase(getActions.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getActions.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.actions = payload ?? [];
    });
    builder.addCase(getActions.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.actions = [];
    });

    // getAvailableSlots -> availableSlots
    builder.addCase(getAvailableSlots.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getAvailableSlots.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.availableSlots = payload ?? [];
    });
    builder.addCase(getAvailableSlots.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.availableSlots = [];
    });

    // getAverageAge -> averageAge
    builder.addCase(getAverageAge.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getAverageAge.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.averageAge = payload ?? [];
    });
    builder.addCase(getAverageAge.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.averageAge = [];
    });

    // getAverageAgeByHour -> averageAgeByHour
    builder.addCase(getAverageAgeByHour.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getAverageAgeByHour.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.averageAgeByHour = payload ?? [];
    });
    builder.addCase(getAverageAgeByHour.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.averageAgeByHour = [];
    });

    // getCancellationRate -> cancellationRate
    builder.addCase(getCancellationRate.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getCancellationRate.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.cancellationRate = payload ?? [];
    });
    builder.addCase(getCancellationRate.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.cancellationRate = [];
    });

    // getCashJournal -> cashJournal
    builder.addCase(getCashJournal.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getCashJournal.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.cashJournal = payload ?? [];
    });
    builder.addCase(getCashJournal.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.cashJournal = [];
    });

    // getCashJournalToday -> cashJournalToday
    builder.addCase(getCashJournalToday.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getCashJournalToday.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.cashJournalToday = payload ?? [];
    });
    builder.addCase(getCashJournalToday.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.cashJournalToday = [];
    });

    // getClientsByMonth -> clientsByMonth
    builder.addCase(getClientsByMonth.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getClientsByMonth.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.clientsByMonth = payload ?? [];
    });
    builder.addCase(getClientsByMonth.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.clientsByMonth = [];
    });

    // getClientsByPlan -> clientsByPlan
    builder.addCase(getClientsByPlan.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getClientsByPlan.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.clientsByPlan = payload ?? [];
    });
    builder.addCase(getClientsByPlan.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.clientsByPlan = [];
    });

    // getDeletedPeople -> deletedPeople
    builder.addCase(getDeletedPeople.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getDeletedPeople.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.deletedPeople = payload ?? [];
    });
    builder.addCase(getDeletedPeople.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.deletedPeople = [];
    });

    // getExpenseType -> expenseType
    builder.addCase(getExpenseType.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getExpenseType.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.expenseType = payload ?? [];
    });
    builder.addCase(getExpenseType.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.expenseType = [];
    });

    // getExpenses -> expenses
    builder.addCase(getExpenses.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getExpenses.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.expenses = payload ?? [];
    });
    builder.addCase(getExpenses.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.expenses = [];
    });

    // getExpensesByRange -> expensesByRange
    builder.addCase(getExpensesByRange.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getExpensesByRange.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.expensesByRange = payload ?? [];
    });
    builder.addCase(getExpensesByRange.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.expensesByRange = [];
    });

    // getExpensesTodayTeachers -> expensesTodayTeachers
    builder.addCase(getExpensesTodayTeachers.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(
      getExpensesTodayTeachers.fulfilled,
      (state, { payload }) => {
        state.loading = false;
        state.error = null;
        state.expensesTodayTeachers = payload ?? [];
      },
    );
    builder.addCase(getExpensesTodayTeachers.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.expensesTodayTeachers = [];
    });

    // getExtraHours -> extraHours
    builder.addCase(getExtraHours.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getExtraHours.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.extraHours = payload ?? [];
    });
    builder.addCase(getExtraHours.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.extraHours = [];
    });

    // getGenerateSlots -> generateSlots
    builder.addCase(getGenerateSlots.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getGenerateSlots.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.generateSlots = payload ?? [];
    });
    builder.addCase(getGenerateSlots.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.generateSlots = [];
    });

    // getHolidays -> Holidays
    builder.addCase(getHolidays.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getHolidays.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.holidays = payload ?? [];
    });
    builder.addCase(getHolidays.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.holidays = [];
    });

    // getHourView -> hourView
    builder.addCase(getHourView.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getHourView.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.hourView = payload ?? [];
    });
    builder.addCase(getHourView.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.hourView = [];
    });

    // getLogin -> login
    builder.addCase(getLogin.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getLogin.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.login = payload ?? [];
    });
    builder.addCase(getLogin.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.login = [];
    });

    // getMargenBruto -> margenBruto
    builder.addCase(getMargenBruto.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getMargenBruto.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.margenBruto = payload ?? [];
    });
    builder.addCase(getMargenBruto.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.margenBruto = [];
    });

    // getMargenNeto -> margenNeto
    builder.addCase(getMargenNeto.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getMargenNeto.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.margenNeto = payload ?? [];
    });
    builder.addCase(getMargenNeto.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.margenNeto = [];
    });

    // getMostProfitablePlan -> mostProfitablePlan
    builder.addCase(getMostProfitablePlan.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getMostProfitablePlan.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.mostProfitablePlan = payload ?? [];
    });
    builder.addCase(getMostProfitablePlan.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.mostProfitablePlan = [];
    });

    // getNotes -> notes
    builder.addCase(getNotes.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getNotes.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.notes = payload ?? [];
    });
    builder.addCase(getNotes.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.notes = [];
    });

    // getRecipes -> recipes
    builder.addCase(getRecipes.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getRecipes.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.recipes = payload ?? [];
    });
    builder.addCase(getRecipes.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.recipes = [];
    });

    // getPaymentAmount -> paymentAmount
    builder.addCase(getPaymentAmount.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getPaymentAmount.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.amounts = payload ?? [];
    });
    builder.addCase(getPaymentAmount.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.amounts = [];
    });

    // // getPaymentStatusCurrentMonth -> paymentStatusCurrentMonth
    // builder.addCase(getPaymentStatusCurrentMonth.pending, (state) => {
    // state.error = null;
    // state.loading = true;
    // });
    // builder.addCase(getPaymentStatusCurrentMonth.fulfilled, (state, { payload }) => {
    // state.loading = false;
    // state.error = null;
    // state.paymentStatusCurrentMonth = payload ?? [];
    // });
    // builder.addCase(getPaymentStatusCurrentMonth.rejected, (state, action: any) => {
    // state.loading = false;
    // state.error = action.payload ?? { message: action.error?.message || 'Error' };
    // state.paymentStatusCurrentMonth = [];
    // });

    // getPayments -> payments
    builder.addCase(getPayments.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getPayments.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.payments = payload ?? [];
    });
    builder.addCase(getPayments.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.payments = [];
    });

    // getPaymentsByDayRange -> paymentsByDayRange
    builder.addCase(getPaymentsByDayRange.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getPaymentsByDayRange.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.paymentsByDayRange = payload ?? [];
    });
    builder.addCase(getPaymentsByDayRange.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.paymentsByDayRange = [];
    });

    // getPaymentsLastMonth -> paymentsLastMonth
    builder.addCase(getPaymentsLastMonth.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getPaymentsLastMonth.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.paymentsLastMonth = payload ?? [];
    });
    builder.addCase(getPaymentsLastMonth.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.paymentsLastMonth = [];
    });

    // getPaymentsStatusCurrentMonth -> paymentsStatusCurrentMonth
    builder.addCase(getPaymentsStatusCurrentMonth.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(
      getPaymentsStatusCurrentMonth.fulfilled,
      (state, { payload }) => {
        state.loading = false;
        state.error = null;
        state.paymentsStatusCurrentMonth = payload ?? [];
      },
    );
    builder.addCase(
      getPaymentsStatusCurrentMonth.rejected,
      (state, action: any) => {
        state.loading = false;
        state.error = action.payload ?? {
          message: action.error?.message || "Error",
        };
        state.paymentsStatusCurrentMonth = [];
      },
    );

    // getPaymentsToday -> paymentsToday
    builder.addCase(getPaymentsToday.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getPaymentsToday.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.paymentsToday = payload ?? [];
    });
    builder.addCase(getPaymentsToday.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.paymentsToday = [];
    });

    // getPeakHours -> peakHours
    builder.addCase(getPeakHours.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getPeakHours.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.peakHours = payload ?? [];
    });
    builder.addCase(getPeakHours.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.peakHours = [];
    });

    // getPeople -> people
    builder.addCase(getPeoples.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getPeoples.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.peoples = payload ?? [];
    });
    builder.addCase(getPeoples.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.peoples = [];
    });

    // getPlan -> plan
    builder.addCase(getPlans.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getPlans.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.plans = payload ?? [];
    });
    builder.addCase(getPlans.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.plans = [];
    });

    // getRetentionRate -> retentionRate
    builder.addCase(getRetentionRate.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getRetentionRate.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.retentionRate = payload ?? [];
    });
    builder.addCase(getRetentionRate.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.retentionRate = [];
    });

    // getRooms -> rooms
    builder.addCase(getRooms.pending, (state) => {
      state.error = null;
      state.loading = true;
    });

    builder.addCase(getRooms.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;

      // Guarda todas las salas por compatibilidad con tu UI actual
      state.rooms = Array.isArray(payload) ? payload : [];

      // 🔹 Generar mapa de salas agrupadas por estudio
      const map: Record<string, any[]> = {};
      (state.rooms as any[]).forEach((r) => {
        const sid = studioIdOf(r);
        if (!sid) return;
        if (!map[sid]) map[sid] = [];
        map[sid].push(r);
      });

      // Guardar agrupadas
      state.roomsByStudio = map;

      // Limpiar flags si las usás
      state.roomsLoadingByStudio = {};
      state.roomsErrorByStudio = {};
    });

    builder.addCase(getRooms.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.rooms = [];
      state.roomsByStudio = {}; // opcional: limpiar agrupadas
    });

    // getSlots -> slots
    builder.addCase(getSlots.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getSlots.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.slots = payload ?? [];
    });
    builder.addCase(getSlots.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.slots = [];
    });

    // getStatusClients -> statusClients
    builder.addCase(getStatusClients.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getStatusClients.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.statusClients = payload ?? [];
    });
    builder.addCase(getStatusClients.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.statusClients = [];
    });

    // getStudios -> studios
    builder.addCase(getStudios.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getStudios.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.studios = Array.isArray(payload)
        ? payload
        : (payload?.results ?? []);
    });
    builder.addCase(getStudios.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.studios = [];
    });

    // getTeacherExtraHours -> teacherExtraHours
    builder.addCase(getTeacherExtraHours.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getTeacherExtraHours.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.teacherExtraHours = payload ?? [];
    });
    builder.addCase(getTeacherExtraHours.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.teacherExtraHours = [];
    });

    // getTeacherExtraHours -> teacherExtraHours
    builder.addCase(getTeacherHours.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getTeacherHours.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.teacherHours = payload ?? [];
    });
    builder.addCase(getTeacherHours.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.teacherHours = [];
    });

    // getTeacherCashJournalToday -> teacherCashJournalToday
    builder.addCase(getTeacherCashJournalToday.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(
      getTeacherCashJournalToday.fulfilled,
      (state, { payload }) => {
        state.loading = false;
        state.error = null;
        state.teacherCashJournalToday = payload ?? [];
      },
    );
    builder.addCase(
      getTeacherCashJournalToday.rejected,
      (state, action: any) => {
        state.loading = false;
        state.error = action.payload ?? {
          message: action.error?.message || "Error",
        };
        state.teacherCashJournalToday = [];
      },
    );

    // getTeachers -> teachers
    builder.addCase(getTeachers.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getTeachers.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.teachers = payload ?? [];
    });
    builder.addCase(getTeachers.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.teachers = [];
    });

    // getTeachersTurn -> teachersTurn
    builder.addCase(getTeachersTurn.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getTeachersTurn.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.teachersTurn = payload ?? [];
    });
    builder.addCase(getTeachersTurn.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.teachersTurn = [];
    });

    // getTeachersTurn -> teachersTurn
    builder.addCase(getTypePlans.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getTypePlans.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.typePlans = payload ?? [];
    });
    builder.addCase(getTypePlans.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.typePlans = [];
    });

    // getTotalExpenses -> totalExpenses
    builder.addCase(getTotalExpenses.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getTotalExpenses.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.totalExpenses = payload ?? [];
    });
    builder.addCase(getTotalExpenses.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.totalExpenses = [];
    });

    // getTotalExpensesByType -> totalExpensesByType
    builder.addCase(getTotalExpensesByType.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getTotalExpensesByType.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.totalExpensesByType = payload ?? [];
    });
    builder.addCase(getTotalExpensesByType.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.totalExpensesByType = [];
    });

    // getUserType -> userType
    builder.addCase(getUserType.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getUserType.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.userType = payload ?? [];
    });
    builder.addCase(getUserType.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.userType = [];
    });

    // getUsers -> users
    builder.addCase(getUsers.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getUsers.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.users = payload ?? [];
    });
    builder.addCase(getUsers.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.users = [];
    });

    // getWaitingList -> waitingList
    builder.addCase(getWaitingList.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getWaitingList.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.waitingList = payload ?? [];
    });
    builder.addCase(getWaitingList.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.waitingList = [];
    });

    //getDiscounts -> discounts
    builder.addCase(getDiscounts.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getDiscounts.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.discounts = payload ?? [];
    });
    builder.addCase(getDiscounts.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.discounts = [];
    });

    //getHomePhrase -> homePhrase
    builder.addCase(getHomePhrase.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getHomePhrase.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.homePhrase = payload ?? [];
    });
    builder.addCase(getHomePhrase.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.homePhrase = [];
    });

    builder.addCase(getActivityType.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getActivityType.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.activityType = payload ?? [];
    });
    builder.addCase(getActivityType.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.activityType = [];
    });

    builder.addCase(getActivitySubType.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getActivitySubType.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.activitySubType = payload ?? [];
    });
    builder.addCase(getActivitySubType.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.activitySubType = [];
    });

    builder.addCase(getPlanSubType.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getPlanSubType.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.plansSubType = payload ?? [];
    });
    builder.addCase(getPlanSubType.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.plansSubType = [];
    });

    builder.addCase(getPosts.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getPosts.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.posts = payload ?? [];
    });
    builder.addCase(getPosts.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.posts = [];
    });

    builder.addCase(getSwornStatements.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getSwornStatements.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.swornStatements = payload ?? [];
    });
    builder.addCase(getSwornStatements.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.swornStatements = [];
    });

    builder.addCase(getOverduePayments.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getOverduePayments.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.overduePayments = payload ?? [];
    });
    builder.addCase(getOverduePayments.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.overduePayments = [];
    });

    builder.addCase(getSlotTemplates.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getSlotTemplates.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.slotTemplates = payload ?? [];
    });
    builder.addCase(getSlotTemplates.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.slotTemplates = [];
    });

    builder.addCase(getCalendar.pending, (state) => {
      state.error = null;
      state.loading = true;
      state.loadingCalendar = true;
    });
    builder.addCase(getCalendar.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.loadingCalendar = false;
      state.error = null;
      state.calendar = payload ?? [];
    });
    builder.addCase(getCalendar.rejected, (state, action: any) => {
      state.loading = false;
      state.loadingCalendar = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.calendar = [];
    });
    
   /*  builder.addCase(getPersonLastPlan.pending, (state) => {
      state.error = null;
      state.loading = true;
    });
    builder.addCase(getPersonLastPlan.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.error = null;
      state.personLastPlan = payload ?? [];
    });
    builder.addCase(getPersonLastPlan.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload ?? {
        message: action.error?.message || "Error",
      };
      state.personLastPlan = [];
    }); */
  },
});





// ===================== SELECTORES =====================

// 🔹 Devuelve solo las salas que pertenecen al estudio indicado (según su ID)
export const selectRoomsForStudio = (
  state: any,
  studioId?: number | string,
) => {
  if (!studioId) return [];
  const key = String(studioId);
  const byMap = state.studio.roomsByStudio?.[key];
  if (Array.isArray(byMap)) return byMap;

  // Fallback: si todavía no se armó el mapa de roomsByStudio, filtra manualmente
  const all = state.studio.rooms ?? [];
  return all.filter((r: any) => String(r?.studio) === key);
};

// 🔹 Indica si las salas del estudio especificado están actualmente cargando
export const selectRoomsLoading = (state: any, studioId?: number | string) =>
  studioId != null
    ? !!state.studio.roomsLoadingByStudio?.[String(studioId)]
    : false;

// 🔹 Devuelve el error (si existe) al cargar las salas del estudio especificado
export const selectRoomsError = (state: any, studioId?: number | string) =>
  studioId != null
    ? (state.studio.roomsErrorByStudio?.[String(studioId)] ?? null)
    : null;

export default studioSlice.reducer;
