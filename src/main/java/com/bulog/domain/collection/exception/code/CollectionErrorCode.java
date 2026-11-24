package com.bulog.domain.collection.exception.code;

import com.bulog.global.apiPayload.code.BaseErrorCode;
import com.bulog.global.apiPayload.code.ErrorReasonDTO;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum CollectionErrorCode implements BaseErrorCode {

    RECORD_NOT_FOUND(HttpStatus.NOT_FOUND, "COLLECTION_404_001", "수집 기록을 찾을 수 없습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;

    @Override
    public ErrorReasonDTO getReason() {
        return new ErrorReasonDTO(null, false, code, message);
    }

    @Override
    public ErrorReasonDTO getReasonHttpStatus() {
        return new ErrorReasonDTO(httpStatus, false, code, message);
    }
}
