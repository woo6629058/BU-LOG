package com.bulog.domain.exhibit.exception.code;

import com.bulog.global.apiPayload.code.BaseCode;
import com.bulog.global.apiPayload.code.SuccessReasonDTO;
import org.springframework.http.HttpStatus;

public enum ExhibitSuccessCode implements BaseCode {

    EXHIBIT_FOUND(HttpStatus.OK, "EXHIBIT_200_001", "전시물 조회에 성공했습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;

    ExhibitSuccessCode(HttpStatus httpStatus, String code, String message) {
        this.httpStatus = httpStatus;
        this.code = code;
        this.message = message;
    }

    @Override
    public SuccessReasonDTO getReason() {
        return new SuccessReasonDTO(null, true, code, message);
    }

    @Override
    public SuccessReasonDTO getReasonHttpStatus() {
        return new SuccessReasonDTO(httpStatus, true, code, message);
    }
}
