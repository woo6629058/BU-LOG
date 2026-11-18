package com.bulog.domain.halloffame.exception.code;

import com.bulog.global.apiPayload.code.BaseCode;
import com.bulog.global.apiPayload.code.SuccessReasonDTO;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum HallOfFameSuccessCode implements BaseCode {

    HALL_OF_FAME_FOUND(HttpStatus.OK, "HALL_200_001", "명예의 전당 조회에 성공했습니다."),
    FINISHER_FOUND(HttpStatus.OK, "HALL_200_002", "완주자 조회에 성공했습니다.");

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
