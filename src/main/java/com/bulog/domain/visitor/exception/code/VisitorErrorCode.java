package com.bulog.domain.visitor.exception.code;

import com.bulog.global.apiPayload.code.BaseErrorCode;
import com.bulog.global.apiPayload.code.ErrorReasonDTO;
import org.springframework.http.HttpStatus;

public enum VisitorErrorCode implements BaseErrorCode {

    VISITOR_NOT_FOUND(HttpStatus.NOT_FOUND, "VISITOR_404_001", "방문자 정보를 찾을 수 없습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;

    VisitorErrorCode(HttpStatus httpStatus, String code, String message) {
        this.httpStatus = httpStatus;
        this.code = code;
        this.message = message;
    }

    @Override
    public ErrorReasonDTO getReason() {
        return new ErrorReasonDTO(null, false, code, message);
    }

    @Override
    public ErrorReasonDTO getReasonHttpStatus() {
        return new ErrorReasonDTO(httpStatus, false, code, message);
    }
}
