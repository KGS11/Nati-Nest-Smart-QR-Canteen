import { NextFunction, Request, Response } from "express";
import { feedbackService } from "../services/feedback.service";

export class FeedbackController {
  async submitFeedback(request: Request, response: Response, next: NextFunction) {
    try {
      const { rating, comment } = request.body as { rating: number; comment?: string };
      const feedback = await feedbackService.submitFeedback(request.session!.sessionId, {
        rating,
        comment,
      });

      return response.status(201).json({
        success: true,
        message: "Thank you for your feedback!",
        data: {
          feedback: {
            id: feedback.id,
            rating: feedback.rating,
            comment: feedback.comment,
            createdAt: feedback.createdAt,
          },
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  async getAllFeedback(request: Request, response: Response, next: NextFunction) {
    try {
      const { page, limit, rating, startDate, endDate } = request.query as unknown as {
        page: number;
        limit: number;
        rating?: number;
        startDate?: string;
        endDate?: string;
      };

      const result = await feedbackService.getAllFeedback({
        page,
        limit,
        rating,
        startDate,
        endDate,
      });

      return response.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getFeedbackStatus(request: Request, response: Response, next: NextFunction) {
    try {
      const feedback = await feedbackService.getFeedbackBySession(request.session!.sessionId);

      return response.status(200).json({
        success: true,
        data: {
          submitted: feedback !== null,
          feedback,
        },
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const feedbackController = new FeedbackController();
