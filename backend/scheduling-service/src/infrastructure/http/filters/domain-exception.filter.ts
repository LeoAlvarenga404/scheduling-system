import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { AppointmentNotFoundError } from '../../../domain/errors/appointment-not-found.error';
import { InvalidAppointmentStateError } from '../../../domain/errors/invalid-appointment-state.error';
import { AppointmentValidationError } from '../../../domain/errors/appointment-validation.error';
import { SchedulingConflictsError } from '../../../domain/errors/scheduling-conflicts.error';
import { HoldExpiredError } from '../../../domain/errors/hold-expired.error';
import { AlreadyConfirmedWithOtherPaymentError } from '../../../domain/errors/already-confirmed-with-other-payment.error';

@Catch(
  AppointmentNotFoundError,
  InvalidAppointmentStateError,
  AppointmentValidationError,
  SchedulingConflictsError,
  HoldExpiredError,
  AlreadyConfirmedWithOtherPaymentError
)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = exception.message || 'Internal server error';

    if (exception instanceof AppointmentNotFoundError) {
      status = HttpStatus.NOT_FOUND;
    } else if (exception instanceof AppointmentValidationError || exception instanceof InvalidAppointmentStateError) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
    } else if (exception instanceof SchedulingConflictsError) {
      status = HttpStatus.CONFLICT;
    } else if (exception instanceof HoldExpiredError || exception instanceof AlreadyConfirmedWithOtherPaymentError) {
      status = HttpStatus.BAD_REQUEST;
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: exception.constructor.name
    });
  }
}
