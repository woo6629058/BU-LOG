package com.bulog.domain.exhibit.exception.code;

import com.bulog.global.apiPayload.code.BaseErrorCode;
import com.bulog.global.apiPayload.code.ErrorReasonDTO;
import org.springframework.http.HttpStatus;

public enum ExhibitErrorCode implements BaseErrorCode {

    EXHIBIT_NOT_FOUND(HttpStatus.NOT_FOUND, "EXHIBIT_404_001", "전시물을 찾을 수 없습니다."),
    EXHIBIT_IMAGE_NOT_FOUND(HttpStatus.NOT_FOUND, "EXHIBIT_404_002", "전시물 이미지를 찾을 수 없습니다."),
    EMUSEUM_NOT_CONFIGURED(
            HttpStatus.SERVICE_UNAVAILABLE,
            "EXHIBIT_503_001",
            "e뮤지엄 연동 설정이 필요합니다."
    ),
    EMUSEUM_UNAVAILABLE(
            HttpStatus.SERVICE_UNAVAILABLE,
            "EXHIBIT_503_002",
            "e뮤지엄 서비스를 일시적으로 이용할 수 없습니다."
    );

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
