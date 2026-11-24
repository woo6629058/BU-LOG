package com.bulog.domain.collection.exception.code;

import com.bulog.global.apiPayload.code.BaseCode;
import com.bulog.global.apiPayload.code.SuccessReasonDTO;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum CollectionSuccessCode implements BaseCode {

    ARCHIVE_FOUND(HttpStatus.OK, "COLLECTION_200_001", "아카이브 조회에 성공했습니다."),
    RECORD_FOUND(HttpStatus.OK, "COLLECTION_200_002", "수집 기록 조회에 성공했습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;

    @Override
    public SuccessReasonDTO getReason() {
        return new SuccessReasonDTO(null, true, code, message);
    }

    @Override
    public SuccessReasonDTO getReasonHttpStatus() {
        return new SuccessReasonDTO(httpStatus, true, code, message);
    }
}
