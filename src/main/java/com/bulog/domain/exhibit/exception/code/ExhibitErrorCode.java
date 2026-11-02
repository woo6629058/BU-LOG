package com.bulog.domain.exhibit.exception.code;

import com.bulog.global.apiPayload.code.BaseErrorCode;
import com.bulog.global.apiPayload.code.ErrorReasonDTO;
import org.springframework.http.HttpStatus;

public enum ExhibitErrorCode implements BaseErrorCode {

    EXHIBIT_NOT_FOUND(HttpStatus.NOT_FOUND, "EXHIBIT_404_001", "전시물을 찾을 수 없습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;

    ExhibitErrorCode(HttpStatus httpStatus, String code, String message) {
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
