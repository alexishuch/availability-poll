import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class CustomExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(CustomExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const userAgent = request.get('user-agent') || '';

        const isHttpException = exception instanceof HttpException;
        const statusCode = isHttpException ? exception.getStatus() : 500;
        const exceptionResponse = isHttpException ? exception.getResponse() : null;
        const responseMessage = isHttpException
            ? (exceptionResponse as any).error || 'Internal server error'
            : 'Internal server error';
        const log = `${request.method} ${request.url} ${statusCode} - ${userAgent} ${request.ip}`;

        if (isHttpException) {
            this.logger.warn(`${log} - ${(exceptionResponse as any).message}`);
        } else {
            this.logger.error(log, exception);
        }

        response.status(statusCode).json({
            statusCode,
            message: responseMessage
        });
    }
}
