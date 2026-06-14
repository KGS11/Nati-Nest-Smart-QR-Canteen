import { z } from "zod";
export { validateZodQuery } from "./feedback.validators";

const requiredString = (field: string) =>
  z
    .unknown()
    .superRefine((val, context) => {
      if (val === undefined) {
        context.addIssue({ code: "custom", message: `${field} is required` });
        return;
      }

      if (typeof val !== "string") {
        context.addIssue({ code: "custom", message: `${field} must be a string` });
      }
    })
    .transform((val) => val as string);

const dateRangeFields = z.object({
  startDate: requiredString("startDate").refine(
    (val) => !isNaN(Date.parse(val)),
    "startDate must be a valid date (YYYY-MM-DD)",
  ),
  endDate: requiredString("endDate").refine(
    (val) => !isNaN(Date.parse(val)),
    "endDate must be a valid date (YYYY-MM-DD)",
  ),
});

const withValidDateOrder = <T extends z.ZodTypeAny>(schema: T) =>
  schema.refine(
    (data) => {
      const value = data as { startDate: string; endDate: string };
      return new Date(value.startDate) <= new Date(value.endDate);
    },
    {
      message: "startDate must not be after endDate",
      path: ["startDate"],
    },
  );

export const dateRangeSchema = withValidDateOrder(dateRangeFields);

export const dateRangeWithPaginationSchema = withValidDateOrder(
  dateRangeFields.extend({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .refine((val) => val > 0, "Page must be greater than 0"),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 20))
      .refine((val) => val > 0 && val <= 100, "Limit must be between 1 and 100"),
  }),
);

export const groupBySchema = withValidDateOrder(
  dateRangeFields.extend({
    groupBy: z
      .string()
      .optional()
      .transform((val) => val ?? "day")
      .refine(
        (val): val is "day" | "week" | "month" =>
          val === "day" || val === "week" || val === "month",
        "groupBy must be day, week, or month",
      ),
  }),
);

export const popularItemsSchema = withValidDateOrder(
  dateRangeFields.extend({
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10))
      .refine((val) => val > 0 && val <= 50, "Limit must be between 1 and 50"),
    categoryId: z.string().uuid("categoryId must be a valid UUID").optional(),
  }),
);

import { getStartOfDayInTimezone, getEndOfDayInTimezone } from "../utils/date.utils";

export const getStartOfDay = (dateString: string): Date => {
  return getStartOfDayInTimezone(dateString, process.env.APP_TIMEZONE ?? "Asia/Kolkata");
};

export const getEndOfDay = (dateString: string): Date => {
  return getEndOfDayInTimezone(dateString, process.env.APP_TIMEZONE ?? "Asia/Kolkata");
};
