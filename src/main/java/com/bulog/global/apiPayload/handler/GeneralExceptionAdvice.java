package com.bulog.global.apiPayload.handler;

import com.bulog.global.apiPayload.ApiResponse;
import com.bulog.global.apiPayload.code.BaseErrorCode;
import com.bulog.global.apiPayload.code.ErrorReasonDTO;
import com.bulog.global.apiPayload.code.GeneralErrorCode;
import com.bulog.global.apiPayload.exception.GeneralException;
import jakarta.validation.ConstraintViolationException;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@Slf4j
@RestControllerAdvice
public class GeneralExceptionAdvice {

    @ExceptionHandler(GeneralException.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneralException(GeneralException exception) {
        return createResponse(exception.getErrorCode(), exception.getErrorDetail());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodArgumentNotValid(
            MethodArgumentNotValidException exception
    ) {
        Map<String, String> errors = new LinkedHashMap<>();
        for (FieldError fieldError : exception.getBindingResult().getFieldErrors()) {
            errors.putIfAbsent(fieldError.getField(), fieldError.getDefaultMessage());
        }
        return createResponse(GeneralErrorCode.COMMON_400_002, errors);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraintViolation(
            ConstraintViolationException exception
    ) {
        return createResponse(
                GeneralErrorCode.COMMON_400_002,
                Map.of("message", exception.getMessage())
        );
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodArgumentTypeMismatch(
            MethodArgumentTypeMismatchException exception
    ) {
        return createResponse(
                GeneralErrorCode.COMMON_400_002,
                Map.of(exception.getName(), "요청값의 형식이 올바르지 않습니다.")
        );
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingRequestParameter(
            MissingServletRequestParameterException exception
    ) {
        return createResponse(
                GeneralErrorCode.COMMON_400_001,
                Map.of(exception.getParameterName(), "필수 요청값입니다.")
        );
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleHttpMessageNotReadable() {
        return createResponse(
                GeneralErrorCode.COMMON_400_001,
                Map.of("message", "요청 본문을 읽을 수 없습니다.")
        );
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodNotSupported() {
        return createResponse(GeneralErrorCode.COMMON_405_001);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNoResourceFound() {
        return createResponse(GeneralErrorCode.COMMON_404_001);
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataAccessException(DataAccessException exception) {
        log.error("데이터베이스 처리 중 오류가 발생했습니다.", exception);
        return createResponse(GeneralErrorCode.COMMON_503_001);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnexpectedException(Exception exception) {
        log.error("처리되지 않은 예외가 발생했습니다.", exception);
        return createResponse(GeneralErrorCode.COMMON_500_001);
    }

    private ResponseEntity<ApiResponse<Void>> createResponse(BaseErrorCode errorCode) {
        return createResponse(errorCode, Map.of());
    }

    private ResponseEntity<ApiResponse<Void>> createResponse(
            BaseErrorCode errorCode,
            Object errorDetail
    ) {
        ErrorReasonDTO reason = errorCode.getReasonHttpStatus();
        return ResponseEntity
                .status(reason.httpStatus())
                .body(ApiResponse.onFailure(errorCode, errorDetail));
    }
}
