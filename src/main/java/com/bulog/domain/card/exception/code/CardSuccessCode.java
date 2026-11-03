package com.bulog.domain.card.exception.code;

import com.bulog.global.apiPayload.code.BaseCode;
import com.bulog.global.apiPayload.code.SuccessReasonDTO;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum CardSuccessCode implements BaseCode {

    ARCHIVE_FOUND(HttpStatus.OK, "CARD_200_001", "아카이브 조회에 성공했습니다."),
    CARD_FOUND(HttpStatus.OK, "CARD_200_002", "카드 조회에 성공했습니다.");

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
