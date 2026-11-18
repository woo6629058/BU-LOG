package com.bulog.domain.halloffame.exception.code;

import com.bulog.global.apiPayload.code.BaseErrorCode;
import com.bulog.global.apiPayload.code.ErrorReasonDTO;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum HallOfFameErrorCode implements BaseErrorCode {

    FINISHER_NOT_FOUND(HttpStatus.NOT_FOUND, "HALL_404_001", "완주 기록을 찾을 수 없습니다.");

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
