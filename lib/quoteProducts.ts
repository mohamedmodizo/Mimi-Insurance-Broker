export type QuoteProductGroup = {
  value: string;
  label: string;
  products: Array<{ value: string; label: string }>;
};

export const quoteProductGroups: QuoteProductGroup[] = [
  {
    value: "INVESTMENT",
    label: "Investment and savings",
    products: [
      { value: "MONEY_MARKET_FUND", label: "Money market fund" },
      { value: "EQUITY_FUND", label: "Equity fund" },
      { value: "BALANCED_FUND", label: "Balanced fund" },
      { value: "FIXED_INCOME_FUND", label: "Fixed income fund" },
      { value: "UNIT_LINKED_INVESTMENT", label: "Unit-linked investment" },
      { value: "RETIREMENT_SAVINGS", label: "Retirement savings" }
    ]
  },
  {
    value: "LONG_TERM",
    label: "Long-term protection",
    products: [
      { value: "EDUCATION_PLAN", label: "Education plan" },
      { value: "LAST_EXPENSE", label: "Last expense cover" },
      { value: "LIFE_ASSURANCE", label: "Life assurance" },
      { value: "ENDOWMENT_PLAN", label: "Endowment plan" },
      { value: "RETIREMENT_PENSION", label: "Retirement or pension plan" },
      { value: "GROUP_LIFE", label: "Group life cover" }
    ]
  },
  {
    value: "MOTOR",
    label: "Motor insurance",
    products: [
      { value: "COMPREHENSIVE_MOTOR", label: "Comprehensive motor" },
      { value: "THIRD_PARTY_MOTOR", label: "Third-party motor" },
      { value: "COMMERCIAL_VEHICLE", label: "Commercial vehicle" },
      { value: "MOTORCYCLE", label: "Motorcycle" }
    ]
  },
  {
    value: "HEALTH",
    label: "Health and medical",
    products: [
      { value: "INDIVIDUAL_MEDICAL", label: "Individual medical" },
      { value: "FAMILY_MEDICAL", label: "Family medical" },
      { value: "CORPORATE_MEDICAL", label: "Corporate medical" },
      { value: "TRAVEL_MEDICAL", label: "Travel medical" }
    ]
  },
  {
    value: "PROPERTY",
    label: "Property and home",
    products: [
      { value: "HOME_BUILDING", label: "Home building" },
      { value: "HOUSEHOLD_CONTENTS", label: "Household contents" },
      { value: "COMMERCIAL_PROPERTY", label: "Commercial property" },
      { value: "FIRE_PROPERTY", label: "Fire and special perils" }
    ]
  },
  {
    value: "TRAVEL",
    label: "Travel insurance",
    products: [
      { value: "SINGLE_TRIP", label: "Single trip" },
      { value: "ANNUAL_TRAVEL", label: "Annual travel" },
      { value: "STUDENT_TRAVEL", label: "Student travel" }
    ]
  },
  {
    value: "BUSINESS",
    label: "Business and commercial",
    products: [
      { value: "BUSINESS_COMBINED", label: "Business combined" },
      { value: "LIABILITY", label: "Liability" },
      { value: "MARINE_CARGO", label: "Marine and cargo" },
      { value: "WORK_INJURY", label: "Work injury benefits" }
    ]
  },
  {
    value: "PERSONAL_ACCIDENT",
    label: "Personal accident",
    products: [{ value: "PERSONAL_ACCIDENT", label: "Personal accident cover" }]
  }
];
