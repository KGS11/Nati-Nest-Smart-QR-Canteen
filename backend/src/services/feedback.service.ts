import {
  Feedback,
  PaymentStatus,
  Prisma,
  SessionStatus,
} from "@prisma/client";
import { Server } from "socket.io";
import { prisma } from "../config/db";
import { ROOMS } from "../sockets/rooms";
import { AppError } from "../utils/AppError";

type SubmitFeedbackData = {
  rating: number;
  comment?: string;
};

type GetFeedbackParams = {
  page: number;
  limit: number;
  rating?: number;
  startDate?: string;
  endDate?: string;
};

type RatingBreakdown = {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
};

const getIo = (): Server => {
  const { io } = require("../index") as typeof import("../index");
  return io;
};

const buildFeedbackWhere = (params: Pick<GetFeedbackParams, "rating" | "startDate" | "endDate">) => {
  const where: Prisma.FeedbackWhereInput = {};

  if (params.rating !== undefined) {
    where.rating = params.rating;
  }

  if (params.startDate || params.endDate) {
    where.createdAt = {};

    if (params.startDate) {
      where.createdAt.gte = new Date(params.startDate);
    }

    if (params.endDate) {
      const endOfDay = new Date(params.endDate);
      endOfDay.setHours(23, 59, 59, 999);
      where.createdAt.lte = endOfDay;
    }
  }

  return where;
};

const alreadySubmittedError = () =>
  new AppError("Feedback has already been submitted for this session.", 409);

export class FeedbackService {
  async submitFeedback(sessionId: string, data: SubmitFeedbackData): Promise<Feedback> {
    try {
      const session = await prisma.tableSession.findUnique({
        where: { id: sessionId },
        include: {
          table: {
            select: { tableNumber: true },
          },
        },
      });

      if (!session) {
        throw new AppError("Session not found", 404);
      }

      if (session.status !== SessionStatus.CLOSED) {
        throw new AppError("Feedback can only be submitted after your session has ended.", 400);
      }

      const payment = await prisma.payment.findUnique({
        where: { sessionId },
      });

      if (!payment) {
        throw new AppError("No payment record found for this session.", 400);
      }

      if (payment.status !== PaymentStatus.COMPLETED) {
        throw new AppError(
          "Feedback can only be submitted after payment has been completed.",
          400,
        );
      }

      const existingFeedback = await prisma.feedback.findUnique({
        where: { sessionId },
      });

      if (existingFeedback) {
        throw alreadySubmittedError();
      }

      const feedback = await prisma.feedback.create({
        data: {
          sessionId,
          rating: data.rating,
          comment: data.comment ?? null,
        },
      });

      getIo().to(ROOMS.kitchen).emit("feedback:new", {
        feedbackId: feedback.id,
        sessionId,
        tableNumber: session.table.tableNumber,
        rating: feedback.rating,
        comment: feedback.comment,
        createdAt: feedback.createdAt,
      });

      return feedback;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw alreadySubmittedError();
      }

      throw error;
    }
  }

  async getAllFeedback(params: GetFeedbackParams) {
    try {
      const where = buildFeedbackWhere(params);
      const offset = (params.page - 1) * params.limit;

      const [feedback, total, aggregate, groupedRatings] = await Promise.all([
        prisma.feedback.findMany({
          where,
          include: {
            session: {
              select: {
                table: {
                  select: { tableNumber: true },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: params.limit,
        }),
        prisma.feedback.count({ where }),
        prisma.feedback.aggregate({
          where,
          _avg: { rating: true },
          _count: { rating: true },
        }),
        prisma.feedback.groupBy({
          by: ["rating"],
          where,
          _count: { rating: true },
        }),
      ]);

      const ratingBreakdown: RatingBreakdown = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };

      groupedRatings.forEach((ratingGroup) => {
        if (ratingGroup.rating >= 1 && ratingGroup.rating <= 5) {
          ratingBreakdown[ratingGroup.rating as keyof RatingBreakdown] =
            ratingGroup._count.rating;
        }
      });

      const averageRating = aggregate._avg.rating
        ? Math.round(aggregate._avg.rating * 100) / 100
        : 0;

      return {
        feedback,
        pagination: {
          total,
          page: params.page,
          limit: params.limit,
          totalPages: Math.ceil(total / params.limit),
        },
        summary: {
          averageRating,
          totalCount: total,
          ratingBreakdown,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async getFeedbackBySession(sessionId: string) {
    try {
      return prisma.feedback.findUnique({
        where: { sessionId },
        include: {
          session: {
            select: {
              table: {
                select: { tableNumber: true },
              },
            },
          },
        },
      });
    } catch (error) {
      throw error;
    }
  }
}

export const feedbackService = new FeedbackService();
